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

  // ─── LEADS ────────────────────────────────────────────────────────────────

  leads: router({
    // Public: anyone can submit a lead from the wholesale page
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
            content: `${input.name} from ${input.business} (${input.email}) submitted a tasting request.\n\n${input.message ? `Message: ${input.message}` : "No message provided."}`,
          });
        } catch (e) {
          console.warn("[Leads] Failed to notify owner:", e);
        }

        return { success: true, lead };
      }),

    // Protected: only logged-in users can view leads
    list: protectedProcedure.query(async () => {
      return getAllLeads();
    }),

    // Protected: update lead status
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

    // Protected: delete a lead
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

    // Get orders for a specific customer
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

        // Calculate totals
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
          },
          items
        );

        // Notify owner about new order
        try {
          await notifyOwner({
            title: `New Order: ${orderNumber}`,
            content: `Order ${orderNumber} created for $${total.toFixed(2)}.\nDelivery: ${input.deliveryDate}\nItems: ${items.length} products`,
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
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteOrder(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
