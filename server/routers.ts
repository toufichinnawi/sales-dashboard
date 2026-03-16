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
} from "./db";
import { notifyOwner } from "./_core/notification";
import { z } from "zod";

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
    stats: protectedProcedure.query(async () => {
      const stats = await getDashboardStats();
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
              quantityDozens: z.number().min(0.5, "Minimum 0.5 dozen"),
              pricePerDozen: z.number().min(0),
            })
          ).min(1, "At least one item is required"),
        })
      )
      .mutation(async ({ input }) => {
        const orderNumber = await generateOrderNumber();

        const items = input.items.map((item) => ({
          product: item.product,
          quantityDozens: String(item.quantityDozens),
          pricePerDozen: String(item.pricePerDozen),
          lineTotal: String(Number((item.quantityDozens * item.pricePerDozen).toFixed(2))),
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
            content: `Order ${orderNumber} created for $${total.toFixed(2)}.\nDelivery: ${input.deliveryDate}\nItems: ${items.map(i => `${i.quantityDozens} dz ${i.product}`).join(", ")}`,
          });
        } catch (e) {
          console.warn("[Orders] Failed to notify owner:", e);
        }

        return { success: true, ...result };
      }),

    list: protectedProcedure.query(async () => {
      return getAllOrders();
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
              quantityDozens: z.number().min(0.5, "Minimum 0.5 dozen"),
              pricePerDozen: z.number().min(0),
            })
          ).min(1, "At least one item is required"),
        })
      )
      .mutation(async ({ input }) => {
        const items = input.items.map((item) => ({
          product: item.product,
          quantityDozens: String(item.quantityDozens),
          pricePerDozen: String(item.pricePerDozen),
          lineTotal: String(Number((item.quantityDozens * item.pricePerDozen).toFixed(2))),
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
            content: `Recurring ${input.frequency} order set up for ${customer?.businessName ?? "Customer"}.\nDay: ${input.dayOfWeek}\nTotal per delivery: $${total.toFixed(2)}\nItems: ${items.map(i => `${i.quantityDozens} dz ${i.product}`).join(", ")}\nNext delivery: ${nextDelivery.toLocaleDateString()}`,
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
});

export type AppRouter = typeof appRouter;
