import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Leads table ─────────────────────────────────────────────────────────────

export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  business: varchar("business", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  message: text("message"),
  status: mysqlEnum("status", ["new", "contacted", "qualified", "converted", "lost"]).default("new").notNull(),
  source: varchar("source", { length: 100 }).default("website"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

// ─── Customers table ─────────────────────────────────────────────────────────

export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  businessName: varchar("businessName", { length: 255 }).notNull(),
  contactName: varchar("contactName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  segment: mysqlEnum("segment", ["cafe", "restaurant", "hotel", "grocery", "catering", "university", "other"]).default("cafe").notNull(),
  notes: text("notes"),
  status: mysqlEnum("customerStatus", ["active", "inactive", "prospect"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

// ─── Orders table ────────────────────────────────────────────────────────────

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  orderNumber: varchar("orderNumber", { length: 20 }).notNull().unique(),
  status: mysqlEnum("orderStatus", ["pending", "confirmed", "preparing", "delivered", "paid", "cancelled"]).default("pending").notNull(),
  deliveryDate: timestamp("deliveryDate").notNull(),
  deliveryAddress: text("deliveryAddress"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull().default("0.00"),
  discount: decimal("discount", { precision: 10, scale: 2 }).notNull().default("0.00"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull().default("0.00"),
  notes: text("notes"),
  recurringOrderId: int("recurringOrderId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// ─── Order Items table ───────────────────────────────────────────────────────

export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  product: mysqlEnum("product", ["plain", "sesame", "everything"]).notNull(),
  quantityDozens: decimal("quantityDozens", { precision: 10, scale: 1 }).notNull(),
  pricePerDozen: decimal("pricePerDozen", { precision: 10, scale: 2 }).notNull(),
  lineTotal: decimal("lineTotal", { precision: 10, scale: 2 }).notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

// ─── Recurring Orders table ──────────────────────────────────────────────────

export const recurringOrders = mysqlTable("recurring_orders", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  dayOfWeek: mysqlEnum("dayOfWeek", ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]).notNull(),
  frequency: mysqlEnum("frequency", ["weekly", "biweekly", "monthly"]).default("weekly").notNull(),
  deliveryAddress: text("deliveryAddress"),
  notes: text("notes"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull().default("0.00"),
  discount: decimal("discount", { precision: 10, scale: 2 }).notNull().default("0.00"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull().default("0.00"),
  status: mysqlEnum("recurringStatus", ["active", "paused", "cancelled"]).default("active").notNull(),
  nextDelivery: timestamp("nextDelivery"),
  lastGenerated: timestamp("lastGenerated"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RecurringOrder = typeof recurringOrders.$inferSelect;
export type InsertRecurringOrder = typeof recurringOrders.$inferInsert;

// ─── Recurring Order Items table ─────────────────────────────────────────────

export const recurringOrderItems = mysqlTable("recurring_order_items", {
  id: int("id").autoincrement().primaryKey(),
  recurringOrderId: int("recurringOrderId").notNull(),
  product: mysqlEnum("recurringProduct", ["plain", "sesame", "everything"]).notNull(),
  quantityDozens: decimal("quantityDozens", { precision: 10, scale: 1 }).notNull(),
  pricePerDozen: decimal("pricePerDozen", { precision: 10, scale: 2 }).notNull(),
  lineTotal: decimal("lineTotal", { precision: 10, scale: 2 }).notNull(),
});

export type RecurringOrderItem = typeof recurringOrderItems.$inferSelect;
export type InsertRecurringOrderItem = typeof recurringOrderItems.$inferInsert;
