import { eq, and, gte, lte, sql, desc, count, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  leads, InsertLead, Lead,
  customers, InsertCustomer, Customer,
  orders, InsertOrder, Order,
  orderItems, InsertOrderItem, OrderItem,
  recurringOrders, InsertRecurringOrder, RecurringOrder,
  recurringOrderItems, InsertRecurringOrderItem, RecurringOrderItem,
  customerInvites, InsertCustomerInvite, CustomerInvite,
  tastingRequests, InsertTastingRequest, TastingRequest,
  notifications, InsertNotification, Notification,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ─── Lead queries ──────────────────────────────────────────────────────────

export async function createLead(lead: InsertLead): Promise<Lead | null> {
  const db = await getDb();
  if (!db) return null;

  await db.insert(leads).values(lead);
  const result = await db
    .select()
    .from(leads)
    .where(eq(leads.email, lead.email))
    .orderBy(desc(leads.createdAt))
    .limit(1);
  return result[0] ?? null;
}

export async function getAllLeads(): Promise<Lead[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leads).orderBy(desc(leads.createdAt));
}

export async function updateLeadStatus(id: number, status: Lead["status"]): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(leads).set({ status }).where(eq(leads.id, id));
}

export async function deleteLead(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(leads).where(eq(leads.id, id));
}

// ─── Customer queries ─────────────────────────────────────────────────────

export async function createCustomer(customer: InsertCustomer): Promise<Customer | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(customers).values(customer);
  const insertId = result[0].insertId;
  const rows = await db.select().from(customers).where(eq(customers.id, insertId)).limit(1);
  return rows[0] ?? null;
}

export async function getAllCustomers(): Promise<Customer[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(customers).orderBy(desc(customers.createdAt));
}

export type CustomerWithStats = Customer & {
  orderCount: number;
  totalRevenue: string;
  lastOrderDate: Date | null;
  classification: 'customer' | 'suspect';
};

export async function getAllCustomersWithStats(): Promise<CustomerWithStats[]> {
  const db = await getDb();
  if (!db) return [];

  const rows = await db.execute(sql`
    SELECT
      c.*,
      COALESCE(stats.order_count, 0) AS order_count,
      COALESCE(stats.total_revenue, '0.00') AS total_revenue,
      stats.last_order_date
    FROM ${customers} c
    LEFT JOIN (
      SELECT
        o.customerId,
        COUNT(*) AS order_count,
        SUM(o.total) AS total_revenue,
        MAX(o.deliveryDate) AS last_order_date
      FROM ${orders} o
      WHERE o.${sql.raw('orderStatus')} NOT IN ('cancelled')
      GROUP BY o.customerId
    ) stats ON stats.customerId = c.id
    ORDER BY c.createdAt DESC
  `);

  return (rows as any)[0].map((row: any) => ({
    id: row.id,
    businessName: row.businessName,
    contactName: row.contactName,
    email: row.email,
    phone: row.phone,
    address: row.address,
    segment: row.segment,
    notes: row.notes,
    status: row.customerStatus,
    userId: row.userId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    orderCount: Number(row.order_count) || 0,
    totalRevenue: String(row.total_revenue || '0.00'),
    lastOrderDate: row.last_order_date ? new Date(row.last_order_date) : null,
    classification: (Number(row.order_count) || 0) > 0 ? 'customer' as const : 'suspect' as const,
  }));
}

export async function getCustomerById(id: number): Promise<Customer | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function updateCustomer(id: number, data: Partial<InsertCustomer>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(customers).set(data).where(eq(customers.id, id));
}

export async function deleteCustomer(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(customers).where(eq(customers.id, id));
}

// ─── Order queries ────────────────────────────────────────────────────────

export async function generateOrderNumber(): Promise<string> {
  const db = await getDb();
  if (!db) return `HB-${Date.now()}`;

  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(orders);
  const c = result[0]?.count ?? 0;
  const num = String(c + 1).padStart(4, "0");
  return `HB-${num}`;
}

export async function createOrder(
  order: InsertOrder,
  items: Omit<InsertOrderItem, "orderId">[]
): Promise<{ order: Order; items: OrderItem[] } | null> {
  const db = await getDb();
  if (!db) return null;

  const orderResult = await db.insert(orders).values(order);
  const orderId = orderResult[0].insertId;

  const itemsWithOrderId = items.map((item) => ({
    ...item,
    orderId,
  }));

  if (itemsWithOrderId.length > 0) {
    await db.insert(orderItems).values(itemsWithOrderId);
  }

  const orderRows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  const itemRows = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

  return {
    order: orderRows[0]!,
    items: itemRows,
  };
}

