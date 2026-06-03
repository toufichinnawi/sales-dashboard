import { eq, and, gte, lte, sql, desc, count, inArray, notInArray, or, like } from "drizzle-orm";
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
  pendingEmails, InsertPendingEmail, PendingEmail,
  leadActivities, InsertLeadActivity, LeadActivity,
  portalDocuments, InsertPortalDocument, PortalDocument,
  salesTargets, InsertSalesTarget, SalesTarget,
  productCosts, InsertProductCost, ProductCost,
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

  const insertResult = await db.insert(leads).values(lead);
  const insertId = (insertResult[0] as any).insertId;
  if (insertId) {
    const rows = await db.select().from(leads).where(eq(leads.id, insertId)).limit(1);
    return rows[0] ?? null;
  }
  // Fallback: fetch by name+business if no insertId
  const result = await db
    .select()
    .from(leads)
    .where(eq(leads.name, lead.name))
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

export async function getLeadById(id: number): Promise<Lead | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return result[0] ?? null;
}

export async function updateLead(id: number, data: Partial<Omit<InsertLead, 'id'>>): Promise<Lead | null> {
  const db = await getDb();
  if (!db) return null;
  await db.update(leads).set(data).where(eq(leads.id, id));
  const result = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return result[0] ?? null;
}

export async function deleteLead(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(leads).where(eq(leads.id, id));
}

/**
 * Check for duplicate customers by email, phone, or business name.
 * Returns matching customers if any exist.
 */
export async function findDuplicateCustomers(params: {
  email?: string;
  phone?: string;
  businessName?: string;
}): Promise<Customer[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (params.email && params.email.trim()) {
    conditions.push(eq(customers.email, params.email.trim()));
  }
  if (params.phone && params.phone.trim()) {
    conditions.push(eq(customers.phone, params.phone.trim()));
  }
  if (params.businessName && params.businessName.trim()) {
    conditions.push(eq(customers.businessName, params.businessName.trim()));
  }

  if (conditions.length === 0) return [];

  return db.select().from(customers).where(or(...conditions));
}

/**
 * Convert a lead to a customer.
 * Creates a new customer record and updates the lead with conversion info.
 */
