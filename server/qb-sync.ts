/**
 * QuickBooks Sync Engine
 * Syncs customers, invoices, and payments from QuickBooks Online
 */

import { getDb } from "./db";
import {
  customers,
  orders,
  orderItems,
  qbConnections,
} from "../drizzle/schema";
import { eq, and, like, sql } from "drizzle-orm";
import {
  qbQuery,
  qbApiGet,
  getActiveQBConnection,
  createSyncLog,
  updateSyncLog,
  getQBCompanyInfo,
} from "./quickbooks";

// ─── QB Date Parsing ─────────────────────────────────────────────────────────
// QB returns dates as "YYYY-MM-DD" strings with no timezone.
// new Date("2026-03-18") parses as UTC midnight, which shifts back 1 day in EDT/EST.
// We append "T12:00:00" to treat it as noon local time, avoiding timezone boundary issues.

function parseQBDate(dateStr: string | undefined | null): Date {
  if (!dateStr) return new Date();
  return new Date(dateStr + "T12:00:00");
}

// ─── Segment Detection ────────────────────────────────────────────────────────

function detectSegment(
  name: string
): "cafe" | "restaurant" | "hotel" | "grocery" | "catering" | "university" | "other" {
  const lower = name.toLowerCase();
  if (lower.includes("cafe") || lower.includes("café") || lower.includes("coffee"))
    return "cafe";
  if (lower.includes("restaurant") || lower.includes("bistro") || lower.includes("diner"))
    return "restaurant";
  if (lower.includes("hotel") || lower.includes("inn") || lower.includes("lodge"))
    return "hotel";
  if (
    lower.includes("grocery") ||
    lower.includes("market") ||
    lower.includes("épicerie") ||
    lower.includes("store") ||
    lower.includes("dépanneur") ||
    lower.includes("supermarket")
  )
    return "grocery";
  if (lower.includes("catering") || lower.includes("traiteur") || lower.includes("event"))
    return "catering";
  if (
    lower.includes("university") ||
    lower.includes("college") ||
    lower.includes("school") ||
    lower.includes("université")
  )
    return "university";
  return "other";
}

// ─── Generate unique order number ─────────────────────────────────────────────

async function generateQBOrderNumber(qbInvoiceNum: string): Promise<string> {
  return `QB-${qbInvoiceNum}`;
}

// ─── Customer Sync ────────────────────────────────────────────────────────────

export async function syncCustomers(): Promise<{
  created: number;
  updated: number;
  errors: string[];
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  try {
    // Fetch all active customers from QuickBooks
    let startPosition = 1;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const result = await qbQuery(
        `SELECT * FROM Customer WHERE Active = true STARTPOSITION ${startPosition} MAXRESULTS ${pageSize}`
      );

      const qbCustomers = result?.QueryResponse?.Customer ?? [];
      if (qbCustomers.length === 0) {
        hasMore = false;
        break;
      }

      for (const qbCust of qbCustomers) {
        try {
          const displayName = qbCust.DisplayName || qbCust.CompanyName || "Unknown";
          const email =
            qbCust.PrimaryEmailAddr?.Address || `qb-${qbCust.Id}@placeholder.local`;
          const phone =
            qbCust.PrimaryPhone?.FreeFormNumber || qbCust.Mobile?.FreeFormNumber || null;

          // Build address from QuickBooks BillAddr
          let address: string | null = null;
          if (qbCust.BillAddr) {
            const parts = [
              qbCust.BillAddr.Line1,
              qbCust.BillAddr.City,
              qbCust.BillAddr.CountrySubDivisionCode,
              qbCust.BillAddr.PostalCode,
            ].filter(Boolean);
            address = parts.join(", ") || null;
          }

          const contactName =
            [qbCust.GivenName, qbCust.FamilyName].filter(Boolean).join(" ") ||
            displayName;

          const segment = detectSegment(displayName);

          // Check if customer already exists by matching businessName or email
          const existing = await db
            .select()
            .from(customers)
            .where(eq(customers.businessName, displayName))
            .limit(1);

          if (existing.length > 0) {
            // Update existing customer with QB data
            await db
              .update(customers)
              .set({
                contactName:
                  contactName !== displayName ? contactName : existing[0].contactName,
                email: email.includes("@placeholder.local")
                  ? existing[0].email
                  : email,
                phone: phone ?? existing[0].phone,
                address: address ?? existing[0].address,
                notes: `QB ID: ${qbCust.Id}${existing[0].notes ? ` | ${existing[0].notes}` : ""}`,
              })
              .where(eq(customers.id, existing[0].id));
            updated++;
          } else {
            // Create new customer
            await db.insert(customers).values({
              businessName: displayName,
              contactName,
              email,
              phone,
              address,
              segment,
              notes: `QB ID: ${qbCust.Id}`,
              status: "active",
            });
            created++;
          }
        } catch (custErr: any) {
          errors.push(
            `Customer ${qbCust.DisplayName || qbCust.Id}: ${custErr.message}`
          );
        }
      }

      startPosition += pageSize;
      if (qbCustomers.length < pageSize) hasMore = false;
    }
  } catch (err: any) {
    errors.push(`Customer sync error: ${err.message}`);
  }

  return { created, updated, errors };
}