export async function getAllOrders(filters?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<Order[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (filters?.startDate) {
    conditions.push(gte(orders.deliveryDate, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(orders.deliveryDate, filters.endDate));
  }

  if (conditions.length > 0) {
    return db
      .select()
      .from(orders)
      .where(and(...conditions))
      .orderBy(desc(orders.deliveryDate));
  }
  return db.select().from(orders).orderBy(desc(orders.deliveryDate));
}

export async function getOrderById(id: number): Promise<{ order: Order; items: OrderItem[] } | null> {
  const db = await getDb();
  if (!db) return null;

  const orderRows = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (orderRows.length === 0) return null;

  const itemRows = await db.select().from(orderItems).where(eq(orderItems.orderId, id));

  return {
    order: orderRows[0]!,
    items: itemRows,
  };
}

export async function updateOrderStatus(id: number, status: Order["status"]): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(orders).set({ status }).where(eq(orders.id, id));
}

export async function deleteOrder(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(orderItems).where(eq(orderItems.orderId, id));
  await db.delete(orders).where(eq(orders.id, id));
}

export async function getOrdersByCustomerId(customerId: number): Promise<Order[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).where(eq(orders.customerId, customerId)).orderBy(desc(orders.createdAt));
}

// ─── Dashboard Stats (Live Data) ─────────────────────────────────────────

