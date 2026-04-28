import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  createLead,
  getAllLeads,
  getLeadById,
  updateLead,
  updateLeadStatus,
  deleteLead,
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  generateOrderNumber,
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  getOrdersByCustomerId,
  getDashboardStats,
  createRecurringOrder,
  getAllRecurringOrders,
  getRecurringOrderById,
  updateRecurringOrderStatus,
  deleteRecurringOrder,
  getRecurringOrdersByCustomerId,
  computeNextDelivery,
  createCustomerInvite,
  getInviteByToken,
  acceptInvite,
  getCustomerByUserId,
  getInvitesByCustomerId,
  getPortalOrders,
  getPortalRecurringOrders,
  bulkCreateCustomers,
  getAllCustomersWithStats,
  createTastingRequest,
  getAllTastingRequests,
  updateTastingRequestStatus,
  createNotification,
  getAllNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  createPendingEmail,
  getPendingEmails,
  updatePendingEmailStatus,
} from "./db";
import crypto from "crypto";
import { notifyOwner } from "./_core/notification";
import { z } from "zod";
import {
  getActiveQBConnection,
  disconnectQB,
  getRecentSyncLogs,
} from "./quickbooks";
import { runFullSync } from "./qb-sync";
import { sendBrochureEmail, getBrochureEmailContent, BROCHURE_URL } from "./brochure-email";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── DASHBOARD ───────────────────────────────────────────────────────────

  dashboard: router({
    stats: protectedProcedure
      .input(
        z.object({
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        const stats = await getDashboardStats(input ?? undefined);
        return stats;
      }),
  }),

  // ─── LEADS ────────────────────────────────────────────────────────────────

  leads: router({
    create: publicProcedure
      .input(
        z.object({
          name: z.string().min(1, "Name is required"),
          business: z.string().min(1, "Business name is required"),
          email: z.string().email("Valid email is required"),
          phone: z.string().optional(),
          message: z.string().optional(),
          source: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const lead = await createLead({
          name: input.name,
          business: input.business,
          email: input.email,
          phone: input.phone ?? null,
          message: input.message ?? null,
          source: input.source ?? "website",
        });

        // Notify owner about new lead
        try {
          await notifyOwner({
            title: `New Wholesale Lead: ${input.business}`,
            content: `${input.name} from ${input.business} (${input.email}) submitted a tasting request.\n\nPhone: ${input.phone || "Not provided"}\n\n${input.message ? `Message: ${input.message}` : "No message provided."}\n\nSource: ${input.source || "website"}\n\nLog in to your dashboard to follow up.`,
          });
        } catch (e) {
          console.warn("[Leads] Failed to notify owner:", e);
        }

        // Create in-app notification
        try {
          await createNotification({
            type: "new_lead",
            title: `New Lead: ${input.business}`,
            message: `${input.name} from ${input.business} (${input.email}) — ${input.source || "website"}`,
            link: "/leads",
          });
        } catch (e) {
          console.warn("[Leads] Failed to create notification:", e);
        }

        // Send wholesale brochure email directly via SMTP
        if (input.email) {
          try {
            await sendBrochureEmail({ name: input.name, business: input.business, email: input.email });
            console.log(`[Leads] Brochure email queued for ${input.email}`);
          } catch (e) {
            console.warn("[Leads] Failed to send brochure email:", e);
          }
        }

        return { success: true, lead };
      }),

    list: protectedProcedure.query(async () => {
      return getAllLeads();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const lead = await getLeadById(input.id);
        if (!lead) throw new Error("Lead not found");
        return lead;
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          business: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().nullable().optional(),
          address: z.string().nullable().optional(),
          message: z.string().nullable().optional(),
          status: z.enum(["new", "contacted", "interested", "tasting_scheduled", "quote_sent", "negotiation", "won", "lost"]).optional(),
          source: z.string().nullable().optional(),
          businessType: z.enum(["cafe", "restaurant", "grocery", "hotel", "caterer", "other"]).nullable().optional(),
          leadSource: z.enum(["instagram", "referral", "website", "walk_in", "cold_call", "other"]).nullable().optional(),
          potentialValue: z.enum(["low", "medium", "high"]).nullable().optional(),
          estimatedWeeklyOrder: z.string().nullable().optional(),
          productsInterested: z.string().nullable().optional(),
          assignedTo: z.string().nullable().optional(),
          lastContactDate: z.date().nullable().optional(),
          nextFollowUpDate: z.date().nullable().optional(),
          notes: z.string().nullable().optional(),
          lostReason: z.enum(["price_too_high", "no_response", "not_interested", "already_has_supplier", "location_issue", "product_mismatch", "other"]).nullable().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const lead = await updateLead(id, data);
        if (!lead) throw new Error("Lead not found");
        return { success: true, lead };
      }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["new", "contacted", "interested", "tasting_scheduled", "quote_sent", "negotiation", "won", "lost"]),
        })
      )
      .mutation(async ({ input }) => {
        await updateLeadStatus(input.id, input.status);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteLead(input.id);
        return { success: true };
      }),

    sendBrochure: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          business: z.string(),
          email: z.string().email(),
          leadId: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        // Queue brochure email for sending via Outlook MCP
        const emailId = await sendBrochureEmail(input);
        console.log(`[Brochure] Email queued (id=${emailId}) for ${input.email}`);

        // Update lead status to contacted if we have a leadId
        if (emailId && input.leadId) {
          try {
            await updateLeadStatus(input.leadId, "contacted");
          } catch (e) {
            console.warn("[Brochure] Failed to update lead status:", e);
          }
        }

        if (!emailId) {
          throw new Error("Failed to queue brochure email. Please try again.");
        }

        return {
          success: true,
          emailId,
          brochureUrl: BROCHURE_URL,
        };
      }),

    // Get pending email status
    emailStatus: protectedProcedure
      .input(z.object({}))
      .query(async () => {
        const pending = await getPendingEmails();
        return { pendingCount: pending.length, emails: pending };
      }),
  }),

  // ─── CUSTOMERS ────────────────────────────────────────────────────────────

  customers: router({
    create: protectedProcedure
      .input(
        z.object({
          businessName: z.string().min(1, "Business name is required"),
          contactName: z.string().min(1, "Contact name is required"),
          email: z.string().email("Valid email is required"),
          phone: z.string().optional(),
          address: z.string().optional(),
          segment: z.enum(["cafe", "restaurant", "hotel", "grocery", "catering", "university", "other"]).default("cafe"),
          notes: z.string().optional(),
          status: z.enum(["active", "inactive", "prospect"]).default("active"),
        })
      )
      .mutation(async ({ input }) => {
        const customer = await createCustomer({
          businessName: input.businessName,
          contactName: input.contactName,
          email: input.email,
          phone: input.phone ?? null,
          address: input.address ?? null,
          segment: input.segment,
          notes: input.notes ?? null,
          status: input.status,
        });
        return { success: true, customer };
      }),

    list: protectedProcedure.query(async () => {
      return getAllCustomers();
    }),

    listWithStats: protectedProcedure.query(async () => {
      return getAllCustomersWithStats();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getCustomerById(input.id);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          businessName: z.string().optional(),
          contactName: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().nullable().optional(),
          address: z.string().nullable().optional(),
          segment: z.enum(["cafe", "restaurant", "hotel", "grocery", "catering", "university", "other"]).optional(),
          notes: z.string().nullable().optional(),
          status: z.enum(["active", "inactive", "prospect"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateCustomer(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteCustomer(input.id);
        return { success: true };
      }),

    orders: protectedProcedure
      .input(z.object({ customerId: z.number() }))
      .query(async ({ input }) => {
        return getOrdersByCustomerId(input.customerId);
      }),
  }),

  // ─── ORDERS ───────────────────────────────────────────────────────────────

  orders: router({
    create: protectedProcedure
      .input(
        z.object({
          customerId: z.number(),
          deliveryDate: z.string().min(1, "Delivery date is required"),
          deliveryAddress: z.string().optional(),
          notes: z.string().optional(),
          discount: z.number().min(0).default(0),
          recurringOrderId: z.number().optional(),
          items: z.array(
            z.object({
              product: z.enum(["plain", "sesame", "everything"]),
              quantity: z.number().min(0.5, "Minimum 0.5"),
              unitPrice: z.number().min(0),
            })
          ).min(1, "At least one item is required"),
        })
      )
      .mutation(async ({ input }) => {
        const orderNumber = await generateOrderNumber();

        const items = input.items.map((item) => ({
          product: item.product,
          quantity: String(item.quantity),
          unitPrice: String(item.unitPrice),
          lineTotal: String(Number((item.quantity * item.unitPrice).toFixed(2))),
        }));

        const subtotal = items.reduce((sum, item) => sum + Number(item.lineTotal), 0);
        const discount = input.discount;
        const total = Math.max(0, subtotal - discount);

        const result = await createOrder(
          {
            customerId: input.customerId,
            orderNumber,
            deliveryDate: new Date(input.deliveryDate),
            deliveryAddress: input.deliveryAddress ?? null,
            notes: input.notes ?? null,
            subtotal: String(subtotal.toFixed(2)),
            discount: String(discount.toFixed(2)),
            total: String(total.toFixed(2)),
            recurringOrderId: input.recurringOrderId ?? null,
          },
          items
        );

        // Notify owner about new order
        try {
          await notifyOwner({
            title: `New Order: ${orderNumber}`,
            content: `Order ${orderNumber} created for $${total.toFixed(2)}.\nDelivery: ${input.deliveryDate}\nItems: ${items.map(i => `${i.quantity} x ${i.product}`).join(", ")}`,
          });
        } catch (e) {
          console.warn("[Orders] Failed to notify owner:", e);
        }

        // Create in-app notification
        try {
          await createNotification({
            type: "new_order",
            title: `New Order: ${orderNumber}`,
            message: `$${total.toFixed(2)} — ${items.map(i => `${i.quantity} x ${i.product}`).join(", ")}`,
            link: "/orders",
          });
        } catch (e) {
          console.warn("[Orders] Failed to create notification:", e);
        }

        return { success: true, ...result };
      }),

    list: protectedProcedure
      .input(
        z.object({
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        const filters: { startDate?: Date; endDate?: Date } = {};
        if (input?.startDate) {
          filters.startDate = new Date(input.startDate + "T00:00:00Z");
        }
        if (input?.endDate) {
          // End of day
          filters.endDate = new Date(input.endDate + "T23:59:59Z");
        }
        return getAllOrders(Object.keys(filters).length > 0 ? filters : undefined);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getOrderById(input.id);
      }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["pending", "confirmed", "preparing", "delivered", "paid", "cancelled"]),
        })
      )
      .mutation(async ({ input }) => {
        await updateOrderStatus(input.id, input.status);

        // Notify owner on key status changes
        if (input.status === "delivered" || input.status === "paid") {
          try {
            const orderData = await getOrderById(input.id);
            const orderNum = orderData?.order.orderNumber ?? `#${input.id}`;
            const total = orderData?.order.total ?? "0.00";

            if (input.status === "delivered") {
              await notifyOwner({
                title: `Order Delivered: ${orderNum}`,
                content: `Order ${orderNum} ($${total}) has been delivered successfully.\n\nRemember to follow up for payment confirmation.`,
              });
              await createNotification({
                type: "order_status",
                title: `Delivered: ${orderNum}`,
                message: `Order ${orderNum} ($${total}) delivered — follow up for payment`,
                link: "/orders",
              });
            } else if (input.status === "paid") {
              await notifyOwner({
                title: `Payment Received: ${orderNum}`,
                content: `Order ${orderNum} has been marked as paid ($${total}).\n\nRevenue recorded.`,
              });
              await createNotification({
                type: "order_status",
                title: `Paid: ${orderNum}`,
                message: `Payment received for order ${orderNum} ($${total})`,
                link: "/orders",
              });
            }
          } catch (e) {
            console.warn("[Orders] Failed to notify owner on status change:", e);
          }
        }

        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteOrder(input.id);
        return { success: true };
      }),
  }),

  // ─── RECURRING ORDERS ─────────────────────────────────────────────────────

  recurring: router({
    create: protectedProcedure
      .input(
        z.object({
          customerId: z.number(),
          dayOfWeek: z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]),
          frequency: z.enum(["weekly", "biweekly", "monthly"]).default("weekly"),
          deliveryAddress: z.string().optional(),
          notes: z.string().optional(),
          discount: z.number().min(0).default(0),
          items: z.array(
            z.object({
              product: z.enum(["plain", "sesame", "everything"]),
              quantity: z.number().min(0.5, "Minimum 0.5"),
              unitPrice: z.number().min(0),
            })
          ).min(1, "At least one item is required"),
        })
      )
      .mutation(async ({ input }) => {
        const items = input.items.map((item) => ({
          product: item.product,
          quantity: String(item.quantity),
          unitPrice: String(item.unitPrice),
          lineTotal: String(Number((item.quantity * item.unitPrice).toFixed(2))),
        }));

        const subtotal = items.reduce((sum, item) => sum + Number(item.lineTotal), 0);
        const discount = input.discount;
        const total = Math.max(0, subtotal - discount);
        const nextDelivery = computeNextDelivery(input.dayOfWeek);

        const result = await createRecurringOrder(
          {
            customerId: input.customerId,
            dayOfWeek: input.dayOfWeek,
            frequency: input.frequency,
            deliveryAddress: input.deliveryAddress ?? null,
            notes: input.notes ?? null,
            subtotal: String(subtotal.toFixed(2)),
            discount: String(discount.toFixed(2)),
            total: String(total.toFixed(2)),
            status: "active",
            nextDelivery,
          },
          items
        );

        // Notify owner about new standing order
        try {
          const customer = await getCustomerById(input.customerId);
          await notifyOwner({
            title: `New Standing Order: ${customer?.businessName ?? "Customer"}`,
            content: `Recurring ${input.frequency} order set up for ${customer?.businessName ?? "Customer"}.\nDay: ${input.dayOfWeek}\nTotal per delivery: $${total.toFixed(2)}\nItems: ${items.map(i => `${i.quantity} x ${i.product}`).join(", ")}\nNext delivery: ${nextDelivery.toLocaleDateString()}`,
          });
        } catch (e) {
          console.warn("[Recurring] Failed to notify owner:", e);
        }

        return { success: true, ...result };
      }),

    list: protectedProcedure.query(async () => {
      return getAllRecurringOrders();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getRecurringOrderById(input.id);
      }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["active", "paused", "cancelled"]),
        })
      )
      .mutation(async ({ input }) => {
        await updateRecurringOrderStatus(input.id, input.status);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteRecurringOrder(input.id);
        return { success: true };
      }),

    byCustomer: protectedProcedure
      .input(z.object({ customerId: z.number() }))
      .query(async ({ input }) => {
        return getRecurringOrdersByCustomerId(input.customerId);
      }),
  }),

  // ─── CUSTOMER INVITES (Admin) ───────────────────────────────────────────

  invites: router({
    create: protectedProcedure
      .input(
        z.object({
          customerId: z.number(),
          email: z.string().email(),
          origin: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        const invite = await createCustomerInvite({
          customerId: input.customerId,
          token,
          email: input.email,
          expiresAt,
        });

        const inviteUrl = `${input.origin}/portal/accept-invite?token=${token}`;

        // Notify owner
        try {
          const customer = await getCustomerById(input.customerId);
          await notifyOwner({
            title: `Portal Invite Sent: ${customer?.businessName ?? "Customer"}`,
            content: `Invite sent to ${input.email} for ${customer?.businessName ?? "Customer"}.\nInvite link: ${inviteUrl}\nExpires: ${expiresAt.toLocaleDateString()}`,
          });
        } catch (e) {
          console.warn("[Invites] Failed to notify owner:", e);
        }

        return { success: true, invite, inviteUrl };
      }),

    listByCustomer: protectedProcedure
      .input(z.object({ customerId: z.number() }))
      .query(async ({ input }) => {
        return getInvitesByCustomerId(input.customerId);
      }),
  }),

  // ─── CUSTOMER PORTAL (Customer-facing) ─────────────────────────────────

  portal: router({
    // Accept invite and link user to customer
    acceptInvite: protectedProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const success = await acceptInvite(input.token, ctx.user.id);
        if (!success) {
          throw new Error("Invalid or expired invite token.");
        }
        return { success: true };
      }),

    // Get current customer profile (linked to auth user)
    me: protectedProcedure.query(async ({ ctx }) => {
      const customer = await getCustomerByUserId(ctx.user.id);
      return customer;
    }),

    // My orders
    myOrders: protectedProcedure.query(async ({ ctx }) => {
      const customer = await getCustomerByUserId(ctx.user.id);
      if (!customer) return [];
      return getPortalOrders(customer.id);
    }),

    // My standing orders
    myStandingOrders: protectedProcedure.query(async ({ ctx }) => {
      const customer = await getCustomerByUserId(ctx.user.id);
      if (!customer) return [];
      return getPortalRecurringOrders(customer.id);
    }),

    // Quick order from phone
    quickOrder: protectedProcedure
      .input(
        z.object({
          deliveryDate: z.string().min(1),
          deliveryAddress: z.string().optional(),
          notes: z.string().optional(),
          items: z.array(
            z.object({
              product: z.enum(["plain", "sesame", "everything"]),
              quantity: z.number().min(0.5),
              unitPrice: z.number().min(0),
            })
          ).min(1),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const customer = await getCustomerByUserId(ctx.user.id);
        if (!customer) throw new Error("No customer account linked.");

        const orderNumber = await generateOrderNumber();
        const items = input.items.map((item) => ({
          product: item.product,
          quantity: String(item.quantity),
          unitPrice: String(item.unitPrice),
          lineTotal: String(Number((item.quantity * item.unitPrice).toFixed(2))),
        }));

        const subtotal = items.reduce((sum, item) => sum + Number(item.lineTotal), 0);
        const total = subtotal;

        const result = await createOrder(
          {
            customerId: customer.id,
            orderNumber,
            deliveryDate: new Date(input.deliveryDate),
            deliveryAddress: input.deliveryAddress ?? customer.address ?? null,
            notes: input.notes ?? null,
            subtotal: String(subtotal.toFixed(2)),
            discount: "0.00",
            total: String(total.toFixed(2)),
            recurringOrderId: null,
          },
          items
        );

        // Notify owner
        try {
          await notifyOwner({
            title: `Portal Order: ${orderNumber} from ${customer.businessName}`,
            content: `${customer.businessName} placed order ${orderNumber} via the customer portal.\nTotal: $${total.toFixed(2)}\nDelivery: ${input.deliveryDate}\nItems: ${items.map(i => `${i.quantity} x ${i.product}`).join(", ")}`,
          });
        } catch (e) {
          console.warn("[Portal] Failed to notify owner:", e);
        }

        return { success: true, ...result };
      }),

    // Update profile
    updateProfile: protectedProcedure
      .input(
        z.object({
          contactName: z.string().optional(),
          phone: z.string().nullable().optional(),
          address: z.string().nullable().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const customer = await getCustomerByUserId(ctx.user.id);
        if (!customer) throw new Error("No customer account linked.");
        await updateCustomer(customer.id, input);
        return { success: true };
      }),
  }),

  // ─── QUICKBOOKS INTEGRATION ──────────────────────────────────────────

  quickbooks: router({
    // Get connection status
    status: protectedProcedure.query(async () => {
      const conn = await getActiveQBConnection();
      if (!conn) return { connected: false, connection: null };
      return {
        connected: true,
        connection: {
          id: conn.id,
          realmId: conn.realmId,
          companyName: conn.companyName,
          lastSyncAt: conn.lastSyncAt,
          accessTokenExpiresAt: conn.accessTokenExpiresAt,
          refreshTokenExpiresAt: conn.refreshTokenExpiresAt,
          createdAt: conn.createdAt,
        },
      };
    }),

    // Disconnect QuickBooks
    disconnect: protectedProcedure.mutation(async () => {
      const conn = await getActiveQBConnection();
      if (!conn) throw new Error("No active QuickBooks connection");
      await disconnectQB(conn.id);
      return { success: true };
    }),

    // Trigger full sync
    sync: protectedProcedure.mutation(async () => {
      const result = await runFullSync();

      // Notify owner about sync results
      try {
        await notifyOwner({
          title: `QuickBooks Sync ${result.success ? "Complete" : "Failed"}`,
          content: [
            `Customers: ${result.customers.created} created, ${result.customers.updated} updated`,
            `Invoices: ${result.invoices.created} created, ${result.invoices.updated} updated`,
            `Credit Memos: ${result.creditMemos.created} created, ${result.creditMemos.updated} updated`,
            `Sales Receipts: ${result.salesReceipts.created} created, ${result.salesReceipts.updated} updated`,
            `Income Deposits: ${result.incomeDeposits.created} created, ${result.incomeDeposits.updated} updated`,
            `Payments: ${result.payments.processed} processed`,
            result.errors.length > 0
              ? `Errors: ${result.errors.length} (check sync logs)`
              : "No errors",
          ].join("\n"),
        });
      } catch (e) {
        console.warn("[QB] Failed to notify owner about sync:", e);
      }

      return result;
    }),

    // Get sync logs
    syncLogs: protectedProcedure.query(async () => {
      return getRecentSyncLogs(50);
    }),
  }),

  // ─── BULK IMPORT (QuickBooks CSV) ────────────────────────────────────

  tastings: router({
    // Public: anyone with the link can submit a tasting request
    submit: publicProcedure
      .input(
        z.object({
          name: z.string().min(1, "Name is required"),
          business: z.string().min(1, "Business name is required"),
          email: z.string().email("Valid email is required"),
          phone: z.string().optional(),
          address: z.string().optional(),
          preferredDate: z.string().optional(),
          bagelPreferences: z.string().optional(),
          message: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const request = await createTastingRequest({
          name: input.name,
          business: input.business,
          email: input.email,
          phone: input.phone ?? null,
          address: input.address ?? null,
          preferredDate: input.preferredDate ?? null,
          bagelPreferences: input.bagelPreferences ?? null,
          message: input.message ?? null,
        });

        // Notify the owner about the new tasting request
        try {
          await notifyOwner({
            title: `New Tasting Request: ${input.business}`,
            content: `${input.name} from ${input.business} (${input.email}) has requested a free tasting.\n\nPhone: ${input.phone || "Not provided"}\nAddress: ${input.address || "Not provided"}\nPreferred Date: ${input.preferredDate || "Flexible"}\nBagel Preferences: ${input.bagelPreferences || "All varieties"}\nMessage: ${input.message || "None"}\n\nFollow up within 24 hours to schedule the tasting.`,
          });
        } catch (e) {
          console.warn("[Tastings] Failed to notify owner:", e);
        }

        // Create in-app notification
        try {
          await createNotification({
            type: "tasting_request",
            title: `Tasting Request: ${input.business}`,
            message: `${input.name} from ${input.business} wants to try ${input.bagelPreferences || "all varieties"}`,
            link: "/tastings",
          });
        } catch (e) {
          console.warn("[Tastings] Failed to create notification:", e);
        }

        return { success: true, request };
      }),

    // Protected: team can view all tasting requests
    list: protectedProcedure.query(async () => {
      return getAllTastingRequests();
    }),

    // Protected: team can update tasting request status
    updateStatus: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["pending", "scheduled", "completed", "cancelled"]),
        })
      )
      .mutation(async ({ input }) => {
        await updateTastingRequestStatus(input.id, input.status);
        return { success: true };
      }),
  }),

  // ─── NOTIFICATIONS ──────────────────────────────────────────────────────

  notifications: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(100).default(50) }).optional())
      .query(async ({ input }) => {
        return getAllNotifications(input?.limit ?? 50);
      }),

    unreadCount: protectedProcedure.query(async () => {
      return getUnreadNotificationCount();
    }),

    markRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await markNotificationRead(input.id);
        return { success: true };
      }),

    markAllRead: protectedProcedure.mutation(async () => {
      await markAllNotificationsRead();
      return { success: true };
    }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteNotification(input.id);
        return { success: true };
      }),
  }),

  import: router({
    customers: protectedProcedure
      .input(
        z.object({
          customers: z.array(
            z.object({
              businessName: z.string().min(1),
              contactName: z.string().min(1),
              email: z.string().email(),
              phone: z.string().optional(),
              address: z.string().optional(),
              segment: z.enum(["cafe", "restaurant", "hotel", "grocery", "catering", "university", "other"]).default("other"),
              notes: z.string().optional(),
            })
          ).min(1),
        })
      )
      .mutation(async ({ input }) => {
        const customerList = input.customers.map((c) => ({
          businessName: c.businessName,
          contactName: c.contactName,
          email: c.email,
          phone: c.phone ?? null,
          address: c.address ?? null,
          segment: c.segment,
          notes: c.notes ?? null,
          status: "active" as const,
        }));

        const result = await bulkCreateCustomers(customerList);

        try {
          await notifyOwner({
            title: `QuickBooks Import: ${result.imported} customers added`,
            content: `Imported ${result.imported} new customers from QuickBooks CSV.\nSkipped ${result.skipped} duplicates (matching email).`,
          });
        } catch (e) {
          console.warn("[Import] Failed to notify owner:", e);
        }

        return result;
      }),
  }),
});

export type AppRouter = typeof appRouter;
