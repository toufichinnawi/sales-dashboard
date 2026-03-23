import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  createLead,
  getAllLeads,
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

        // Auto-send wholesale brochure to the lead
        if (input.email) {
          try {
            await sendBrochureEmail({
              name: input.name,
              business: input.business,
              email: input.email,
            });
          } catch (e) {
            console.warn("[Leads] Failed to send brochure email:", e);
          }
        }

        return { success: true, lead };
      }),

    list: protectedProcedure.query(async () => {
      return getAllLeads();
    }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["new", "contacted", "qualified", "converted", "lost"]),
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
        })
      )
      .mutation(async ({ input }) => {
        const emailContent = getBrochureEmailContent(input);
        const sent = await sendBrochureEmail(input);
        return {
          success: sent,
          emailContent,
          brochureUrl: BROCHURE_URL,
        };
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
            } else if (input.status === "paid") {
              await notifyOwner({
                title: `Payment Received: ${orderNum}`,
                content: `Order ${orderNum} has been marked as paid ($${total}).\n\nRevenue recorded.`,
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