export async function getDashboardStats(dateRange?: { startDate?: string; endDate?: string }) {
  const db = await getDb();
  if (!db) return null;

  const now = new Date();

  // If date range is provided, use it; otherwise default to current month
  const hasDateFilter = dateRange?.startDate && dateRange?.endDate;
  const filterStart = hasDateFilter ? new Date(dateRange.startDate!) : new Date(now.getFullYear(), now.getMonth(), 1);
  const filterEnd = hasDateFilter ? new Date(new Date(dateRange.endDate!).getTime() + 24 * 60 * 60 * 1000 - 1) : now;

  // Calculate comparison period (same duration before the filter period)
  const filterDuration = filterEnd.getTime() - filterStart.getTime();
  const compStart = new Date(filterStart.getTime() - filterDuration);
  const compEnd = new Date(filterStart.getTime() - 1);

  // Revenue in selected period (paid + delivered orders)
  const periodRevenue = await db
    .select({ total: sql<string>`COALESCE(SUM(${orders.total}), 0)` })
    .from(orders)
    .where(and(
      gte(orders.createdAt, filterStart),
      lte(orders.createdAt, filterEnd),
      inArray(orders.status, ['delivered', 'paid'])
    ));

  // Comparison period revenue
  const compRevenue = await db
    .select({ total: sql<string>`COALESCE(SUM(${orders.total}), 0)` })
    .from(orders)
    .where(and(
      gte(orders.createdAt, compStart),
      lte(orders.createdAt, compEnd),
      inArray(orders.status, ['delivered', 'paid'])
    ));

  // Active customers count (not date-filtered — always shows total)
  const activeCustomersResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(customers)
    .where(eq(customers.status, "active"));

  // Orders in selected period
  const periodOrders = await db
    .select({ count: sql<number>`COUNT(*)`, total: sql<string>`COALESCE(SUM(${orders.total}), 0)` })
    .from(orders)
    .where(and(
      gte(orders.createdAt, filterStart),
      lte(orders.createdAt, filterEnd)
    ));

  // Comparison period orders
  const compOrders = await db
    .select({ count: sql<number>`COUNT(*)`, total: sql<string>`COALESCE(SUM(${orders.total}), 0)` })
    .from(orders)
    .where(and(
      gte(orders.createdAt, compStart),
      lte(orders.createdAt, compEnd)
    ));

  // Dozens in selected period (sum of quantity from order items)
  const dozensResult = await db
    .select({ total: sql<string>`COALESCE(SUM(${orderItems.quantity}), 0)` })
    .from(orders)
    .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
    .where(and(
      gte(orders.createdAt, filterStart),
      lte(orders.createdAt, filterEnd)
    ));

  // Pipeline value (pending + confirmed orders) — not date-filtered
  const pipelineResult = await db
    .select({ total: sql<string>`COALESCE(SUM(${orders.total}), 0)` })
    .from(orders)
    .where(inArray(orders.status, ['pending', 'confirmed', 'preparing']));

  // Lead conversion rate — not date-filtered
  const totalLeads = await db.select({ count: sql<number>`COUNT(*)` }).from(leads);
  const convertedLeads = await db.select({ count: sql<number>`COUNT(*)` }).from(leads).where(eq(leads.status, "converted"));

  // Pipeline stages from leads — not date-filtered
  const leadsByStatus = await db
    .select({
      status: leads.status,
      count: sql<number>`COUNT(*)`,
    })
    .from(leads)
    .groupBy(leads.status);

  // Monthly revenue for chart — filtered by date range if provided
  const monthlyRevenueRaw = hasDateFilter
    ? await db.execute(
        sql`SELECT DATE_FORMAT(${orders.createdAt}, '%Y-%m') AS \`month\`, COALESCE(SUM(${orders.total}), 0) AS revenue, COUNT(*) AS orderCount FROM ${orders} WHERE ${orders.status} IN ('delivered', 'paid') AND ${orders.createdAt} >= ${filterStart} AND ${orders.createdAt} <= ${filterEnd} GROUP BY \`month\` ORDER BY \`month\``
      )
    : await db.execute(
        sql`SELECT DATE_FORMAT(${orders.createdAt}, '%Y-%m') AS \`month\`, COALESCE(SUM(${orders.total}), 0) AS revenue, COUNT(*) AS orderCount FROM ${orders} WHERE ${orders.status} IN ('delivered', 'paid') GROUP BY \`month\` ORDER BY \`month\``
      );
  const monthlyRevenueData = (monthlyRevenueRaw[0] as unknown as any[]) || [];

  // Recent orders — filtered by date range if provided
  const recentOrdersQuery = db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customerId: orders.customerId,
      status: orders.status,
      total: orders.total,
      createdAt: orders.createdAt,
    })
    .from(orders);

  const recentOrders = hasDateFilter
    ? await recentOrdersQuery
        .where(and(
          gte(orders.createdAt, filterStart),
          lte(orders.createdAt, filterEnd)
        ))
        .orderBy(desc(orders.createdAt))
        .limit(10)
    : await recentOrdersQuery
        .orderBy(desc(orders.createdAt))
        .limit(10);

  // Top customers — filtered by date range if provided
  const topCustomersBase = hasDateFilter
    ? await db
        .select({
          customerId: orders.customerId,
          totalRevenue: sql<string>`SUM(${orders.total})`,
          orderCount: sql<number>`COUNT(*)`,
        })
        .from(orders)
        .where(and(
          inArray(orders.status, ['delivered', 'paid']),
          gte(orders.createdAt, filterStart),
          lte(orders.createdAt, filterEnd)
        ))
        .groupBy(orders.customerId)
        .orderBy(sql`SUM(${orders.total}) DESC`)
        .limit(5)
    : await db
        .select({
          customerId: orders.customerId,
          totalRevenue: sql<string>`SUM(${orders.total})`,
          orderCount: sql<number>`COUNT(*)`,
        })
        .from(orders)
        .where(inArray(orders.status, ['delivered', 'paid']))
        .groupBy(orders.customerId)
        .orderBy(sql`SUM(${orders.total}) DESC`)
        .limit(5);

  // Active recurring orders count — not date-filtered
  const activeRecurring = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(recurringOrders)
    .where(eq(recurringOrders.status, "active"));

  const periodRev = Number(periodRevenue[0]?.total ?? 0);
  const compRev = Number(compRevenue[0]?.total ?? 0);
  const revenueChange = compRev > 0 ? ((periodRev - compRev) / compRev) * 100 : 0;

  const periodOrderCount = periodOrders[0]?.count ?? 0;
  const compOrderCount = compOrders[0]?.count ?? 0;
  const periodTotal = Number(periodOrders[0]?.total ?? 0);
  const avgOrderSize = periodOrderCount > 0 ? periodTotal / periodOrderCount : 0;
  const compTotal = Number(compOrders[0]?.total ?? 0);
  const compAvgOrder = compOrderCount > 0 ? compTotal / compOrderCount : 0;
  const avgOrderChange = compAvgOrder > 0 ? ((avgOrderSize - compAvgOrder) / compAvgOrder) * 100 : 0;

  const totalLeadCount = totalLeads[0]?.count ?? 0;
  const convertedCount = convertedLeads[0]?.count ?? 0;
  const conversionRate = totalLeadCount > 0 ? (convertedCount / totalLeadCount) * 100 : 0;

  return {
    kpis: {
      monthlyRevenue: periodRev,
      revenueChange: Math.round(revenueChange * 10) / 10,
      weeklyDozens: Math.round(Number(dozensResult[0]?.total ?? 0)),
      activeAccounts: activeCustomersResult[0]?.count ?? 0,
      avgOrderSize: Math.round(avgOrderSize * 100) / 100,
      avgOrderChange: Math.round(avgOrderChange * 10) / 10,
      pipelineValue: Number(pipelineResult[0]?.total ?? 0),
      conversionRate: Math.round(conversionRate * 10) / 10,
      totalOrders: periodOrderCount,
      activeRecurring: activeRecurring[0]?.count ?? 0,
    },
    dateRange: {
      start: filterStart.toISOString(),
      end: filterEnd.toISOString(),
      isFiltered: !!hasDateFilter,
    },
    monthlyRevenue: monthlyRevenueData.map((r) => ({
      month: r.month,
      revenue: Number(r.revenue),
      orderCount: r.orderCount,
    })),
    leadsByStatus: leadsByStatus.map((l) => ({
      status: l.status,
      count: l.count,
    })),
    recentOrders,
    topCustomers: topCustomersBase.map((tc) => ({
      customerId: tc.customerId,
      totalRevenue: Number(tc.totalRevenue),
      orderCount: tc.orderCount,
    })),
  };
}

