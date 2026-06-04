import { eq } from "drizzle-orm";
import mysql from "mysql2/promise";
import { customers } from "../drizzle/schema";
import { getDb } from "./db";

const DAILY_BAGEL_REPORT_BASE =
  "https://operation.hjacobo.com/public/daily-orders-report-index";

const BRANCH_CUSTOMERS = [
  { code: "pk", label: "PK", customerName: "Hinnawi Bros Pk", totalField: "pk_total" },
  { code: "mk", label: "MK", customerName: "Hinnawi Bros Mk", totalField: "mk_total" },
  { code: "tun", label: "TUN", customerName: "Hinnawi Bros Tunnel", totalField: "tun_total" },
  { code: "ont", label: "ONT", customerName: "Hinnawi Bros Ontario", totalField: "ont_total" },
] as const;

type BranchCode = (typeof BRANCH_CUSTOMERS)[number]["code"];

interface DailyBagelReportItem {
  item_name: string;
  quantity_var?: string;
  pk_total?: number;
  mk_total?: number;
  tun_total?: number;
  ont_total?: number;
}

interface DailyBagelReport {
  results?: Record<string, DailyBagelReportItem>;
}

export interface SyncedBranchOrder {
  branch: BranchCode;
  customerName: string;
  customerId: number;
  orderNumber: string;
  orderId: number;
  action: "created" | "updated";
  itemCount: number;
  totalUnits: number;
  totalDozens: number;
  total: number;
}

function parseReportDate(date: string): Date {
  return new Date(`${date}T12:00:00`);
}

function legacyDailyOrderNumber(branch: BranchCode, date: string): string {
  return `HJ-BAGEL-${branch.toUpperCase()}-${date.replaceAll("-", "")}`;
}

function compactDate(date: string): string {
  return date.replaceAll("-", "");
}

function orderPeriodKey(fromDate: string, toDate: string): string {
  if (fromDate === toDate) return compactDate(fromDate);
  return `${compactDate(fromDate).slice(2)}${compactDate(toDate).slice(2)}`;
}

function dailyOrderNumber(branch: BranchCode, fromDate: string, toDate: string): string {
  return `HB-${branch.toUpperCase()}-${orderPeriodKey(fromDate, toDate)}`;
}

function previousDailyOrderNumber(branch: BranchCode, date: string): string {
  return `HB-BG-${branch.toUpperCase()}-${compactDate(date)}`;
}

function orderNumberCandidates(branch: BranchCode, fromDate: string, toDate: string): string[] {
  const candidates = [dailyOrderNumber(branch, fromDate, toDate)];

  if (fromDate === toDate) {
    candidates.push(previousDailyOrderNumber(branch, fromDate));

    const legacy = legacyDailyOrderNumber(branch, fromDate);
    if (legacy.length <= 20) candidates.push(legacy);
  }

  return Array.from(new Set(candidates));
}

function normalizeQuantityToDozens(quantity: number, quantityVar: string | undefined): number {
  const unit = (quantityVar || "unit").toLowerCase();
  if (unit === "dozen" || unit === "dz") return quantity;
  return quantity / 12;
}

async function getOrCreateBranchCustomer(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  customerName: string,
  branch: BranchCode
): Promise<number> {
  const existing = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.businessName, customerName))
    .limit(1);

  if (existing.length > 0) return existing[0].id;

  const inserted = await db.insert(customers).values({
    businessName: customerName,
    contactName: customerName,
    email: `${branch}-daily-orders@hinnawi.local`,
    segment: "other",
    status: "active",
    notes: "Auto-created for operation.hjacobo.com daily bagel order synchronization.",
  });

  return inserted[0].insertId;
}

