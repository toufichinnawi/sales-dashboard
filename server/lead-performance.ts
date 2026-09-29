export const LEAD_PERFORMANCE_TIME_ZONE = "America/Toronto";

type DateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

type TimeRange = { start: Date; end: Date };

export type LeadPerformanceLead = {
  id: number;
  status: string;
  lastContactDate: Date | null;
  nextFollowUpDate: Date | null;
  followUpStatus: string | null;
  createdAt: Date;
};

export type LeadPerformanceActivity = {
  leadId: number;
  activityType: string;
  metadata: string | null;
  createdAt: Date;
};

export type LeadPerformanceTasting = {
  id: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export type LeadMetricComparison = {
  current: number;
  previous: number;
  difference: number;
  percentChange: number | null;
};

const OPEN_STATUSES = new Set([
  "new",
  "contacted",
  "interested",
  "tasting_scheduled",
  "quote_sent",
  "negotiation",
]);
const CONTACTED_STAGE_STATUSES = new Set(["contacted", "interested", "quote_sent", "negotiation"]);
const DIRECT_CONTACT_ACTIVITY_TYPES = new Set(["phone_call", "email_sent"]);

function partsInTimeZone(date: Date): DateParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: LEAD_PERFORMANCE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)])
  ) as Record<string, number>;
  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second,
  };
}

function torontoWallClockToUtc(parts: DateParts): Date {
  const desiredWallClockMs = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  let timestamp = desiredWallClockMs;
  for (let index = 0; index < 3; index += 1) {
    const observed = partsInTimeZone(new Date(timestamp));
    const observedWallClockMs = Date.UTC(
      observed.year,
      observed.month - 1,
      observed.day,
      observed.hour,
      observed.minute,
      observed.second
    );
    const adjustment = desiredWallClockMs - observedWallClockMs;
    if (adjustment === 0) break;
    timestamp += adjustment;
  }
  return new Date(timestamp);
}

function addDays(parts: DateParts, days: number): DateParts {
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
  };
}

function previousMonth(parts: DateParts): DateParts {
  return parts.month === 1
    ? { ...parts, year: parts.year - 1, month: 12 }
    : { ...parts, month: parts.month - 1 };
}

function inRange(date: Date | null, range: TimeRange): boolean {
  return !!date && date >= range.start && date < range.end;
}

function comparison(current: number, previous: number): LeadMetricComparison {
  const difference = current - previous;
  return {
    current,
    previous,
    difference,
    percentChange: previous === 0 ? null : Math.round(((difference / previous) * 100) * 10) / 10,
  };
}

function transition(activity: LeadPerformanceActivity): { from: string | null; to: string | null } {
  if (!activity.metadata) return { from: null, to: null };
  try {
    const parsed = JSON.parse(activity.metadata) as { from?: unknown; to?: unknown };
    return {
      from: typeof parsed.from === "string" ? parsed.from : null,
      to: typeof parsed.to === "string" ? parsed.to : null,
    };
  } catch {
    return { from: null, to: null };
  }
}

function uniqueLeadCount(values: Iterable<number>): number {
  return new Set(values).size;
}

function activityLeadIds(
  activities: LeadPerformanceActivity[],
  range: TimeRange,
  predicate: (activity: LeadPerformanceActivity, move: { from: string | null; to: string | null }) => boolean
): number[] {
  return activities
    .filter((activity) => inRange(activity.createdAt, range))
    .filter((activity) => predicate(activity, transition(activity)))
    .map((activity) => activity.leadId);
}

function contactedLeadIds(
  leads: LeadPerformanceLead[],
  activities: LeadPerformanceActivity[],
  range: TimeRange
): number[] {
  const ids = new Set<number>();
  leads.forEach((lead) => {
    if (inRange(lead.lastContactDate, range)) ids.add(lead.id);
  });
  activities.forEach((activity) => {
    if (!inRange(activity.createdAt, range)) return;
    const move = transition(activity);
    if (DIRECT_CONTACT_ACTIVITY_TYPES.has(activity.activityType) || move.to === "contacted") {
      ids.add(activity.leadId);
    }
  });
  return Array.from(ids);
}