// ─── Invoice Sync ─────────────────────────────────────────────────────────────

export async function syncInvoices(): Promise<{
  created: number;
  updated: number;
  errors: string[];
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  try {
    // Fetch all invoices from QuickBooks
    let startPosition = 1;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const result = await qbQuery(
        `SELECT * FROM Invoice STARTPOSITION ${startPosition} MAXRESULTS ${pageSize}`
      );

      const qbInvoices = result?.QueryResponse?.Invoice ?? [];
      if (qbInvoices.length === 0) {
        hasMore = false;
        break;
      }

      for (const inv of qbInvoices) {
        try {
          const invoiceNum = inv.DocNumber || `QB${inv.Id}`;
          const orderNumber = await generateQBOrderNumber(invoiceNum);

          // Check if order already exists
          const existingOrder = await db
            .select()
            .from(orders)
            .where(eq(orders.orderNumber, orderNumber))
            .limit(1);

          // Find matching customer by QB customer ref
          let customerId = 1; // default fallback
          if (inv.CustomerRef?.name) {
            const custName = inv.CustomerRef.name;
            const matchedCustomers = await db
              .select()
              .from(customers)
              .where(eq(customers.businessName, custName))
              .limit(1);

            if (matchedCustomers.length > 0) {
              customerId = matchedCustomers[0].id;
            } else {
              // Try partial match
              const partialMatch = await db
                .select()
                .from(customers)
                .where(like(customers.businessName, `%${custName.split(" ")[0]}%`))
                .limit(1);
              if (partialMatch.length > 0) {
                customerId = partialMatch[0].id;
              }
            }
          }

          // Use pre-tax amount to match QB P&L "Total for Income"
          // TotalAmt includes sales tax, but P&L only shows pre-tax income
          const grossTotal = Number(inv.TotalAmt || 0);
          const totalTax = Number(inv.TxnTaxDetail?.TotalTax || 0);
          const totalAmt = grossTotal - totalTax;
          const balance = Number(inv.Balance || 0);
          const isVoided = inv.PrivateNote?.toLowerCase().includes('voided') || 
                           inv.DocNumber?.toLowerCase().includes('void') ||
                           (grossTotal === 0 && inv.Line?.length === 0);
          let status: "pending" | "confirmed" | "preparing" | "delivered" | "paid" | "cancelled" =
            "delivered";
          if (isVoided) {
            status = "cancelled";
          } else if (balance <= 0 && grossTotal > 0) {
            status = "paid";
          } else if (balance < grossTotal) {
            status = "delivered"; // partially paid
          }

          const deliveryDate = parseQBDate(inv.TxnDate);

          if (existingOrder.length > 0) {
            // Update existing order
            await db
              .update(orders)
              .set({
                customerId,
                status,
                deliveryDate,
                total: String(totalAmt.toFixed(2)),
                subtotal: String(totalAmt.toFixed(2)),
              })
              .where(eq(orders.id, existingOrder[0].id));
            updated++;
          } else {
            // Create new order — use TxnDate as createdAt so date filters work correctly
            const orderResult = await db.insert(orders).values({
              customerId,
              orderNumber,
              status,
              deliveryDate,
              deliveryAddress: null,
              subtotal: String(totalAmt.toFixed(2)),
              discount: "0.00",
              total: String(totalAmt.toFixed(2)),
              notes: `QB Invoice #${invoiceNum} | QB ID: ${inv.Id}`,
              recurringOrderId: null,
              createdAt: deliveryDate,
            });

            const orderId = orderResult[0].insertId;

            // Import line items
            const lines = inv.Line?.filter(
              (l: any) => l.DetailType === "SalesItemLineDetail"
            ) ?? [];

            for (const line of lines) {
              const detail = line.SalesItemLineDetail || {};
              const productName =
                detail.ItemRef?.name || line.Description || "Unknown Product";
              const qty = detail.Qty || 1;
              const unitPrice = detail.UnitPrice || 0;
              const lineTotal = Number(line.Amount || 0);

              await db.insert(orderItems).values({
                orderId,
                product: productName,
                quantity: String(qty),
                unit: "each",
                unitPrice: String(unitPrice.toFixed(2)),
                lineTotal: String(lineTotal.toFixed(2)),
              });
            }

            created++;
          }
        } catch (invErr: any) {
          errors.push(
            `Invoice ${inv.DocNumber || inv.Id}: ${invErr.message}`
          );
        }
      }

      startPosition += pageSize;
      if (qbInvoices.length < pageSize) hasMore = false;
    }
  } catch (err: any) {
    errors.push(`Invoice sync error: ${err.message}`);
  }

  return { created, updated, errors };
}

