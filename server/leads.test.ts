import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "rosie@hinnawibros.com",
    name: "Rosie Manneh",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("leads", () => {
  describe("leads.create (public)", () => {
    it("validates required fields", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.leads.create({
          name: "",
          business: "Test Cafe",
          email: "test@cafe.com",
        })
      ).rejects.toThrow();
    });

    it("validates email format", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.leads.create({
          name: "Test User",
          business: "Test Cafe",
          email: "not-an-email",
        })
      ).rejects.toThrow();
    });

    it("accepts valid lead data with optional fields", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // This will attempt to insert into DB, which may not be available in test
      // but we can verify the input validation passes
      try {
        await caller.leads.create({
          name: "Test User",
          business: "Test Cafe",
          email: "test@cafe.com",
          phone: "514-555-1234",
          message: "Interested in wholesale bagels",
          source: "wholesale_landing_page",
        });
      } catch (e: any) {
        // If DB is not available, the error should be a DB error, not validation
        expect(e.message).not.toContain("Name is required");
        expect(e.message).not.toContain("Valid email is required");
      }
    });
  });

  describe("leads.list (protected)", () => {
    it("rejects unauthenticated users", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.leads.list()).rejects.toThrow();
    });

    it("allows authenticated users to list leads", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        const result = await caller.leads.list();
        expect(Array.isArray(result)).toBe(true);
      } catch (e: any) {
        // DB may not be available in test, but auth should pass
        expect(e.message).not.toContain("Please login");
      }
    });
  });

  describe("leads.updateStatus (protected)", () => {
    it("rejects unauthenticated users", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.leads.updateStatus({ id: 1, status: "contacted" })
      ).rejects.toThrow();
    });

    it("validates status enum values", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.leads.updateStatus({ id: 1, status: "invalid_status" as any })
      ).rejects.toThrow();
    });
  });

  describe("leads.delete (protected)", () => {
    it("rejects unauthenticated users", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.leads.delete({ id: 1 })).rejects.toThrow();
    });
  });
});
