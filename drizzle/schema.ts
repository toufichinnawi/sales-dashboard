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
  address: text("address"),
  message: text("message"),
  status: mysqlEnum("status", ["new", "contacted", "interested", "tasting_scheduled", "quote_sent", "negotiation", "won", "lost"]).default("new").notNull(),
  source: varchar("source", { length: 100 }).default("website"),
  businessType: mysqlEnum("businessType", ["cafe", "restaurant", "grocery", "hotel", "caterer", "other"]),
  leadSource: mysqlEnum("leadSource", ["instagram", "referral", "website", "walk_in", "cold_call", "other"]),
  potentialValue: mysqlEnum("potentialValue", ["low", "medium", "high"]),
  estimatedWeeklyOrder: varchar("estimatedWeeklyOrder", { length: 100 }),
  productsInterested: text("productsInterested"),
  assignedTo: varchar("assignedTo", { length: 255 }),
  lastContactDate: timestamp("lastContactDate"),
  nextFollowUpDate: timestamp("nextFollowUpDate"),
  followUpPriority: mysqlEnum("followUpPriority", ["low", "normal", "high", "urgent"]).default("normal"),
  followUpNote: text("followUpNote"),
  followUpStatus: mysqlEnum("followUpStatus", ["pending", "done"]).default("pending"),
  notes: text("notes"),
  lostReason: mysqlEnum("lostReason", ["price_too_high", "no_response", "not_interested", "already_has_supplier", "location_issue", "product_mismatch", "other"]),
  convertedAt: timestamp("convertedAt"),
  convertedCustomerId: int("convertedCustomerId"),
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
  userId: int("userId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

// ─── Customer Invites table ─────────────────────────────────────────────────

export const customerInvites = mysqlTable("customer_invites", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  email: varchar("email", { length: 320 }).notNull(),
  status: mysqlEnum("inviteStatus", ["pending", "accepted", "expired"]).default("pending").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CustomerInvite = typeof customerInvites.$inferSelect;
export type InsertCustomerInvite = typeof customerInvites.$inferInsert;

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
  product: varchar("productName", { length: 255 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull().default("dozen"),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
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
  product: varchar("recurringProductName", { length: 255 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull().default("dozen"),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  lineTotal: decimal("lineTotal", { precision: 10, scale: 2 }).notNull(),
});

export type RecurringOrderItem = typeof recurringOrderItems.$inferSelect;
export type InsertRecurringOrderItem = typeof recurringOrderItems.$inferInsert;

// ─── QuickBooks Connection table ────────────────────────────────────────────

export const qbConnections = mysqlTable("qb_connections", {
  id: int("id").autoincrement().primaryKey(),
  realmId: varchar("realmId", { length: 50 }).notNull().unique(),
  companyName: varchar("companyName", { length: 255 }),
  accessToken: text("accessToken").notNull(),
  refreshToken: text("refreshToken").notNull(),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt").notNull(),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt").notNull(),
  isActive: int("isActive").notNull().default(1),
  lastSyncAt: timestamp("lastSyncAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QbConnection = typeof qbConnections.$inferSelect;
export type InsertQbConnection = typeof qbConnections.$inferInsert;

// ─── QuickBooks Sync Log table ──────────────────────────────────────────────

export const qbSyncLog = mysqlTable("qb_sync_log", {
  id: int("id").autoincrement().primaryKey(),
  connectionId: int("connectionId").notNull(),
  syncType: mysqlEnum("syncType", ["full", "incremental", "customers", "invoices", "payments"]).notNull(),
  status: mysqlEnum("syncStatus", ["running", "completed", "failed"]).default("running").notNull(),
  customersCreated: int("customersCreated").default(0),
  customersUpdated: int("customersUpdated").default(0),
  ordersCreated: int("ordersCreated").default(0),
  ordersUpdated: int("ordersUpdated").default(0),
  paymentsProcessed: int("paymentsProcessed").default(0),
  errorMessage: text("errorMessage"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type QbSyncLog = typeof qbSyncLog.$inferSelect;
export type InsertQbSyncLog = typeof qbSyncLog.$inferInsert;

// ─── Tasting Requests table ────────────────────────────────────────────────

export const tastingRequests = mysqlTable("tasting_requests", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  business: varchar("business", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  preferredDate: varchar("preferredDate", { length: 100 }),
  bagelPreferences: text("bagelPreferences"),
  message: text("message"),
  status: mysqlEnum("tastingStatus", ["pending", "scheduled", "completed", "cancelled"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TastingRequest = typeof tastingRequests.$inferSelect;
export type InsertTastingRequest = typeof tastingRequests.$inferInsert;

// ─── Notifications table ──────────────────────────────────────────────────

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("notifType", ["new_lead", "tasting_request", "new_order", "order_status", "system"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  link: varchar("link", { length: 500 }),
  isRead: int("isRead").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ─── Pending Emails table (email queue for Outlook MCP sending) ─────────────

export const pendingEmails = mysqlTable("pending_emails", {
  id: int("id").autoincrement().primaryKey(),
  toEmail: varchar("toEmail", { length: 320 }).notNull(),
  toName: varchar("toName", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(),
  attachments: text("attachments"), // JSON array of file URLs
  status: mysqlEnum("emailStatus", ["pending", "sending", "sent", "failed"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  leadId: int("leadId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  sentAt: timestamp("sentAt"),
});

export type PendingEmail = typeof pendingEmails.$inferSelect;
export type InsertPendingEmail = typeof pendingEmails.$inferInsert;

// ─── Lead Activities table (activity timeline for leads) ─────────────────────

export const leadActivities = mysqlTable("lead_activities", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  activityType: mysqlEnum("activityType", [
    "lead_created",
    "status_changed",
    "note_added",
    "phone_call",
    "email_sent",
    "follow_up_scheduled",
    "tasting_scheduled",
    "quote_sent",
    "marked_won",
    "marked_lost",
  ]).notNull(),
  note: text("note"),
  userId: int("userId"),
  userName: varchar("userName", { length: 255 }),
  metadata: text("metadata"), // JSON for extra data like old/new status
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LeadActivity = typeof leadActivities.$inferSelect;
export type InsertLeadActivity = typeof leadActivities.$inferInsert;

// ─── Portal Documents table ─────────────────────────────────────────────────

export const portalDocuments = mysqlTable("portal_documents", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  documentType: mysqlEnum("documentType", ["brochure", "spec_sheet", "client_summary", "pricing", "other"]).default("other").notNull(),
  visibility: mysqlEnum("visibility", ["admin_only", "client_portal"]).default("admin_only").notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: text("fileKey").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileSize: int("fileSize").notNull().default(0),
  uploadedBy: int("uploadedBy"),
  uploadedByName: varchar("uploadedByName", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PortalDocument = typeof portalDocuments.$inferSelect;
export type InsertPortalDocument = typeof portalDocuments.$inferInsert;