// ─── Payment Sync ─────────────────────────────────────────────────────────────

export async function syncPayments(): Promise<{
  processed: number;
  errors: string[];
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let processed = 0;
  const errors: string[] = [];

  try {
    let startPosition = 1;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const result = await qbQuery(
        `SELECT * FROM Payment STARTPOSITION ${startPosition} MAXRESULTS ${pageSize}`
      );

      const qbPayments = result?.QueryResponse?.Payment ?? [];
      if (qbPayments.length === 0) {
        hasMore = false;
        break;
      }

      for (const pmt of qbPayments) {
        try {
          // Each payment can reference multiple invoices via Line items
          const lines = pmt.Line ?? [];
          for (const line of lines) {
            if (line.LinkedTxn) {
              for (const txn of line.LinkedTxn) {
                if (txn.TxnType === "Invoice") {
                  // Find the order by QB invoice ID in notes
                  const matchingOrders = await db
                    .select()
                    .from(orders)
                    .where(like(orders.notes, `%QB ID: ${txn.TxnId}%`))
                    .limit(1);

                  if (matchingOrders.length > 0) {
                    const order = matchingOrders[0];
                    if (order.status !== "paid") {
                      await db
                        .update(orders)
                        .set({ status: "paid" })
                        .where(eq(orders.id, order.id));
                      processed++;
                    }
                  }
                }
              }
            }
          }
        } catch (pmtErr: any) {
          errors.push(`Payment ${pmt.Id}: ${pmtErr.message}`);
        }
      }

      startPosition += pageSize;
      if (qbPayments.length < pageSize) hasMore = false;
    }
  } catch (err: any) {
    errors.push(`Payment sync error: ${err.message}`);
  }

  return { processed, errors };
}

// ─── Credit Memo Sync ────────────────────────────────────────────────────────

