import { describe, expect, it } from "vitest";
import { buildLeadPerformanceSnapshot } from "./lead-performance";

const at = (value: string) => new Date(value);

function snapshot() {
  return buildLeadPerformanceSnapshot({
    now: at("2026-09-15T16:30:00.000Z"), // 12:30 Toronto
    leads: [
      { id: 1, status: "new", lastContactDate: null, nextFollowUpDate: null, followUpStatus: "pending", createdAt: at("2026-09-15T13:00:00.000Z") },
      { id: 2, status: "contacted", lastContactDate: at("2026-09-15T14:00:00.000Z"), nextFollowUpDate: at("2026-09-15T18:00:00.000Z"), followUpStatus: "pending", createdAt: at("2026-08-20T12:00:00.000Z") },
      { id: 3, status: "interested", lastContactDate: null, nextFollowUpDate: at("2026-09-14T12:00:00.000Z"), followUpStatus: "pending", createdAt: at("2026-08-18T12:00:00.000Z") },
      { id: 4, status: "tasting_scheduled", lastContactDate: null, nextFollowUpDate: null, followUpStatus: "pending", createdAt: at("2026-08-10T12:00:00.000Z") },
      { id: 5, status: "won", lastContactDate: null, nextFollowUpDate: null, followUpStatus: "done", createdAt: at("2026-08-01T12:00:00.000Z") },
      { id: 6, status: "lost", lastContactDate: null, nextFollowUpDate: null, followUpStatus: "done", createdAt: at("2026-08-02T12:00:00.000Z") },
      { id: 7, status: "won", lastContactDate: null, nextFollowUpDate: null, followUpStatus: "done", createdAt: at("2026-08-25T12:00:00.000Z") },
      { id: 8, status: "won", lastContactDate: null, nextFollowUpDate: null, followUpStatus: "done", createdAt: at("2026-09-01T12:00:00.000Z") },
    ],
    activities: [
      { leadId: 2, activityType: "status_changed", metadata: JSON.stringify({ from: "new", to: "contacted" }), createdAt: at("2026-09-15T14:00:00.000Z") },
      { leadId: 4, activityType: "status_changed", metadata: JSON.stringify({ from: "interested", to: "tasting_scheduled" }), createdAt: at("2026-09-10T14:00:00.000Z") },
      { leadId: 5, activityType: "marked_won", metadata: JSON.stringify({ from: "negotiation", to: "won" }), createdAt: at("2026-09-10T12:00:00.000Z") },
      { leadId: 6, activityType: "marked_lost", metadata: JSON.stringify({ from: "contacted", to: "lost" }), createdAt: at("2026-08-20T12:00:00.000Z") },
      { leadId: 7, activityType: "marked_won", metadata: JSON.stringify({ from: "quote_sent", to: "won" }), createdAt: at("2026-09-05T12:00:00.000Z") },
      { leadId: 8, activityType: "marked_won", metadata: JSON.stringify({ from: "tasting_scheduled", to: "won" }), createdAt: at("2026-09-08T12:00:00.000Z") },
      { leadId: 3, activityType: "email_sent", metadata: null, createdAt: at("2026-08-12T12:00:00.000Z") },
    ],
    tastings: [
      { id: 1, status: "completed", createdAt: at("2026-08-01T12:00:00.000Z"), updatedAt: at("2026-09-03T12:00:00.000Z") },
    ],
  });
}

describe("buildLeadPerformanceSnapshot", () => {
  it("separates current pipeline snapshot from historical activity", () => {
    const result = snapshot();

    expect(result.snapshot).toMatchObject({
      totalLeads: 8,
      newLeads: 1,
      contactedAwaitingResponse: 1,
      tastingsScheduled: 1,
      completedTastingRequests: 1,
      won: 3,
      lost: 1,
      openLeads: 4,
      conversionRate: 37.5,
    });
    expect(result.performance.month.won.current).toBe(3);
    expect(result.performance.month.lost.current).toBe(0);
  });

  it("deduplicates contact signals from status history and last-contact timestamps", () => {
    const result = snapshot();

    expect(result.performance.today.contacted.current).toBe(1);
    expect(result.salesActivity.leadsContactedToday).toBe(1);
  });

  it("reports actual stage entries and exits from timestamped transition metadata", () => {
    const result = snapshot();
    const contacted = result.funnel.find((stage) => stage.key === "contacted");
    const tasting = result.funnel.find((stage) => stage.key === "tasting_scheduled");
    const won = result.funnel.find((stage) => stage.key === "won");

    expect(contacted).toMatchObject({ current: 2, enteredThisMonth: 1, exitedThisMonth: 3 });
    expect(tasting).toMatchObject({ current: 1, enteredThisMonth: 1, exitedThisMonth: 1 });
    expect(won).toMatchObject({ current: 3, enteredThisMonth: 3 });
  });

  it("uses follow-up dates for due and overdue counts", () => {
    const result = snapshot();

    expect(result.salesActivity.followUpsDueToday).toBe(1);
    expect(result.salesActivity.overdueFollowUps).toBe(1);
  });

  it("shows tasting completion history as untracked when only current status exists", () => {
    const result = snapshot();
    const completed = result.funnel.find((stage) => stage.key === "tasting_completed");

    expect(result.snapshot.completedTastingRequests).toBe(1);
    expect(result.salesActivity.tastingsCompletedThisMonth).toBeNull();
    expect(completed).toMatchObject({ current: 1, enteredThisMonth: null, exitedThisMonth: null });
    expect(result.tracking.tastingCompletionHistoryTracked).toBe(false);
  });

  it("calculates average time to conversion only with a sufficient marked-won sample", () => {
    const result = snapshot();

    expect(result.snapshot.conversionSampleSize).toBe(3);
    expect(result.snapshot.averageTimeToConversionDays).toBe(19.3);
  });
});
