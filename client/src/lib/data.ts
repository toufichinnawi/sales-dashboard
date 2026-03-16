/**
 * Mock CRM Data Layer — Sales Analytics Dashboard
 * Realistic data for demonstration; in production this would connect to a CRM API
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Deal {
  id: string;
  company: string;
  contact: string;
  value: number;
  stage: "lead" | "qualified" | "proposal" | "negotiation" | "closed_won" | "closed_lost";
  probability: number;
  expectedClose: string;
  owner: string;
  lastActivity: string;
  source: string;
  industry: string;
}

export interface SalesRep {
  id: string;
  name: string;
  avatar: string;
  role: string;
  quota: number;
  closed: number;
  pipeline: number;
  deals: number;
  winRate: number;
  avgDealSize: number;
}

export interface Activity {
  id: string;
  type: "call" | "email" | "meeting" | "note" | "deal_won" | "deal_lost";
  description: string;
  contact: string;
  company: string;
  timestamp: string;
  rep: string;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  target: number;
  deals: number;
}

export interface PipelineStage {
  stage: string;
  count: number;
  value: number;
  avgDays: number;
  conversionRate: number;
}

export interface LeadSource {
  source: string;
  leads: number;
  converted: number;
  revenue: number;
  conversionRate: number;
}

// ─── KPI Data ────────────────────────────────────────────────────────────────

export const kpiData = {
  totalRevenue: 2847356.42,
  revenueChange: 12.4,
  monthlyRecurring: 487250.00,
  mrrChange: 8.7,
  totalDeals: 342,
  dealsChange: -3.2,
  avgDealSize: 34218.75,
  avgDealChange: 15.6,
  winRate: 32.8,
  winRateChange: 2.1,
  pipelineValue: 8456230.00,
  pipelineChange: 18.3,
  avgSalesCycle: 47,
  cycleChange: -5.2,
  customerAcquisitionCost: 4250.00,
  cacChange: -8.1,
};

// ─── Monthly Revenue ─────────────────────────────────────────────────────────

export const monthlyRevenue: MonthlyRevenue[] = [
  { month: "Apr 2025", revenue: 198450.00, target: 220000, deals: 24 },
  { month: "May 2025", revenue: 215680.00, target: 220000, deals: 27 },
  { month: "Jun 2025", revenue: 242310.00, target: 230000, deals: 31 },
  { month: "Jul 2025", revenue: 228940.00, target: 240000, deals: 28 },
  { month: "Aug 2025", revenue: 256780.00, target: 240000, deals: 33 },
  { month: "Sep 2025", revenue: 271450.00, target: 250000, deals: 35 },
  { month: "Oct 2025", revenue: 245620.00, target: 260000, deals: 29 },
  { month: "Nov 2025", revenue: 289340.00, target: 260000, deals: 37 },
  { month: "Dec 2025", revenue: 312560.00, target: 280000, deals: 42 },
  { month: "Jan 2026", revenue: 278430.00, target: 280000, deals: 34 },
  { month: "Feb 2026", revenue: 295680.00, target: 290000, deals: 38 },
  { month: "Mar 2026", revenue: 312116.42, target: 300000, deals: 41 },
];

// ─── Pipeline Stages ─────────────────────────────────────────────────────────

export const pipelineStages: PipelineStage[] = [
  { stage: "Lead", count: 156, value: 2340000, avgDays: 0, conversionRate: 100 },
  { stage: "Qualified", count: 89, value: 1780000, avgDays: 12, conversionRate: 57.1 },
  { stage: "Proposal", count: 52, value: 1560000, avgDays: 28, conversionRate: 58.4 },
  { stage: "Negotiation", count: 28, value: 1120000, avgDays: 38, conversionRate: 53.8 },
  { stage: "Closed Won", count: 17, value: 680000, avgDays: 47, conversionRate: 60.7 },
];

// ─── Lead Sources ────────────────────────────────────────────────────────────

export const leadSources: LeadSource[] = [
  { source: "Organic Search", leads: 245, converted: 78, revenue: 892450.00, conversionRate: 31.8 },
  { source: "Paid Ads", leads: 189, converted: 45, revenue: 534280.00, conversionRate: 23.8 },
  { source: "Referral", leads: 134, converted: 62, revenue: 756320.00, conversionRate: 46.3 },
  { source: "Social Media", leads: 98, converted: 21, revenue: 245680.00, conversionRate: 21.4 },
  { source: "Email Campaign", leads: 167, converted: 48, revenue: 412560.00, conversionRate: 28.7 },
  { source: "Events", leads: 56, converted: 24, revenue: 356240.00, conversionRate: 42.9 },
  { source: "Partner", leads: 72, converted: 31, revenue: 428340.00, conversionRate: 43.1 },
  { source: "Direct", leads: 41, converted: 15, revenue: 221486.42, conversionRate: 36.6 },
];

// ─── Sales Reps ──────────────────────────────────────────────────────────────

export const salesReps: SalesRep[] = [
  {
    id: "rep-1", name: "Sarah Chen", avatar: "SC", role: "Senior AE",
    quota: 450000, closed: 412350.00, pipeline: 856200, deals: 48,
    winRate: 38.2, avgDealSize: 42150.00,
  },
  {
    id: "rep-2", name: "Marcus Johnson", avatar: "MJ", role: "Account Executive",
    quota: 380000, closed: 356780.00, pipeline: 724500, deals: 42,
    winRate: 35.6, avgDealSize: 38240.00,
  },
  {
    id: "rep-3", name: "Elena Rodriguez", avatar: "ER", role: "Senior AE",
    quota: 450000, closed: 478920.00, pipeline: 912300, deals: 52,
    winRate: 41.3, avgDealSize: 45680.00,
  },
  {
    id: "rep-4", name: "David Kim", avatar: "DK", role: "Account Executive",
    quota: 350000, closed: 298450.00, pipeline: 645800, deals: 38,
    winRate: 29.4, avgDealSize: 31250.00,
  },
  {
    id: "rep-5", name: "Amara Obi", avatar: "AO", role: "Senior AE",
    quota: 420000, closed: 445230.00, pipeline: 878400, deals: 46,
    winRate: 36.8, avgDealSize: 40560.00,
  },
  {
    id: "rep-6", name: "James Wright", avatar: "JW", role: "Account Executive",
    quota: 380000, closed: 342680.00, pipeline: 698200, deals: 40,
    winRate: 33.2, avgDealSize: 35780.00,
  },
  {
    id: "rep-7", name: "Priya Patel", avatar: "PP", role: "BDR Lead",
    quota: 320000, closed: 312450.00, pipeline: 567800, deals: 36,
    winRate: 31.5, avgDealSize: 28450.00,
  },
  {
    id: "rep-8", name: "Tom Sullivan", avatar: "TS", role: "Account Executive",
    quota: 350000, closed: 200496.42, pipeline: 534200, deals: 34,
    winRate: 27.8, avgDealSize: 26340.00,
  },
];

// ─── Deals ───────────────────────────────────────────────────────────────────

export const deals: Deal[] = [
  {
    id: "D-1042", company: "TechVista Solutions", contact: "Michael Torres",
    value: 125000, stage: "negotiation", probability: 75,
    expectedClose: "2026-03-28", owner: "Elena Rodriguez",
    lastActivity: "2026-03-14", source: "Referral", industry: "Technology",
  },
  {
    id: "D-1041", company: "Meridian Healthcare", contact: "Dr. Lisa Wang",
    value: 89500, stage: "proposal", probability: 60,
    expectedClose: "2026-04-10", owner: "Sarah Chen",
    lastActivity: "2026-03-13", source: "Events", industry: "Healthcare",
  },
  {
    id: "D-1040", company: "Atlas Manufacturing", contact: "Robert Kline",
    value: 210000, stage: "qualified", probability: 40,
    expectedClose: "2026-05-15", owner: "Marcus Johnson",
    lastActivity: "2026-03-12", source: "Organic Search", industry: "Manufacturing",
  },
  {
    id: "D-1039", company: "Pinnacle Financial", contact: "Jennifer Hayes",
    value: 156000, stage: "negotiation", probability: 80,
    expectedClose: "2026-03-22", owner: "Amara Obi",
    lastActivity: "2026-03-15", source: "Partner", industry: "Finance",
  },
  {
    id: "D-1038", company: "GreenLeaf Energy", contact: "Thomas Park",
    value: 78000, stage: "proposal", probability: 55,
    expectedClose: "2026-04-05", owner: "David Kim",
    lastActivity: "2026-03-11", source: "Paid Ads", industry: "Energy",
  },
  {
    id: "D-1037", company: "Horizon Education", contact: "Amanda Foster",
    value: 45000, stage: "lead", probability: 20,
    expectedClose: "2026-06-01", owner: "James Wright",
    lastActivity: "2026-03-10", source: "Email Campaign", industry: "Education",
  },
  {
    id: "D-1036", company: "Nexus Logistics", contact: "Carlos Mendez",
    value: 192000, stage: "closed_won", probability: 100,
    expectedClose: "2026-03-08", owner: "Elena Rodriguez",
    lastActivity: "2026-03-08", source: "Referral", industry: "Logistics",
  },
  {
    id: "D-1035", company: "Quantum Analytics", contact: "Aisha Patel",
    value: 134500, stage: "negotiation", probability: 70,
    expectedClose: "2026-03-25", owner: "Sarah Chen",
    lastActivity: "2026-03-14", source: "Organic Search", industry: "Technology",
  },
  {
    id: "D-1034", company: "Summit Retail Group", contact: "Brian O'Connor",
    value: 67800, stage: "qualified", probability: 35,
    expectedClose: "2026-04-20", owner: "Priya Patel",
    lastActivity: "2026-03-09", source: "Social Media", industry: "Retail",
  },
  {
    id: "D-1033", company: "Coastal Properties", contact: "Diana Reeves",
    value: 245000, stage: "proposal", probability: 50,
    expectedClose: "2026-04-15", owner: "Marcus Johnson",
    lastActivity: "2026-03-13", source: "Direct", industry: "Real Estate",
  },
  {
    id: "D-1032", company: "Velocity Sports", contact: "Nathan Brooks",
    value: 52000, stage: "closed_lost", probability: 0,
    expectedClose: "2026-03-05", owner: "Tom Sullivan",
    lastActivity: "2026-03-05", source: "Paid Ads", industry: "Sports",
  },
  {
    id: "D-1031", company: "Apex Consulting", contact: "Maria Gonzalez",
    value: 178000, stage: "closed_won", probability: 100,
    expectedClose: "2026-03-01", owner: "Amara Obi",
    lastActivity: "2026-03-01", source: "Referral", industry: "Consulting",
  },
  {
    id: "D-1030", company: "Bright Media Co.", contact: "Kevin Zhang",
    value: 93500, stage: "lead", probability: 15,
    expectedClose: "2026-06-15", owner: "David Kim",
    lastActivity: "2026-03-08", source: "Social Media", industry: "Media",
  },
  {
    id: "D-1029", company: "Sterling Insurance", contact: "Patricia Moore",
    value: 167000, stage: "qualified", probability: 45,
    expectedClose: "2026-05-01", owner: "James Wright",
    lastActivity: "2026-03-11", source: "Email Campaign", industry: "Insurance",
  },
  {
    id: "D-1028", company: "Nova Pharmaceuticals", contact: "Dr. Alan Richards",
    value: 312000, stage: "proposal", probability: 65,
    expectedClose: "2026-04-08", owner: "Elena Rodriguez",
    lastActivity: "2026-03-14", source: "Events", industry: "Pharmaceuticals",
  },
];

// ─── Activities ──────────────────────────────────────────────────────────────

export const recentActivities: Activity[] = [
  {
    id: "a-1", type: "deal_won", description: "Closed deal with Nexus Logistics — $192,000",
    contact: "Carlos Mendez", company: "Nexus Logistics",
    timestamp: "2026-03-15T14:32:00", rep: "Elena Rodriguez",
  },
  {
    id: "a-2", type: "meeting", description: "Product demo with Pinnacle Financial team",
    contact: "Jennifer Hayes", company: "Pinnacle Financial",
    timestamp: "2026-03-15T11:00:00", rep: "Amara Obi",
  },
  {
    id: "a-3", type: "email", description: "Sent revised proposal to Nova Pharmaceuticals",
    contact: "Dr. Alan Richards", company: "Nova Pharmaceuticals",
    timestamp: "2026-03-15T09:45:00", rep: "Elena Rodriguez",
  },
  {
    id: "a-4", type: "call", description: "Discovery call with Bright Media Co.",
    contact: "Kevin Zhang", company: "Bright Media Co.",
    timestamp: "2026-03-14T16:20:00", rep: "David Kim",
  },
  {
    id: "a-5", type: "note", description: "Updated contact info for Sterling Insurance",
    contact: "Patricia Moore", company: "Sterling Insurance",
    timestamp: "2026-03-14T14:15:00", rep: "James Wright",
  },
  {
    id: "a-6", type: "meeting", description: "Quarterly review with TechVista Solutions",
    contact: "Michael Torres", company: "TechVista Solutions",
    timestamp: "2026-03-14T10:00:00", rep: "Elena Rodriguez",
  },
  {
    id: "a-7", type: "deal_lost", description: "Lost deal with Velocity Sports — $52,000",
    contact: "Nathan Brooks", company: "Velocity Sports",
    timestamp: "2026-03-13T15:30:00", rep: "Tom Sullivan",
  },
  {
    id: "a-8", type: "email", description: "Follow-up email to Coastal Properties",
    contact: "Diana Reeves", company: "Coastal Properties",
    timestamp: "2026-03-13T11:45:00", rep: "Marcus Johnson",
  },
  {
    id: "a-9", type: "call", description: "Negotiation call with Quantum Analytics",
    contact: "Aisha Patel", company: "Quantum Analytics",
    timestamp: "2026-03-13T09:30:00", rep: "Sarah Chen",
  },
  {
    id: "a-10", type: "meeting", description: "Onboarding kickoff with Apex Consulting",
    contact: "Maria Gonzalez", company: "Apex Consulting",
    timestamp: "2026-03-12T14:00:00", rep: "Amara Obi",
  },
];

// ─── Weekly performance data ─────────────────────────────────────────────────

export const weeklyPerformance = [
  { day: "Mon", calls: 45, emails: 128, meetings: 12, proposals: 5 },
  { day: "Tue", calls: 52, emails: 142, meetings: 15, proposals: 7 },
  { day: "Wed", calls: 48, emails: 135, meetings: 18, proposals: 4 },
  { day: "Thu", calls: 56, emails: 151, meetings: 14, proposals: 8 },
  { day: "Fri", calls: 38, emails: 112, meetings: 10, proposals: 6 },
];

// ─── Industry breakdown ──────────────────────────────────────────────────────

export const industryBreakdown = [
  { industry: "Technology", revenue: 892450, deals: 48, percentage: 31.3 },
  { industry: "Healthcare", revenue: 534280, deals: 32, percentage: 18.8 },
  { industry: "Finance", revenue: 456320, deals: 28, percentage: 16.0 },
  { industry: "Manufacturing", revenue: 312560, deals: 22, percentage: 11.0 },
  { industry: "Retail", revenue: 245680, deals: 18, percentage: 8.6 },
  { industry: "Other", revenue: 406066.42, deals: 34, percentage: 14.3 },
];

// ─── Quarterly comparison ────────────────────────────────────────────────────

export const quarterlyComparison = [
  { quarter: "Q1 2025", revenue: 656440, target: 670000, growth: 8.2 },
  { quarter: "Q2 2025", revenue: 728170, target: 690000, growth: 10.9 },
  { quarter: "Q3 2025", revenue: 806610, target: 750000, growth: 10.8 },
  { quarter: "Q4 2025", revenue: 847520, target: 800000, growth: 5.1 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function getStageColor(stage: Deal["stage"]): string {
  const colors: Record<Deal["stage"], string> = {
    lead: "bg-slate-100 text-slate-700",
    qualified: "bg-sky-50 text-sky-700",
    proposal: "bg-amber-50 text-amber-700",
    negotiation: "bg-teal-50 text-teal-700",
    closed_won: "bg-emerald-50 text-emerald-700",
    closed_lost: "bg-red-50 text-red-700",
  };
  return colors[stage];
}

export function getStageLabel(stage: Deal["stage"]): string {
  const labels: Record<Deal["stage"], string> = {
    lead: "Lead",
    qualified: "Qualified",
    proposal: "Proposal",
    negotiation: "Negotiation",
    closed_won: "Closed Won",
    closed_lost: "Closed Lost",
  };
  return labels[stage];
}

export function getActivityIcon(type: Activity["type"]): string {
  const icons: Record<Activity["type"], string> = {
    call: "phone",
    email: "mail",
    meeting: "calendar",
    note: "file-text",
    deal_won: "trophy",
    deal_lost: "x-circle",
  };
  return icons[type];
}

export function getActivityColor(type: Activity["type"]): string {
  const colors: Record<Activity["type"], string> = {
    call: "text-sky-600",
    email: "text-slate-600",
    meeting: "text-violet-600",
    note: "text-slate-500",
    deal_won: "text-emerald-600",
    deal_lost: "text-red-500",
  };
  return colors[type];
}

export function timeAgo(timestamp: string): string {
  const now = new Date("2026-03-15T16:00:00");
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}