export async function syncCreditMemos(): Promise<{
  created: number;
  updated: number;
  errors: string[];
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  try {
    let startPosition = 1;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const result = await qbQuery(
        `SELECT * FROM CreditMemo STARTPOSITION ${startPosition} MAXRESULTS ${pageSize}`
      );

      const qbCreditMemos = result?.QueryResponse?.CreditMemo ?? [];
      if (qbCreditMemos.length === 0) {
        hasMore = false;
        break;
      }

      for (const cm of qbCreditMemos) {
        try {
          const memoNum = cm.DocNumber || `CM${cm.Id}`;
          const orderNumber = `CM-${memoNum}`;

          // Check if credit memo already exists as an order
          const existingOrder = await db
            .select()
            .from(orders)
            .where(eq(orders.orderNumber, orderNumber))
            .limit(1);

          // Find matching customer
          let customerId = 1;
          if (cm.CustomerRef?.name) {
            const custName = cm.CustomerRef.name;
            const matchedCustomers = await db
              .select()
              .from(customers)
              .where(eq(customers.businessName, custName))
              .limit(1);

            if (matchedCustomers.length > 0) {
              customerId = matchedCustomers[0].id;
            } else {
              const partialMatch = await db
                .select()
                .from(customers)
                .where(like(customers.businessName, `%${custName.split(" ")[0]}%`))
                .limit(1);
              if (partialMatch.length > 0) {
                customerId = partialMatch[0].id;
              }
            }
          }

          // Credit memos are stored as NEGATIVE amounts to reduce revenue
          const totalAmt = -Math.abs(Number(cm.TotalAmt || 0));
          const deliveryDate = parseQBDate(cm.TxnDate);

          if (existingOrder.length > 0) {
            await db
              .update(orders)
              .set({
                customerId,
                deliveryDate,
                total: String(totalAmt.toFixed(2)),
                subtotal: String(totalAmt.toFixed(2)),
              })
              .where(eq(orders.id, existingOrder[0].id));
            updated++;
          } else {
            await db.insert(orders).values({
              customerId,
              orderNumber,
              status: "paid", // Credit memos are always "applied"
              deliveryDate,
              deliveryAddress: null,
              subtotal: String(totalAmt.toFixed(2)),
              discount: "0.00",
              total: String(totalAmt.toFixed(2)),
              notes: `QB Credit Memo #${memoNum} | QB ID: ${cm.Id}`,
              recurringOrderId: null,
              createdAt: deliveryDate,
            });

            created++;
          }
        } catch (cmErr: any) {
          errors.push(
            `Credit Memo ${cm.DocNumber || cm.Id}: ${cmErr.message}`
          );
        }
      }

      startPosition += pageSize;
      if (qbCreditMemos.length < pageSize) hasMore = false;
    }
  } catch (err: any) {
    errors.push(`Credit Memo sync error: ${err.message}`);
  }

  return { created, updated, errors };
}

// ─── Sales Receipt Sync ─────────────────────────────────────────────────────

export async function syncSalesReceipts(): Promise<{
  created: number;
  updated: number;
  errors: string[];
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  try {
    let startPosition = 1;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const result = await qbQuery(
        `SELECT * FROM SalesReceipt STARTPOSITION ${startPosition} MAXRESULTS ${pageSize}`
      );

      const qbReceipts = result?.QueryResponse?.SalesReceipt ?? [];
      if (qbReceipts.length === 0) {
        hasMore = false;
        break;
      }

      for (const sr of qbReceipts) {
        try {
          const receiptNum = sr.DocNumber || `SR${sr.Id}`;
          const orderNumber = `SR-${receiptNum}`;

          // Check if sales receipt already exists
          const existingOrder = await db
            .select()
            .from(orders)
            .where(eq(orders.orderNumber, orderNumber))
            .limit(1);

          // Find matching customer
          let customerId = 1;
          if (sr.CustomerRef?.name) {
            const custName = sr.CustomerRef.name;
            const matchedCustomers = await db
              .select()
              .from(customers)
              .where(eq(customers.businessName, custName))
              .limit(1);

            if (matchedCustomers.length > 0) {
              customerId = matchedCustomers[0].id;
            } else {
              const partialMatch = await db
                .select()
                .from(customers)
                .where(like(customers.businessName, `%${custName.split(" ")[0]}%`))
                .limit(1);
              if (partialMatch.length > 0) {
                customerId = partialMatch[0].id;
              }
            }
          }

          const totalAmt = Number(sr.TotalAmt || 0);
          const deliveryDate = parseQBDate(sr.TxnDate);

          if (existingOrder.length > 0) {
            await db
              .update(orders)
              .set({
                customerId,
                deliveryDate,
                total: String(totalAmt.toFixed(2)),
                subtotal: String(totalAmt.toFixed(2)),
              })
              .where(eq(orders.id, existingOrder[0].id));
            updated++;
          } else {
            const orderResult = await db.insert(orders).values({
              customerId,
              orderNumber,
              status: "paid", // Sales receipts are always paid immediately
              deliveryDate,
              deliveryAddress: null,
              subtotal: String(totalAmt.toFixed(2)),
              discount: "0.00",
              total: String(totalAmt.toFixed(2)),
              notes: `QB Sales Receipt #${receiptNum} | QB ID: ${sr.Id}`,
              recurringOrderId: null,
              createdAt: deliveryDate,
            });

            const orderId = orderResult[0].insertId;

            // Import line items
            const lines = sr.Line?.filter(
              (l: any) => l.DetailType === "SalesItemLineDetail"
            ) ?? [];

            for (const line of lines) {
              const detail = line.SalesItemLineDetail || {};
              const productName =
                detail.ItemRef?.name || line.Description || "Unknown Product";
              const qty = detail.Qty || 1;
              const unitPrice = detail.UnitPrice || 0;
              const lineTotal = Number(line.Amount || 0);

              await db.insert(orderItems).values({
                orderId,
                product: productName,
                quantity: String(qty),
                unit: "each",
                unitPrice: String(unitPrice.toFixed(2)),
                lineTotal: String(lineTotal.toFixed(2)),
              });
            }

            created++;
          }
        } catch (srErr: any) {
          errors.push(
            `Sales Receipt ${sr.DocNumber || sr.Id}: ${srErr.message}`
          );
        }
      }

      startPosition += pageSize;
      if (qbReceipts.length < pageSize) hasMore = false;
    }
  } catch (err: any) {
    errors.push(`Sales Receipt sync error: ${err.message}`);
  }

  return { created, updated, errors };
}

