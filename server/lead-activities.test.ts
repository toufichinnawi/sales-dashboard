import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { deleteLeadActivities } from "./db";

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

describe("leads.getActivities", () => {
  it("returns empty array for lead with no activities", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const created = await caller.leads.create({
      name: "Activity Test",
      business: "Activity Cafe",
      email: `activity-empty-${Date.now()}@test.com`,
      phone: "",
      message: "",
      source: "manual",
    });

    const leadId = created.lead!.id;

    // Clean up any auto-created activities from brochure email
    await deleteLeadActivities(leadId);

    const activities = await caller.leads.getActivities({ leadId });
    expect(Array.isArray(activities)).toBe(true);
    expect(activities.length).toBe(0);

    // Cleanup
    await caller.leads.delete({ id: leadId });
  });

  it("returns activities after manual add", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const created = await caller.leads.create({
      name: "Activity Manual Test",
      business: "Activity Manual Cafe",
      email: `activity-manual-${Date.now()}@test.com`,
      phone: "",
      message: "",
      source: "manual",
    });

    const leadId = created.lead!.id;

    // Clean up any auto-created activities
    await deleteLeadActivities(leadId);

    // Add a manual activity
    const result = await caller.leads.addActivity({
      leadId,
      activityType: "phone_call",
      note: "Called to discuss wholesale pricing",
    });

    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();

    // Fetch activities
    const activities = await caller.leads.getActivities({ leadId });
    expect(activities.length).toBe(1);
    expect(activities[0].activityType).toBe("phone_call");
    expect(activities[0].note).toBe("Called to discuss wholesale pricing");
    expect(activities[0].userName).toBe("Test Owner");
    expect(activities[0].userId).toBe(1);

    // Cleanup
    await deleteLeadActivities(leadId);
    await caller.leads.delete({ id: leadId });
  });
});

describe("leads.addActivity", () => {
  it("creates activity with all fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const created = await caller.leads.create({
      name: "Full Activity Test",
      business: "Full Activity Cafe",
      email: `activity-full-${Date.now()}@test.com`,
      phone: "",
      message: "",
      source: "manual",
    });

    const leadId = created.lead!.id;
    await deleteLeadActivities(leadId);

    const result = await caller.leads.addActivity({
      leadId,
      activityType: "email_sent",
      note: "Sent pricing sheet",
      metadata: JSON.stringify({ template: "pricing" }),
    });

    expect(result.success).toBe(true);

    const activities = await caller.leads.getActivities({ leadId });
    expect(activities.length).toBe(1);
    expect(activities[0].activityType).toBe("email_sent");
    expect(activities[0].note).toBe("Sent pricing sheet");
    expect(activities[0].metadata).toBe(JSON.stringify({ template: "pricing" }));

    // Cleanup
    await deleteLeadActivities(leadId);
    await caller.leads.delete({ id: leadId });
  });

  it("rejects invalid activity type", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.leads.addActivity({
        leadId: 1,
        activityType: "invalid_type" as any,
        note: "Should fail",
      })
    ).rejects.toThrow();
  });

  it("allows null note", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const created = await caller.leads.create({
      name: "Null Note Test",
      business: "Null Note Cafe",
      email: `activity-null-${Date.now()}@test.com`,
      phone: "",
      message: "",
      source: "manual",
    });

    const leadId = created.lead!.id;
    await deleteLeadActivities(leadId);

    const result = await caller.leads.addActivity({
      leadId,
      activityType: "tasting_scheduled",
      note: null,
    });

    expect(result.success).toBe(true);

    const activities = await caller.leads.getActivities({ leadId });
    expect(activities.length).toBe(1);
    expect(activities[0].note).toBeNull();

    // Cleanup
    await deleteLeadActivities(leadId);
    await caller.leads.delete({ id: leadId });
  });
});

