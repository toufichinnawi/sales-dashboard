import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-owner",
    email: "test@example.com",
    name: "Test Owner",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

describe("leads.getById", () => {
  it("throws error for non-existent lead", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.leads.getById({ id: 999999 })).rejects.toThrow("Lead not found");
  });

  it("returns lead data for existing lead", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create a lead
    const created = await caller.leads.create({
      name: "Profile Test Lead",
      business: "Profile Test Cafe",
      email: `profile-test-${Date.now()}@test.com`,
      phone: "514-555-1234",
      message: "Test message",
      source: "manual",
    });

    expect(created.lead).toBeDefined();
    const leadId = created.lead!.id;

    // Now fetch it by ID
    const lead = await caller.leads.getById({ id: leadId });
    expect(lead).toBeDefined();
    expect(lead.name).toBe("Profile Test Lead");
    expect(lead.business).toBe("Profile Test Cafe");
    expect(lead.phone).toBe("514-555-1234");
    expect(lead.status).toBe("new");

    // Cleanup
    await caller.leads.delete({ id: leadId });
  });
});

describe("leads.update", () => {
  it("updates basic lead fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a lead
    const created = await caller.leads.create({
      name: "Update Test Lead",
      business: "Update Test Cafe",
      email: `update-test-${Date.now()}@test.com`,
      phone: "514-555-0000",
      message: "",
      source: "manual",
    });

    const leadId = created.lead!.id;

    // Update it
    const result = await caller.leads.update({
      id: leadId,
      name: "Updated Name",
      business: "Updated Business",
      phone: "514-555-9999",
      address: "123 Test Street, Montreal",
      businessType: "cafe",
      leadSource: "referral",
      potentialValue: "high",
      estimatedWeeklyOrder: "15 dozen",
      productsInterested: "Plain, Sesame, Everything",
      assignedTo: "Rosalyn",
      notes: "Great potential customer",
    });

    expect(result.success).toBe(true);
    expect(result.lead).toBeDefined();
    expect(result.lead!.name).toBe("Updated Name");
    expect(result.lead!.business).toBe("Updated Business");
    expect(result.lead!.phone).toBe("514-555-9999");
    expect(result.lead!.address).toBe("123 Test Street, Montreal");
    expect(result.lead!.businessType).toBe("cafe");
    expect(result.lead!.leadSource).toBe("referral");
    expect(result.lead!.potentialValue).toBe("high");
    expect(result.lead!.estimatedWeeklyOrder).toBe("15 dozen");
    expect(result.lead!.productsInterested).toBe("Plain, Sesame, Everything");
    expect(result.lead!.assignedTo).toBe("Rosalyn");
    expect(result.lead!.notes).toBe("Great potential customer");

    // Cleanup
    await caller.leads.delete({ id: leadId });
  });

  it("updates lead status to won", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const created = await caller.leads.create({
      name: "Status Test",
      business: "Status Cafe",
      email: `status-test-${Date.now()}@test.com`,
      phone: "",
      message: "",
      source: "manual",
    });

    const leadId = created.lead!.id;

    const result = await caller.leads.update({
      id: leadId,
      status: "won",
    });

    expect(result.success).toBe(true);
    expect(result.lead!.status).toBe("won");

    // Cleanup
    await caller.leads.delete({ id: leadId });
  });

  it("updates lead status to lost with reason", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const created = await caller.leads.create({
      name: "Lost Test",
      business: "Lost Cafe",
      email: `lost-test-${Date.now()}@test.com`,
      phone: "",
      message: "",
      source: "manual",
    });

    const leadId = created.lead!.id;

    const result = await caller.leads.update({
      id: leadId,
      status: "lost",
      lostReason: "price_too_high",
    });

    expect(result.success).toBe(true);
    expect(result.lead!.status).toBe("lost");
    expect(result.lead!.lostReason).toBe("price_too_high");

    // Cleanup
    await caller.leads.delete({ id: leadId });
  });

  it("rejects invalid status values", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leads.update({
        id: 1,
        status: "invalid_status" as any,
      })
    ).rejects.toThrow();
  });

  it("throws error for non-existent lead", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leads.update({
        id: 999999,
        name: "Should Fail",
      })
    ).rejects.toThrow("Lead not found");
  });
});

describe("leads.updateStatus", () => {
  it("updates status with new enum values", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const created = await caller.leads.create({
      name: "Enum Test",
      business: "Enum Cafe",
      email: `enum-test-${Date.now()}@test.com`,
      phone: "",
      message: "",
      source: "manual",
    });

    const leadId = created.lead!.id;

    // Test all new status values
    for (const status of ["contacted", "interested", "tasting_scheduled", "quote_sent", "negotiation", "won", "lost"] as const) {
      const result = await caller.leads.updateStatus({ id: leadId, status });
      expect(result.success).toBe(true);
    }

    // Cleanup
    await caller.leads.delete({ id: leadId });
  });
});