// ─── Income Deposit Sync ─────────────────────────────────────────────────────
// Syncs bank deposits that have line items posting to income accounts
// (e.g., "Sales of Product Income"). These are direct income entries, not invoices.

const INCOME_ACCOUNT_NAMES = [
  "sales of product income",
  "sales",
  "service income",
  "other income",
];

export async function syncIncomeDeposits(): Promise<{
  created: number;
  updated: number;
  errors: string[];
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  try {
    let startPosition = 1;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const result = await qbQuery(
        `SELECT * FROM Deposit STARTPOSITION ${startPosition} MAXRESULTS ${pageSize}`
      );

      const qbDeposits = result?.QueryResponse?.Deposit ?? [];
      if (qbDeposits.length === 0) {
        hasMore = false;
        break;
      }

      for (const dep of qbDeposits) {
        try {
          // Check if any line items post to an income account
          const incomeLines = (dep.Line || []).filter((line: any) => {
            const acctName = line.DepositLineDetail?.AccountRef?.name?.toLowerCase() || "";
            return INCOME_ACCOUNT_NAMES.some(name => acctName.includes(name));
          });

          if (incomeLines.length === 0) continue; // Skip non-income deposits

          // Sum only the income line amounts
          const incomeTotal = incomeLines.reduce(
            (sum: number, line: any) => sum + Number(line.Amount || 0),
            0
          );

          if (incomeTotal <= 0) continue;

          const depNum = dep.DocNumber || `DEP${dep.Id}`;
          const orderNumber = `DEP-${depNum}`;

          const existingOrder = await db
            .select()
            .from(orders)
            .where(eq(orders.orderNumber, orderNumber))
            .limit(1);

          const deliveryDate = parseQBDate(dep.TxnDate);

          if (existingOrder.length > 0) {
            await db
              .update(orders)
              .set({
                deliveryDate,
                total: String(incomeTotal.toFixed(2)),
                subtotal: String(incomeTotal.toFixed(2)),
              })
              .where(eq(orders.id, existingOrder[0].id));
            updated++;
          } else {
            await db.insert(orders).values({
              customerId: 1, // Deposits don't always have a customer
              orderNumber,
              status: "paid",
              deliveryDate,
              deliveryAddress: null,
              subtotal: String(incomeTotal.toFixed(2)),
              discount: "0.00",
              total: String(incomeTotal.toFixed(2)),
              notes: `QB Deposit #${depNum} | QB ID: ${dep.Id} | Income account deposit`,
              recurringOrderId: null,
              createdAt: deliveryDate,
            });
            created++;
          }
        } catch (depErr: any) {
          errors.push(
            `Deposit ${dep.DocNumber || dep.Id}: ${depErr.message}`
          );
        }
      }

      startPosition += pageSize;
      if (qbDeposits.length < pageSize) hasMore = false;
    }
  } catch (err: any) {
    errors.push(`Income Deposit sync error: ${err.message}`);
  }

  return { created, updated, errors };
}

// ─── Full Sync Orchestrator ───────────────────────────────────────────────────