export async function convertLeadToCustomer(leadId: number, customerId: number): Promise<Lead | null> {
  const db = await getDb();
  if (!db) return null;

  await db.update(leads).set({
    status: "won",
    convertedAt: new Date(),
    convertedCustomerId: customerId,
  }).where(eq(leads.id, leadId));

  const result = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
  return result[0] ?? null;
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

  // Pipeline = count of open leads (status NOT IN won/lost). The label and value
  // are unified with the Pipeline page. A dollar-based pipeline can replace this
  // once per-tier $ estimates are wired up (potentialValue is currently a
  // low/medium/high enum, not a numeric amount).
  const pipelineResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(leads)
    .where(notInArray(leads.status, ['won', 'lost']));

  // Lead conversion rate — not date-filtered
  const totalLeads = await db.select({ count: sql<number>`COUNT(*)` }).from(leads);
  const convertedLeads = await db.select({ count: sql<number>`COUNT(*)` }).from(leads).where(eq(leads.status, "won"));

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

  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const comparisonPeriodMs = compEnd.getTime() - compStart.getTime();
  const comparisonIsMeaningful = comparisonPeriodMs >= SEVEN_DAYS_MS;

  const clampChange = (current: number, baseline: number): number | null => {
    if (!comparisonIsMeaningful) return null;
    if (baseline < 1) return null;
    const pct = ((current - baseline) / baseline) * 100;
    if (Math.abs(pct) > 300) return null;
    return pct;
  };

  const periodRev = Number(periodRevenue[0]?.total ?? 0);
  const compRev = Number(compRevenue[0]?.total ?? 0);
  const revenueChange = clampChange(periodRev, compRev);

  const periodOrderCount = periodOrders[0]?.count ?? 0;
  const compOrderCount = compOrders[0]?.count ?? 0;
  const periodTotal = Number(periodOrders[0]?.total ?? 0);
  const avgOrderSize = periodOrderCount > 0 ? periodTotal / periodOrderCount : 0;
  const compTotal = Number(compOrders[0]?.total ?? 0);
  const compAvgOrder = compOrderCount > 0 ? compTotal / compOrderCount : 0;
  const avgOrderChange = clampChange(avgOrderSize, compAvgOrder);

  const totalLeadCount = totalLeads[0]?.count ?? 0;
  const convertedCount = convertedLeads[0]?.count ?? 0;
  const conversionRate = totalLeadCount > 0 ? (convertedCount / totalLeadCount) * 100 : 0;

  return {
    kpis: {
      monthlyRevenue: periodRev,
      revenueChange: revenueChange === null ? null : Math.round(revenueChange * 10) / 10,
      weeklyDozens: Math.round(Number(dozensResult[0]?.total ?? 0)),
      activeAccounts: activeCustomersResult[0]?.count ?? 0,
      avgOrderSize: Math.round(avgOrderSize * 100) / 100,
      avgOrderChange: avgOrderChange === null ? null : Math.round(avgOrderChange * 10) / 10,
      pipelineValue: Number(pipelineResult[0]?.count ?? 0),
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

// Pipeline funnel — counts of open leads grouped by status and by tier.
// "Open" = status NOT IN (won, lost). Both Overview and the Pipeline page consume this.
export async function getOpenLeadsFunnel() {
  const db = await getDb();
  if (!db) return null;

  const openCondition = notInArray(leads.status, ['won', 'lost']);

  const byStatusRows = await db
    .select({ status: leads.status, count: sql<number>`COUNT(*)` })
    .from(leads)
    .where(openCondition)
    .groupBy(leads.status);

  const byTierRows = await db
    .select({ tier: leads.potentialValue, count: sql<number>`COUNT(*)` })
    .from(leads)
    .where(openCondition)
    .groupBy(leads.potentialValue);

  const byTier = { low: 0, medium: 0, high: 0, unset: 0 };
  for (const row of byTierRows) {
    const c = Number(row.count);
    if (row.tier === 'low') byTier.low = c;
    else if (row.tier === 'medium') byTier.medium = c;
    else if (row.tier === 'high') byTier.high = c;
    else byTier.unset += c;
  }

  const totalOpen = byStatusRows.reduce((sum, r) => sum + Number(r.count), 0);

  return {
    totalOpen,
    byStatus: byStatusRows.map(r => ({ status: r.status, count: Number(r.count) })),
    byTier,
  };
}

// List open leads for the Pipeline page table.
export async function getOpenLeads() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(leads)
    .where(notInArray(leads.status, ['won', 'lost']))
    .orderBy(desc(leads.createdAt));
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

// ─── Pending Emails (email queue) ───────────────────────────────────────────

export async function createPendingEmail(data: {
  toEmail: string;
  toName: string;
  subject: string;
  body: string;
  attachments?: string;
  leadId?: number;
}): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(pendingEmails).values(data).$returningId();
  return result[0]?.id ?? null;
}

export async function getPendingEmails(): Promise<PendingEmail[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pendingEmails).where(eq(pendingEmails.status, "pending")).orderBy(pendingEmails.createdAt);
}

export async function updatePendingEmailStatus(id: number, status: "pending" | "sending" | "sent" | "failed", errorMessage?: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const updates: any = { status };
  if (status === "sent") updates.sentAt = new Date();
  if (errorMessage) updates.errorMessage = errorMessage;
  await db.update(pendingEmails).set(updates).where(eq(pendingEmails.id, id));
}

export async function getPendingEmailById(id: number): Promise<PendingEmail | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(pendingEmails).where(eq(pendingEmails.id, id));
  return rows[0] ?? null;
}

// ─── Lead Activities ─────────────────────────────────────────────────────────

export async function createLeadActivity(data: {
  leadId: number;
  activityType: InsertLeadActivity["activityType"];
  note?: string | null;
  userId?: number | null;
  userName?: string | null;
  metadata?: string | null;
}) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(leadActivities).values({
    leadId: data.leadId,
    activityType: data.activityType,
    note: data.note ?? null,
    userId: data.userId ?? null,
    userName: data.userName ?? null,
    metadata: data.metadata ?? null,
  });
  return result.insertId;
}

export async function getLeadActivities(leadId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(leadActivities)
    .where(eq(leadActivities.leadId, leadId))
    .orderBy(desc(leadActivities.createdAt));
}

export async function deleteLeadActivities(leadId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(leadActivities).where(eq(leadActivities.leadId, leadId));
}


// ─── Portal Documents helpers ────────────────────────────────────────────────

export async function createPortalDocument(data: InsertPortalDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(portalDocuments).values(data).$returningId();
  const [doc] = await db.select().from(portalDocuments).where(eq(portalDocuments.id, result.id));
  return doc;
}

export async function getAllPortalDocuments() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(portalDocuments).orderBy(desc(portalDocuments.createdAt));
}