function statusMoveCount(
  activities: LeadPerformanceActivity[],
  range: TimeRange,
  stageStatuses: Set<string>,
  direction: "entered" | "exited"
): number {
  const ids = activityLeadIds(activities, range, (_activity, move) => {
    const fromInside = !!move.from && stageStatuses.has(move.from);
    const toInside = !!move.to && stageStatuses.has(move.to);
    return direction === "entered" ? toInside && !fromInside : fromInside && !toInside;
  });
  return uniqueLeadCount(ids);
}

function uniqueActivityTypeCount(
  activities: LeadPerformanceActivity[],
  range: TimeRange,
  activityType: string
): number {
  return uniqueLeadCount(
    activities
      .filter((activity) => activity.activityType === activityType && inRange(activity.createdAt, range))
      .map((activity) => activity.leadId)
  );
}

function closeRate(won: number, lost: number): number | null {
  const decisions = won + lost;
  return decisions > 0 ? Math.round((won / decisions) * 1000) / 10 : null;
}

export function buildLeadPerformanceSnapshot(input: {
  now?: Date;
  leads: LeadPerformanceLead[];
  activities: LeadPerformanceActivity[];
  tastings: LeadPerformanceTasting[];
}) {
  const now = input.now ?? new Date();
  const localNow = partsInTimeZone(now);
  const todayStart = torontoWallClockToUtc({ ...localNow, hour: 0, minute: 0, second: 0 });
  const tomorrowStart = torontoWallClockToUtc({
    ...addDays({ ...localNow, hour: 0, minute: 0, second: 0 }, 1),
    hour: 0,
    minute: 0,
    second: 0,
  });
  const yesterdayStart = torontoWallClockToUtc({
    ...addDays({ ...localNow, hour: 0, minute: 0, second: 0 }, -1),
    hour: 0,
    minute: 0,
    second: 0,
  });
  const monthStart = torontoWallClockToUtc({
    year: localNow.year,
    month: localNow.month,
    day: 1,
    hour: 0,
    minute: 0,
    second: 0,
  });
  const previousLocal = previousMonth(localNow);
  const previousMonthStart = torontoWallClockToUtc({
    year: previousLocal.year,
    month: previousLocal.month,
    day: 1,
    hour: 0,
    minute: 0,
    second: 0,
  });

  const today = { start: todayStart, end: now };
  const dueToday = { start: todayStart, end: tomorrowStart };
  const yesterday = { start: yesterdayStart, end: todayStart };
  const thisMonth = { start: monthStart, end: now };
  const lastMonth = { start: previousMonthStart, end: monthStart };

  const newLeadCount = (range: TimeRange) => input.leads.filter((lead) => inRange(lead.createdAt, range)).length;
  const contactCount = (range: TimeRange) => uniqueLeadCount(contactedLeadIds(input.leads, input.activities, range));
  const wonCount = (range: TimeRange) => uniqueActivityTypeCount(input.activities, range, "marked_won");
  const lostCount = (range: TimeRange) => uniqueActivityTypeCount(input.activities, range, "marked_lost");
  const scheduledCount = (range: TimeRange) => statusMoveCount(
    input.activities,
    range,
    new Set(["tasting_scheduled"]),
    "entered"
  );

  const todayWon = wonCount(today);
  const todayLost = lostCount(today);
  const yesterdayWon = wonCount(yesterday);
  const yesterdayLost = lostCount(yesterday);
  const monthWon = wonCount(thisMonth);
  const monthLost = lostCount(thisMonth);
  const previousMonthWon = wonCount(lastMonth);
  const previousMonthLost = lostCount(lastMonth);

  const currentCounts = Object.fromEntries(
    ["new", "contacted", "interested", "tasting_scheduled", "quote_sent", "negotiation", "won", "lost"]
      .map((status) => [status, input.leads.filter((lead) => lead.status === status).length])
  ) as Record<string, number>;

  const conversionDurations = input.leads
    .filter((lead) => lead.status === "won")
    .map((lead) => {
      const firstWon = input.activities
        .filter((activity) => activity.leadId === lead.id && activity.activityType === "marked_won")
        .map((activity) => activity.createdAt.getTime())
        .filter((time) => time >= lead.createdAt.getTime())
        .sort((a, b) => a - b)[0];
      return firstWon === undefined ? null : (firstWon - lead.createdAt.getTime()) / 86_400_000;
    })
    .filter((value): value is number => value !== null);
  const conversionSampleSize = conversionDurations.length;
  const averageTimeToConversionDays = conversionSampleSize >= 3
    ? Math.round((conversionDurations.reduce((sum, value) => sum + value, 0) / conversionSampleSize) * 10) / 10
    : null;

  const openLeads = input.leads.filter((lead) => OPEN_STATUSES.has(lead.status));
  const completedTastingRequests = input.tastings.filter((request) => request.status === "completed").length;
  const currentConversionRate = input.leads.length > 0
    ? Math.round((currentCounts.won / input.leads.length) * 1000) / 10
    : 0;

  const stage = (
    key: string,
    label: string,
    statuses: Set<string> | null,
    current: number | null,
    enterOverride?: number
  ) => ({
    key,
    label,
    current,
    enteredThisMonth: statuses ? (enterOverride ?? statusMoveCount(input.activities, thisMonth, statuses, "entered")) : null,
    exitedThisMonth: statuses ? statusMoveCount(input.activities, thisMonth, statuses, "exited") : null,
  });

  return {
    snapshot: {
      totalLeads: input.leads.length,
      newLeads: currentCounts.new,
      contactedAwaitingResponse: currentCounts.contacted,
      tastingsScheduled: currentCounts.tasting_scheduled,
      completedTastingRequests,
      won: currentCounts.won,
      lost: currentCounts.lost,
      openLeads: openLeads.length,
      conversionRate: currentConversionRate,
      averageTimeToConversionDays,
      conversionSampleSize,
    },
    performance: {
      today: {
        newLeads: comparison(newLeadCount(today), newLeadCount(yesterday)),
        contacted: comparison(contactCount(today), contactCount(yesterday)),
        tastingScheduled: comparison(scheduledCount(today), scheduledCount(yesterday)),
        won: comparison(todayWon, yesterdayWon),
        lost: comparison(todayLost, yesterdayLost),
        decisionConversionRate: closeRate(todayWon, todayLost),
      },
      month: {
        newLeads: comparison(newLeadCount(thisMonth), newLeadCount(lastMonth)),
        contacted: comparison(contactCount(thisMonth), contactCount(lastMonth)),
        tastingScheduled: comparison(scheduledCount(thisMonth), scheduledCount(lastMonth)),
        won: comparison(monthWon, previousMonthWon),
        lost: comparison(monthLost, previousMonthLost),
        decisionConversionRate: {
          current: closeRate(monthWon, monthLost),
          previous: closeRate(previousMonthWon, previousMonthLost),
        },
      },
    },
    funnel: [
      stage("new", "New leads", new Set(["new"]), currentCounts.new, newLeadCount(thisMonth)),
      stage(
        "contacted",
        "Contacted + active",
        CONTACTED_STAGE_STATUSES,
        currentCounts.contacted + currentCounts.interested + currentCounts.quote_sent + currentCounts.negotiation
      ),
      stage("tasting_scheduled", "Tasting scheduled", new Set(["tasting_scheduled"]), currentCounts.tasting_scheduled),
      stage("tasting_completed", "Tasting completed", null, completedTastingRequests),
      stage("won", "Won", new Set(["won"]), currentCounts.won, monthWon),
      stage("lost", "Lost", new Set(["lost"]), currentCounts.lost, monthLost),
    ],
    salesActivity: {
      leadsContactedToday: contactCount(today),
      followUpsDueToday: openLeads.filter(
        (lead) => lead.followUpStatus === "pending" && inRange(lead.nextFollowUpDate, dueToday)
      ).length,
      overdueFollowUps: openLeads.filter(
        (lead) => lead.followUpStatus === "pending" && !!lead.nextFollowUpDate && lead.nextFollowUpDate < todayStart
      ).length,
      upcomingTastings: currentCounts.tasting_scheduled,
      tastingsCompletedThisMonth: null,
      leadsConvertedThisMonth: monthWon,
    },
    tracking: {
      activitiesAreHistorical: true,
      orphanActivitiesExcluded: true,
      tastingCompletionHistoryTracked: false,
      tastingCompletionNote: "Tasting requests have current status but no completion timestamp or lead relationship.",
      averageConversionSource: "Earliest marked_won activity for currently won leads.",
    },
  };
}