export async function runFullSync(): Promise<{
  success: boolean;
  logId: number;
  customers: { created: number; updated: number };
  invoices: { created: number; updated: number };
  creditMemos: { created: number; updated: number };
  salesReceipts: { created: number; updated: number };
  incomeDeposits: { created: number; updated: number };
  payments: { processed: number };
  errors: string[];
}> {
  const conn = await getActiveQBConnection();
  if (!conn) throw new Error("No active QuickBooks connection");

  const logId = await createSyncLog(conn.id, "full");
  const allErrors: string[] = [];

  try {
    // Update company name if not set
    if (!conn.companyName) {
      try {
        const companyInfo = await getQBCompanyInfo();
        const name = companyInfo?.CompanyInfo?.CompanyName;
        if (name) {
          const db = await getDb();
          if (db) {
            await db
              .update(qbConnections)
              .set({ companyName: name })
              .where(eq(qbConnections.id, conn.id));
          }
        }
      } catch (e) {
        console.warn("[QB Sync] Could not fetch company info:", e);
      }
    }

    // 1. Sync customers first
    console.log("[QB Sync] Starting customer sync...");
    const custResult = await syncCustomers();
    allErrors.push(...custResult.errors);

    // 2. Sync invoices (needs customers to exist for matching)
    console.log("[QB Sync] Starting invoice sync...");
    const invResult = await syncInvoices();
    allErrors.push(...invResult.errors);

    // 3. Sync credit memos (refunds/adjustments as negative revenue)
    console.log("[QB Sync] Starting credit memo sync...");
    const cmResult = await syncCreditMemos();
    allErrors.push(...cmResult.errors);

    // 4. Sync sales receipts (direct sales not through invoices)
    console.log("[QB Sync] Starting sales receipt sync...");
    const srResult = await syncSalesReceipts();
    allErrors.push(...srResult.errors);

    // 5. Sync income deposits (bank deposits posting to income accounts)
    console.log("[QB Sync] Starting income deposit sync...");
    const depResult = await syncIncomeDeposits();
    allErrors.push(...depResult.errors);

    // 6. Sync payments (updates order statuses)
    console.log("[QB Sync] Starting payment sync...");
    const pmtResult = await syncPayments();
    allErrors.push(...pmtResult.errors);

    // Update sync log
    await updateSyncLog(logId, {
      status: allErrors.length > 0 ? "completed" : "completed",
      customersCreated: custResult.created,
      customersUpdated: custResult.updated,
      ordersCreated: invResult.created + cmResult.created + srResult.created + depResult.created,
      ordersUpdated: invResult.updated + cmResult.updated + srResult.updated + depResult.updated,
      paymentsProcessed: pmtResult.processed,
      errorMessage: allErrors.length > 0 ? allErrors.join("\n") : undefined,
      completedAt: new Date(),
    });

    // Update last sync time on connection
    const db = await getDb();
    if (db) {
      await db
        .update(qbConnections)
        .set({ lastSyncAt: new Date() })
        .where(eq(qbConnections.id, conn.id));
    }

    console.log(
      `[QB Sync] Complete: ${custResult.created} customers created, ${custResult.updated} updated, ${invResult.created} invoices created, ${invResult.updated} updated, ${cmResult.created} credit memos created, ${cmResult.updated} updated, ${srResult.created} sales receipts created, ${srResult.updated} updated, ${depResult.created} deposits created, ${depResult.updated} updated, ${pmtResult.processed} payments processed`
    );

    return {
      success: true,
      logId,
      customers: { created: custResult.created, updated: custResult.updated },
      invoices: { created: invResult.created, updated: invResult.updated },
      creditMemos: { created: cmResult.created, updated: cmResult.updated },
      salesReceipts: { created: srResult.created, updated: srResult.updated },
      incomeDeposits: { created: depResult.created, updated: depResult.updated },
      payments: { processed: pmtResult.processed },
      errors: allErrors,
    };
  } catch (err: any) {
    await updateSyncLog(logId, {
      status: "failed",
      errorMessage: err.message,
      completedAt: new Date(),
    });

    return {
      success: false,
      logId,
      customers: { created: 0, updated: 0 },
      invoices: { created: 0, updated: 0 },
      creditMemos: { created: 0, updated: 0 },
      salesReceipts: { created: 0, updated: 0 },
      incomeDeposits: { created: 0, updated: 0 },
      payments: { processed: 0 },
      errors: [err.message],
    };
  }
}