export async function getClientPortalDocuments() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(portalDocuments)
    .where(eq(portalDocuments.visibility, "client_portal"))
    .orderBy(desc(portalDocuments.createdAt));
}

export async function getPortalDocumentById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [doc] = await db.select().from(portalDocuments).where(eq(portalDocuments.id, id));
  return doc ?? null;
}

export async function updatePortalDocument(id: number, data: Partial<InsertPortalDocument>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(portalDocuments).set(data).where(eq(portalDocuments.id, id));
  const [doc] = await db.select().from(portalDocuments).where(eq(portalDocuments.id, id));
  return doc;
}

export async function deletePortalDocument(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(portalDocuments).where(eq(portalDocuments.id, id));
}

// ─── Sales Target queries ──────────────────────────────────────────────────

export async function getTarget(periodMonth: string): Promise<SalesTarget | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(salesTargets)
    .where(eq(salesTargets.periodMonth, periodMonth))
    .limit(1);
  return rows[0] ?? null;
}

export async function listTargets(): Promise<SalesTarget[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(salesTargets).orderBy(desc(salesTargets.periodMonth));
}

export async function upsertTarget(input: {
  periodMonth: string;
  targetRevenue: string;
  targetDozens?: string | null;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const values: InsertSalesTarget = {
    periodMonth: input.periodMonth,
    targetRevenue: input.targetRevenue,
    targetDozens: input.targetDozens ?? null,
  };
  await db.insert(salesTargets).values(values).onDuplicateKeyUpdate({
    set: {
      targetRevenue: values.targetRevenue,
      targetDozens: values.targetDozens,
    },
  });
}

// Returns one row per month (YYYY-MM) for the last `monthsBack` months, including
// the current month. Revenue is summed from delivered+paid orders to match the
// monthly chart in getDashboardStats.
export async function getMonthlyActuals(
  monthsBack: number
): Promise<Array<{ periodMonth: string; actualRevenue: number }>> {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1), 1);

  const rows = (await db.execute(
    sql`SELECT DATE_FORMAT(${orders.createdAt}, '%Y-%m') AS periodMonth,
               COALESCE(SUM(${orders.total}), 0) AS revenue
        FROM ${orders}
        WHERE ${orders.status} IN ('delivered', 'paid')
          AND ${orders.createdAt} >= ${cutoff}
        GROUP BY periodMonth
        ORDER BY periodMonth`
  ))[0] as unknown as Array<{ periodMonth: string; revenue: string | number }>;

  const byMonth = new Map<string, number>();
  for (const r of rows) byMonth.set(r.periodMonth, Number(r.revenue));

  const out: Array<{ periodMonth: string; actualRevenue: number }> = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    out.push({ periodMonth: key, actualRevenue: byMonth.get(key) ?? 0 });
  }
  return out;
}

// ─── Product costs & profitability ─────────────────────────────────────────

export async function listProductCosts(): Promise<ProductCost[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(productCosts).orderBy(productCosts.productName);
}

export async function upsertProductCost(input: {
  productName: string;
  unitCost: string;
  unit?: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const values: InsertProductCost = {
    productName: input.productName,
    unitCost: input.unitCost,
    unit: input.unit ?? "dozen",
  };
  await db.insert(productCosts).values(values).onDuplicateKeyUpdate({
    set: { unitCost: values.unitCost, unit: values.unit },
  });
}

export async function deleteProductCost(productName: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(productCosts).where(eq(productCosts.productName, productName));
}

// Distinct product names appearing in order_items, used by the Costs page so
// the owner knows which products still need a unit cost set.
export async function listDistinctOrderProducts(): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .selectDistinct({ product: orderItems.product })
    .from(orderItems)
    .orderBy(orderItems.product);
  return rows.map(r => r.product).filter((p): p is string => !!p);
}

type ProfitDateRange = { startDate?: string; endDate?: string } | undefined;