export async function syncDailyBagelOrders(input: {
  fromDate: string;
  toDate: string;
  pricePerDozen: number;
}): Promise<{
  fromDate: string;
  toDate: string;
  sourceUrl: string;
  pricePerDozen: number;
  orders: SyncedBranchOrder[];
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not configured");

  const raw = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    const { fromDate, toDate, pricePerDozen } = input;
    if (fromDate > toDate) {
      throw new Error("Start date must be before or equal to end date");
    }

    const sourceUrl = `${DAILY_BAGEL_REPORT_BASE}/${fromDate}/${toDate}/%20/%20/bagel`;
    const response = await fetch(sourceUrl, { headers: { Accept: "application/json" } });
    if (!response.ok) {
      throw new Error(`Daily bagel report request failed (${response.status})`);
    }

    const report = (await response.json()) as DailyBagelReport;
    const items = Object.values(report.results || {});
    const deliveryDate = parseReportDate(toDate);
    const synced: SyncedBranchOrder[] = [];

    for (const branch of BRANCH_CUSTOMERS) {
      const customerId = await getOrCreateBranchCustomer(db, branch.customerName, branch.code);
      const lineItems = items
        .map((item) => {
          const rawQuantity = Number(item[branch.totalField] || 0);
          const dozens = normalizeQuantityToDozens(rawQuantity, item.quantity_var);
          const lineTotal = Number((dozens * pricePerDozen).toFixed(2));
          return {
            product: item.item_name,
            quantity: Number(dozens.toFixed(4)),
            unitPrice: pricePerDozen,
            lineTotal,
            rawQuantity,
          };
        })
        .filter((item) => item.rawQuantity > 0);

      if (lineItems.length === 0) continue;

      const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
      const totalUnits = lineItems.reduce((sum, item) => sum + item.rawQuantity, 0);
      const totalDozens = lineItems.reduce((sum, item) => sum + item.quantity, 0);
      const orderNumber = dailyOrderNumber(branch.code, fromDate, toDate);
      const candidates = orderNumberCandidates(branch.code, fromDate, toDate);
      const notes = [
        `Daily bagel orders sync from operation.hjacobo.com`,
        `Branch: ${branch.label}`,
        `Report period: ${fromDate} to ${toDate}`,
        `Source: ${sourceUrl}`,
        `Price per dozen: $${pricePerDozen.toFixed(2)}`,
      ].join(" | ");

      const placeholders = candidates.map(() => "?").join(", ");
      const [existingRows] = await raw.execute(
        `SELECT id, orderNumber FROM orders WHERE orderNumber IN (${placeholders}) LIMIT 1`,
        candidates
      );
      const existing = existingRows as { id: number; orderNumber: string }[];

      let orderId: number;
      let savedOrderNumber = orderNumber;
      let action: "created" | "updated";

      if (existing.length > 0) {
        orderId = existing[0].id;
        savedOrderNumber = existing[0].orderNumber;
        await raw.execute(
          `UPDATE orders
           SET customerId = ?, orderStatus = ?, deliveryDate = ?, deliveryAddress = ?, subtotal = ?,
               discount = ?, total = ?, notes = ?, recurringOrderId = ?
           WHERE id = ?`,
          [
            customerId,
            "confirmed",
            deliveryDate,
            null,
            subtotal.toFixed(2),
            "0.00",
            subtotal.toFixed(2),
            notes,
            null,
            orderId,
          ]
        );
        await raw.execute("DELETE FROM order_items WHERE orderId = ?", [orderId]);
        action = "updated";
      } else {
        const [inserted] = await raw.execute(
          `INSERT INTO orders
             (customerId, orderNumber, orderStatus, deliveryDate, deliveryAddress, subtotal,
              discount, total, notes, recurringOrderId)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            customerId,
            orderNumber,
            "confirmed",
            deliveryDate,
            null,
            subtotal.toFixed(2),
            "0.00",
            subtotal.toFixed(2),
            notes,
            null,
          ]
        );
        orderId = (inserted as { insertId: number }).insertId;
        action = "created";
      }

      for (const item of lineItems) {
        await raw.execute(
          `INSERT INTO order_items
             (orderId, productName, quantity, unit, unitPrice, lineTotal)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            item.product,
            item.quantity.toFixed(2),
            "dozen",
            item.unitPrice.toFixed(2),
            item.lineTotal.toFixed(2),
          ]
        );
      }

      synced.push({
        branch: branch.code,
        customerName: branch.customerName,
        customerId,
        orderNumber: savedOrderNumber,
        orderId,
        action,
        itemCount: lineItems.length,
        totalUnits,
        totalDozens: Number(totalDozens.toFixed(2)),
        total: Number(subtotal.toFixed(2)),
      });
    }

    return {
      fromDate,
      toDate,
      sourceUrl,
      pricePerDozen,
      orders: synced,
    };
  } finally {
    await raw.end();
  }
}