describe("auto-activity creation", () => {
  it("creates status_changed activity on leads.update status change", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const created = await caller.leads.create({
      name: "Auto Activity Test",
      business: "Auto Activity Cafe",
      email: `auto-activity-${Date.now()}@test.com`,
      phone: "",
      message: "",
      source: "manual",
    });

    const leadId = created.lead!.id;
    await deleteLeadActivities(leadId);

    // Change status
    await caller.leads.update({ id: leadId, status: "contacted" });

    const activities = await caller.leads.getActivities({ leadId });
    expect(activities.length).toBeGreaterThanOrEqual(1);

    const statusActivity = activities.find((a) => a.activityType === "status_changed");
    expect(statusActivity).toBeDefined();
    expect(statusActivity!.note).toContain("new");
    expect(statusActivity!.note).toContain("contacted");

    // Cleanup
    await deleteLeadActivities(leadId);
    await caller.leads.delete({ id: leadId });
  });

  it("creates marked_won activity when status set to won", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const created = await caller.leads.create({
      name: "Won Activity Test",
      business: "Won Activity Cafe",
      email: `won-activity-${Date.now()}@test.com`,
      phone: "",
      message: "",
      source: "manual",
    });

    const leadId = created.lead!.id;
    await deleteLeadActivities(leadId);

    await caller.leads.update({ id: leadId, status: "won" });

    const activities = await caller.leads.getActivities({ leadId });
    const wonActivity = activities.find((a) => a.activityType === "marked_won");
    expect(wonActivity).toBeDefined();
    expect(wonActivity!.note).toContain("won");

    // Cleanup
    await deleteLeadActivities(leadId);
    await caller.leads.delete({ id: leadId });
  });

  it("creates marked_lost activity when status set to lost", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const created = await caller.leads.create({
      name: "Lost Activity Test",
      business: "Lost Activity Cafe",
      email: `lost-activity-${Date.now()}@test.com`,
      phone: "",
      message: "",
      source: "manual",
    });

    const leadId = created.lead!.id;
    await deleteLeadActivities(leadId);

    await caller.leads.update({ id: leadId, status: "lost" });

    const activities = await caller.leads.getActivities({ leadId });
    const lostActivity = activities.find((a) => a.activityType === "marked_lost");
    expect(lostActivity).toBeDefined();
    expect(lostActivity!.note).toContain("lost");

    // Cleanup
    await deleteLeadActivities(leadId);
    await caller.leads.delete({ id: leadId });
  });

  it("creates note_added activity when notes change", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const created = await caller.leads.create({
      name: "Note Activity Test",
      business: "Note Activity Cafe",
      email: `note-activity-${Date.now()}@test.com`,
      phone: "",
      message: "",
      source: "manual",
    });

    const leadId = created.lead!.id;
    await deleteLeadActivities(leadId);

    await caller.leads.update({ id: leadId, notes: "Interested in plain and sesame bagels" });

    const activities = await caller.leads.getActivities({ leadId });
    const noteActivity = activities.find((a) => a.activityType === "note_added");
    expect(noteActivity).toBeDefined();
    expect(noteActivity!.note).toContain("Interested in plain and sesame bagels");

    // Cleanup
    await deleteLeadActivities(leadId);
    await caller.leads.delete({ id: leadId });
  });

  it("creates follow_up_scheduled activity when follow-up date changes", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const created = await caller.leads.create({
      name: "Follow-up Activity Test",
      business: "Follow-up Activity Cafe",
      email: `followup-activity-${Date.now()}@test.com`,
      phone: "",
      message: "",
      source: "manual",
    });

    const leadId = created.lead!.id;
    await deleteLeadActivities(leadId);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    await caller.leads.update({ id: leadId, nextFollowUpDate: futureDate });

    const activities = await caller.leads.getActivities({ leadId });
    const followUpActivity = activities.find((a) => a.activityType === "follow_up_scheduled");
    expect(followUpActivity).toBeDefined();
    expect(followUpActivity!.note).toContain("Follow-up scheduled");

    // Cleanup
    await deleteLeadActivities(leadId);
    await caller.leads.delete({ id: leadId });
  });

  it("creates status activity via updateStatus procedure", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const created = await caller.leads.create({
      name: "UpdateStatus Activity Test",
      business: "UpdateStatus Cafe",
      email: `updatestatus-activity-${Date.now()}@test.com`,
      phone: "",
      message: "",
      source: "manual",
    });

    const leadId = created.lead!.id;
    await deleteLeadActivities(leadId);

    await caller.leads.updateStatus({ id: leadId, status: "interested" });

    const activities = await caller.leads.getActivities({ leadId });
    expect(activities.length).toBeGreaterThanOrEqual(1);
    const statusActivity = activities.find((a) => a.activityType === "status_changed");
    expect(statusActivity).toBeDefined();
    expect(statusActivity!.note).toContain("interested");

    // Cleanup
    await deleteLeadActivities(leadId);
    await caller.leads.delete({ id: leadId });
  });
});