// ─── Recurring Order queries ─────────────────────────────────────────────

export async function createRecurringOrder(
  order: InsertRecurringOrder,
  items: Omit<InsertRecurringOrderItem, "recurringOrderId">[]
): Promise<{ order: RecurringOrder; items: RecurringOrderItem[] } | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(recurringOrders).values(order);
  const recurringOrderId = result[0].insertId;

  const itemsWithId = items.map((item) => ({
    ...item,
    recurringOrderId,
  }));

  if (itemsWithId.length > 0) {
    await db.insert(recurringOrderItems).values(itemsWithId);
  }

  const orderRows = await db.select().from(recurringOrders).where(eq(recurringOrders.id, recurringOrderId)).limit(1);
  const itemRows = await db.select().from(recurringOrderItems).where(eq(recurringOrderItems.recurringOrderId, recurringOrderId));

  return {
    order: orderRows[0]!,
    items: itemRows,
  };
}

export async function getAllRecurringOrders(): Promise<RecurringOrder[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(recurringOrders).orderBy(desc(recurringOrders.createdAt));
}

export async function getRecurringOrderById(id: number): Promise<{ order: RecurringOrder; items: RecurringOrderItem[] } | null> {
  const db = await getDb();
  if (!db) return null;

  const orderRows = await db.select().from(recurringOrders).where(eq(recurringOrders.id, id)).limit(1);
  if (orderRows.length === 0) return null;

  const itemRows = await db.select().from(recurringOrderItems).where(eq(recurringOrderItems.recurringOrderId, id));

  return {
    order: orderRows[0]!,
    items: itemRows,
  };
}

export async function updateRecurringOrderStatus(id: number, status: RecurringOrder["status"]): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(recurringOrders).set({ status }).where(eq(recurringOrders.id, id));
}

export async function deleteRecurringOrder(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(recurringOrderItems).where(eq(recurringOrderItems.recurringOrderId, id));
  await db.delete(recurringOrders).where(eq(recurringOrders.id, id));
}

export async function getRecurringOrdersByCustomerId(customerId: number): Promise<RecurringOrder[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(recurringOrders).where(eq(recurringOrders.customerId, customerId)).orderBy(desc(recurringOrders.createdAt));
}

// ─── Customer Invite queries ─────────────────────────────────────────────

export async function createCustomerInvite(invite: InsertCustomerInvite): Promise<CustomerInvite | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(customerInvites).values(invite);
  const insertId = result[0].insertId;
  const rows = await db.select().from(customerInvites).where(eq(customerInvites.id, insertId)).limit(1);
  return rows[0] ?? null;
}

export async function getInviteByToken(token: string): Promise<CustomerInvite | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(customerInvites).where(eq(customerInvites.token, token)).limit(1);
  return rows[0] ?? null;
}

