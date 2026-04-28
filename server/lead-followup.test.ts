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

describe("follow-up control", () => {
  it("can set follow-up priority on a lead", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const created = await caller.leads.create({
      name: "Priority Test",
      business: "Priority Cafe",
      email: `priority-${Date.now()}@test.com`,
      phone: "",
      message: "",
      source: "manual",
    });

    const leadId = created.lead!.id;

    await caller.leads.update({
      id: leadId,
      followUpPriority: "high",
    });

    const lead = await caller.leads.getById({ id: leadId });
    expect(lead!.followUpPriority).toBe("high");

    // Cleanup
    await deleteLeadActivities(leadId);
    await caller.leads.delete({ id: leadId });
  });

  it("can set follow-up note on a lead", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const created = await caller.leads.create({
      name: "FollowUp Note Test",
      business: "FollowUp Note Cafe",
      email: `fu-note-${Date.now()}@test.com`,
      phone: "",
      message: "",
      source: "manual",
    });

    const leadId = created.lead!.id;

    await caller.leads.update({
      id: leadId,
      followUpNote: "Call about pricing",
    });

    const lead = await caller.leads.getById({ id: leadId });
    expect(lead!.followUpNote).toBe("Call about pricing");

    // Cleanup
    await deleteLeadActivities(leadId);
    await caller.leads.delete({ id: leadId });
  });

  it("can set follow-up status to done", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const created = await caller.leads.create({
      name: "FollowUp Done Test",
      business: "FollowUp Done Cafe",
      email: `fu-done-${Date.now()}@test.com`,
      phone: "",
      message: "",
      source: "manual",
    });

    const leadId = created.lead!.id;

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);

    await caller.leads.update({
      id: leadId,
      nextFollowUpDate: futureDate,
      followUpStatus: "pending",
    });

    let lead = await caller.leads.getById({ id: leadId });
    expect(lead!.followUpStatus).toBe("pending");

    // Mark as done
    await caller.leads.update({
      id: leadId,
      followUpStatus: "done",
    });

    lead = await caller.leads.getById({ id: leadId });
    expect(lead!.followUpStatus).toBe("done");

    // Cleanup
    await deleteLeadActivities(leadId);
    await caller.leads.delete({ id: leadId });
  });

  it("can clear follow-up fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const created = await caller.leads.create({
      name: "Clear FollowUp Test",
      business: "Clear FollowUp Cafe",
      email: `fu-clear-${Date.now()}@test.com`,
      phone: "",
      message: "",
      source: "manual",
    });

    const leadId = created.lead!.id;

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);

    // Set follow-up
    await caller.leads.update({
      id: leadId,
      nextFollowUpDate: futureDate,
      followUpPriority: "urgent",
      followUpNote: "Important meeting",
      followUpStatus: "pending",
    });

    let lead = await caller.leads.getById({ id: leadId });
    expect(lead!.followUpPriority).toBe("urgent");

    // Clear follow-up
    await caller.leads.update({
      id: leadId,
      nextFollowUpDate: null,
      followUpPriority: null,
      followUpNote: null,
      followUpStatus: null,
    });

    lead = await caller.leads.getById({ id: leadId });
    expect(lead!.nextFollowUpDate).toBeNull();
    expect(lead!.followUpPriority).toBeNull();
    expect(lead!.followUpNote).toBeNull();

    // Cleanup
    await deleteLeadActivities(leadId);
    await caller.leads.delete({ id: leadId });
  });

  it("creates activity when follow-up status changes to done", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const created = await caller.leads.create({
      name: "FollowUp Activity Test",
      business: "FollowUp Activity Cafe",
      email: `fu-activity-${Date.now()}@test.com`,
      phone: "",
      message: "",
      source: "manual",
    });

    const leadId = created.lead!.id;
    await deleteLeadActivities(leadId);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);

    await caller.leads.update({
      id: leadId,
      nextFollowUpDate: futureDate,
      followUpStatus: "pending",
    });

    await deleteLeadActivities(leadId);

    // Mark as done
    await caller.leads.update({
      id: leadId,
      followUpStatus: "done",
    });

    const activities = await caller.leads.getActivities({ leadId });
    const doneActivity = activities.find(
      (a) => a.activityType === "follow_up_scheduled" && a.note?.includes("done")
    );
    expect(doneActivity).toBeDefined();

    // Cleanup
    await deleteLeadActivities(leadId);
    await caller.leads.delete({ id: leadId });
  });

  it("reschedule sets new date, priority, note, and resets status to pending", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const created = await caller.leads.create({
      name: "Reschedule Test",
      business: "Reschedule Cafe",
      email: `fu-reschedule-${Date.now()}@test.com`,
      phone: "",
      message: "",
      source: "manual",
    });

    const leadId = created.lead!.id;

    const newDate = new Date();
    newDate.setDate(newDate.getDate() + 10);

    await caller.leads.update({
      id: leadId,
      nextFollowUpDate: newDate,
      followUpPriority: "high",
      followUpNote: "Rescheduled meeting",
      followUpStatus: "pending",
    });

    const lead = await caller.leads.getById({ id: leadId });
    expect(lead!.followUpPriority).toBe("high");
    expect(lead!.followUpNote).toBe("Rescheduled meeting");
    expect(lead!.followUpStatus).toBe("pending");
    expect(lead!.nextFollowUpDate).toBeDefined();

    // Cleanup
    await deleteLeadActivities(leadId);
    await caller.leads.delete({ id: leadId });
  });
});
