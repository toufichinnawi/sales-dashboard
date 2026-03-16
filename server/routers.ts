import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { createLead, getAllLeads, updateLeadStatus, deleteLead } from "./db";
import { notifyOwner } from "./_core/notification";
import { z } from "zod";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

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
});

export type AppRouter = typeof appRouter;