export async function acceptInvite(token: string, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const invite = await getInviteByToken(token);
  if (!invite || invite.status !== "pending") return false;
  if (new Date() > invite.expiresAt) {
    await db.update(customerInvites).set({ status: "expired" }).where(eq(customerInvites.token, token));
    return false;
  }

  // Link user to customer
  await db.update(customers).set({ userId }).where(eq(customers.id, invite.customerId));
  // Mark invite as accepted
  await db.update(customerInvites).set({ status: "accepted" }).where(eq(customerInvites.token, token));
  return true;
}

export async function getCustomerByUserId(userId: number): Promise<Customer | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(customers).where(eq(customers.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export async function getInvitesByCustomerId(customerId: number): Promise<CustomerInvite[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(customerInvites).where(eq(customerInvites.customerId, customerId)).orderBy(desc(customerInvites.createdAt));
}

// ─── Portal queries (customer-facing) ───────────────────────────────────

export async function getPortalOrders(customerId: number): Promise<(Order & { items: OrderItem[] })[]> {
  const db = await getDb();
  if (!db) return [];

  const orderRows = await db.select().from(orders)
    .where(eq(orders.customerId, customerId))
    .orderBy(desc(orders.createdAt));

  const result = [];
  for (const order of orderRows) {
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    result.push({ ...order, items });
  }
  return result;
}

export async function getPortalRecurringOrders(customerId: number) {
  const db = await getDb();
  if (!db) return [];

  const orderRows = await db.select().from(recurringOrders)
    .where(eq(recurringOrders.customerId, customerId))
    .orderBy(desc(recurringOrders.createdAt));

  const result = [];
  for (const order of orderRows) {
    const items = await db.select().from(recurringOrderItems).where(eq(recurringOrderItems.recurringOrderId, order.id));
    result.push({ ...order, items });
  }
  return result;
}

export async function bulkCreateCustomers(customerList: InsertCustomer[]): Promise<{ imported: number; skipped: number }> {
  const db = await getDb();
  if (!db) return { imported: 0, skipped: 0 };

  let imported = 0;
  let skipped = 0;

  for (const c of customerList) {
    // Check for duplicate by email
    const existing = await db.select().from(customers).where(eq(customers.email, c.email)).limit(1);
    if (existing.length > 0) {
      skipped++;
      continue;
    }
    await db.insert(customers).values(c);
    imported++;
  }

  return { imported, skipped };
}

// ─── Tasting Request queries ─────────────────────────────────────────────

export async function createTastingRequest(request: InsertTastingRequest): Promise<TastingRequest | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(tastingRequests).values(request);
  const insertId = result[0].insertId;
  const rows = await db.select().from(tastingRequests).where(eq(tastingRequests.id, insertId)).limit(1);
  return rows[0] ?? null;
}

export async function getAllTastingRequests(): Promise<TastingRequest[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tastingRequests).orderBy(desc(tastingRequests.createdAt));
}

export async function updateTastingRequestStatus(id: number, status: TastingRequest["status"]): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(tastingRequests).set({ status }).where(eq(tastingRequests.id, id));
}

// Helper to compute next delivery date from day of week
export function computeNextDelivery(dayOfWeek: string): Date {
  const dayMap: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6,
  };
  const targetDay = dayMap[dayOfWeek] ?? 1;
  const now = new Date();
  const currentDay = now.getDay();
  let daysUntil = targetDay - currentDay;
  if (daysUntil <= 0) daysUntil += 7;
  const next = new Date(now);
  next.setDate(now.getDate() + daysUntil);
  next.setHours(8, 0, 0, 0);
  return next;
}

// ─── Notification helpers ────────────────────────────────────────────────────

export async function createNotification(notif: InsertNotification): Promise<Notification | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(notifications).values(notif);
  const id = result[0].insertId;
  const rows = await db.select().from(notifications).where(eq(notifications.id, id));
  return rows[0] ?? null;
}

export async function getAllNotifications(limit = 50): Promise<Notification[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(limit);
}

export async function getUnreadNotificationCount(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: count() }).from(notifications).where(eq(notifications.isRead, 0));
  return result[0]?.count ?? 0;
}

export async function markNotificationRead(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: 1 }).where(eq(notifications.id, id));
}

export async function markAllNotificationsRead(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: 1 }).where(eq(notifications.isRead, 0));
}

export async function deleteNotification(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(notifications).where(eq(notifications.id, id));
}