// Per-customer revenue / cost / profit / margin for delivered+paid orders.
// Matching rule: case-insensitive SUBSTRING — a canonical productCosts row
// matches an order line if its productName is contained (case-insensitive) in
// the line's product. If multiple canonical rows match, the LONGEST name wins
// (most specific); ties broken alphabetically for determinism. Order line
// quantity is normalized to dozens (unit "each" → ÷12). Lines that match no
// canonical row stay in uncostedRevenue and are excluded from profit math
// (never silently assumed zero-cost).
export async function profitByCustomer(dateRange?: ProfitDateRange) {
  const db = await getDb();
  if (!db) return [];

  const filters = [inArray(orders.status, ['delivered', 'paid'])];
  if (dateRange?.startDate) filters.push(gte(orders.createdAt, new Date(dateRange.startDate)));
  if (dateRange?.endDate) {
    const end = new Date(new Date(dateRange.endDate).getTime() + 24 * 60 * 60 * 1000 - 1);
    filters.push(lte(orders.createdAt, end));
  }

  const [lines, catalog] = await Promise.all([
    db
      .select({
        customerId: orders.customerId,
        businessName: customers.businessName,
        product: orderItems.product,
        quantity: orderItems.quantity,
        unit: orderItems.unit,
        lineTotal: orderItems.lineTotal,
      })
      .from(orders)
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .leftJoin(customers, eq(customers.id, orders.customerId))
      .where(and(...filters)),
    listProductCosts(),
  ]);

  // Pre-sort canonical names so the first hit in the loop is the best match:
  // longest name first; alphabetical as deterministic tiebreaker.
  const canonical = catalog
    .map(c => ({
      productName: c.productName,
      productNameLower: c.productName.toLowerCase(),
      unitCost: Number(c.unitCost),
    }))
    .sort((a, b) =>
      b.productNameLower.length - a.productNameLower.length ||
      a.productNameLower.localeCompare(b.productNameLower)
    );

  const matchCanonical = (productName: string) => {
    const lower = productName.toLowerCase();
    return canonical.find(c => lower.includes(c.productNameLower)) ?? null;
  };

  type Bucket = {
    customerId: number;
    businessName: string | null;
    revenue: number;
    cost: number;
    costedRevenue: number;
    uncostedRevenue: number;
  };

  const byCustomer = new Map<number, Bucket>();
  for (const r of lines) {
    if (r.customerId == null) continue;
    const lineRevenue = Number(r.lineTotal);
    const bucket = byCustomer.get(r.customerId) ?? {
      customerId: r.customerId,
      businessName: r.businessName ?? null,
      revenue: 0,
      cost: 0,
      costedRevenue: 0,
      uncostedRevenue: 0,
    };
    bucket.revenue += lineRevenue;
    const match = matchCanonical(r.product);
    if (match) {
      const rawQty = Number(r.quantity);
      const dozens = r.unit === "each" ? rawQty / 12 : rawQty;
      bucket.cost += dozens * match.unitCost;
      bucket.costedRevenue += lineRevenue;
    } else {
      bucket.uncostedRevenue += lineRevenue;
    }
    byCustomer.set(r.customerId, bucket);
  }

  return Array.from(byCustomer.values()).map(b => {
    const profit = b.costedRevenue - b.cost;
    const marginPct = b.costedRevenue > 0 ? (profit / b.costedRevenue) * 100 : null;
    return {
      customerId: b.customerId,
      businessName: b.businessName,
      revenue: Math.round(b.revenue * 100) / 100,
      cost: Math.round(b.cost * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      marginPct: marginPct === null ? null : Math.round(marginPct * 10) / 10,
      uncostedRevenue: Math.round(b.uncostedRevenue * 100) / 100,
    };
  }).sort((a, b) => b.revenue - a.revenue);
}

// ─── Production / order-mix queries ────────────────────────────────────────

type PeriodRange = { from?: string; to?: string } | undefined;

function periodFilters(range: PeriodRange) {
  const filters = [] as any[];
  if (range?.from) filters.push(gte(orders.createdAt, new Date(range.from)));
  if (range?.to) {
    const end = new Date(new Date(range.to).getTime() + 24 * 60 * 60 * 1000 - 1);
    filters.push(lte(orders.createdAt, end));
  }
  return filters;
}

// Aggregate all order-line dozens + revenue in the period, grouped by canonical
// product (same case-insensitive substring rule as profitByCustomer: longest
// canonical name wins, alphabetical tiebreak). Lines matching no canonical
// collapse into a single "Uncategorized" bucket. Cancelled orders excluded —
// they don't represent real factory demand. Returns rows sorted by dozens desc
// plus a grand-total dozens for KPI display.
export async function productionDemand(range: PeriodRange) {
  const db = await getDb();
  if (!db) return { rows: [], totalDozens: 0 };

  const [lines, catalog] = await Promise.all([
    db
      .select({
        product: orderItems.product,
        quantity: orderItems.quantity,
        unit: orderItems.unit,
        lineTotal: orderItems.lineTotal,
      })
      .from(orders)
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .where(
        and(
          notInArray(orders.status, ['cancelled']),
          ...periodFilters(range)
        )
      ),
    listProductCosts(),
  ]);

  const canonical = catalog
    .map(c => ({
      productName: c.productName,
      productNameLower: c.productName.toLowerCase(),
    }))
    .sort((a, b) =>
      b.productNameLower.length - a.productNameLower.length ||
      a.productNameLower.localeCompare(b.productNameLower)
    );

  const UNCATEGORIZED = "Uncategorized";
  const buckets = new Map<string, { product: string; dozens: number; revenue: number; isCanonical: boolean }>();

  for (const r of lines) {
    const rawQty = Number(r.quantity);
    const dozens = r.unit === "each" ? rawQty / 12 : rawQty;
    const revenue = Number(r.lineTotal);

    const lower = r.product.toLowerCase();
    const match = canonical.find(c => lower.includes(c.productNameLower));
    const key = match?.productName ?? UNCATEGORIZED;
    const isCanonical = !!match;

    const bucket = buckets.get(key) ?? { product: key, dozens: 0, revenue: 0, isCanonical };
    bucket.dozens += dozens;
    bucket.revenue += revenue;
    buckets.set(key, bucket);
  }

  const rows = Array.from(buckets.values())
    .map(b => ({
      product: b.product,
      dozens: Math.round(b.dozens * 100) / 100,
      revenue: Math.round(b.revenue * 100) / 100,
      isCanonical: b.isCanonical,
    }))
    .sort((a, b) => b.dozens - a.dozens);

  const totalDozens = Math.round(rows.reduce((sum, r) => sum + r.dozens, 0) * 100) / 100;

  return { rows, totalDozens };
}

// What does this client order — grouped by the RAW order-line product name
// (no canonical rewriting; the user wants to see what the customer literally
// orders). Cancelled orders excluded.
export async function productMixByCustomer(customerId: number, range: PeriodRange) {
  const db = await getDb();
  if (!db) return [];

  const lines = await db
    .select({
      product: orderItems.product,
      quantity: orderItems.quantity,
      unit: orderItems.unit,
      lineTotal: orderItems.lineTotal,
      orderId: orderItems.orderId,
    })
    .from(orders)
    .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
    .where(
      and(
        eq(orders.customerId, customerId),
        notInArray(orders.status, ['cancelled']),
        ...periodFilters(range)
      )
    );

  const buckets = new Map<string, { product: string; dozens: number; revenue: number; orderIds: Set<number> }>();
  for (const r of lines) {
    const rawQty = Number(r.quantity);
    const dozens = r.unit === "each" ? rawQty / 12 : rawQty;
    const bucket = buckets.get(r.product) ?? {
      product: r.product,
      dozens: 0,
      revenue: 0,
      orderIds: new Set<number>(),
    };
    bucket.dozens += dozens;
    bucket.revenue += Number(r.lineTotal);
    bucket.orderIds.add(r.orderId);
    buckets.set(r.product, bucket);
  }

  return Array.from(buckets.values())
    .map(b => ({
      product: b.product,
      dozens: Math.round(b.dozens * 100) / 100,
      revenue: Math.round(b.revenue * 100) / 100,
      orderCount: b.orderIds.size,
    }))
    .sort((a, b) => b.dozens - a.dozens);
}

// Company totals over the same delivered+paid set + optional date range.
export async function profitSummary(dateRange?: ProfitDateRange) {
  const rows = await profitByCustomer(dateRange);
  const totals = rows.reduce(
    (acc, r) => {
      acc.revenue += r.revenue;
      acc.cost += r.cost;
      acc.profit += r.profit;
      acc.uncostedRevenue += r.uncostedRevenue;
      return acc;
    },
    { revenue: 0, cost: 0, profit: 0, uncostedRevenue: 0 }
  );
  const costedRevenue = totals.revenue - totals.uncostedRevenue;
  const marginPct = costedRevenue > 0 ? (totals.profit / costedRevenue) * 100 : null;
  const uncostedRevenueShare =
    totals.revenue > 0 ? (totals.uncostedRevenue / totals.revenue) * 100 : 0;
  return {
    revenue: Math.round(totals.revenue * 100) / 100,
    cost: Math.round(totals.cost * 100) / 100,
    profit: Math.round(totals.profit * 100) / 100,
    marginPct: marginPct === null ? null : Math.round(marginPct * 10) / 10,
    uncostedRevenue: Math.round(totals.uncostedRevenue * 100) / 100,
    uncostedRevenueShare: Math.round(uncostedRevenueShare * 10) / 10,
  };
}
