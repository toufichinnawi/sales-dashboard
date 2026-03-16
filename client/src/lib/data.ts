/**
 * Hinnawi Bros Bagels — Wholesale CRM Data Layer
 * Montreal-based artisan bagel wholesale business
 * Products: Plain, Sesame, Everything
 * Pricing: $8.00–$9.00/dozen with volume discounts
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Deal {
  id: string;
  company: string;
  contact: string;
  value: number; // monthly value in $
  dozenPerWeek: number;
  stage: "lead" | "sample_request" | "tasting" | "negotiation" | "signed" | "lost";
  probability: number;
  expectedClose: string;
  owner: string;
  lastActivity: string;
  source: string;
  segment: string; // customer segment
  products: string[]; // which bagels they order
  region: string;
}

export interface SalesRep {
  id: string;
  name: string;
  avatar: string;
  role: string;
  quota: number; // monthly quota in $
  closed: number; // monthly closed in $
  pipeline: number;
  deals: number;
  winRate: number;
  avgDealSize: number;
  accountsWon: number;
}

export interface Activity {
  id: string;
  type: "call" | "email" | "meeting" | "note" | "deal_won" | "deal_lost" | "sample_sent" | "tasting";
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
  dozensDelivered: number;
}

export interface Product {
  name: string;
  pricePerDozen: number;
  unitCost: number;
  weeklyDozens: number;
  monthlyRevenue: number;
  sharePercent: number;
}

// ─── Products ────────────────────────────────────────────────────────────────

export const products: Product[] = [
  {
    name: "Plain",
    pricePerDozen: 8.00,
    unitCost: 0.67,
    weeklyDozens: 185,
    monthlyRevenue: 6440.00,
    sharePercent: 40,
  },
  {
    name: "Sesame",
    pricePerDozen: 8.50,
    unitCost: 0.71,
    weeklyDozens: 130,
    monthlyRevenue: 4810.00,
    sharePercent: 30,
  },
  {
    name: "Everything",
    pricePerDozen: 9.00,
    unitCost: 0.75,
    weeklyDozens: 120,
    monthlyRevenue: 4680.00,
    sharePercent: 30,
  },
];

// ─── Volume Pricing Tiers ────────────────────────────────────────────────────

export const pricingTiers = [
  { tier: "Starter", range: "5–10 dz/week", discount: "0%", note: "Standard pricing" },
  { tier: "Growth", range: "11–25 dz/week", discount: "5%", note: "Most cafes & restaurants" },
  { tier: "Volume", range: "26–50 dz/week", discount: "10%", note: "Hotels & grocery stores" },
  { tier: "Enterprise", range: "50+ dz/week", discount: "15%", note: "Catering & universities" },
];

// ─── KPI Data ────────────────────────────────────────────────────────────────

export const kpiData = {
  monthlyRevenue: 15930.00,
  revenueChange: 22.4,
  weeklyDozens: 435,
  dozensChange: 18.6,
  activeAccounts: 28,
  accountsChange: 16.7,
  avgOrderSize: 142.50,
  avgOrderChange: 8.3,
  pipelineValue: 8450.00,
  pipelineChange: 31.2,
  conversionRate: 38.5,
  conversionChange: 4.2,
};

// ─── Pipeline Stages ─────────────────────────────────────────────────────────

export const pipelineStages = [
  { stage: "Lead", count: 18, value: 2850.00 },
  { stage: "Sample Request", count: 12, value: 2100.00 },
  { stage: "Tasting", count: 8, value: 1680.00 },
  { stage: "Negotiation", count: 5, value: 1120.00 },
  { stage: "Signed", count: 28, value: 15930.00 },
];

// ─── Customer Segments ───────────────────────────────────────────────────────

export const customerSegments = [
  { segment: "Restaurants", accounts: 8, revenue: 4890.00, dozensPerWeek: 120, share: 30.7 },
  { segment: "Cafes", accounts: 7, revenue: 3980.00, dozensPerWeek: 95, share: 25.0 },
  { segment: "Hotels", accounts: 3, revenue: 2650.00, dozensPerWeek: 68, share: 16.6 },
  { segment: "Grocery Stores", accounts: 4, revenue: 1980.00, dozensPerWeek: 55, share: 12.4 },
  { segment: "Catering", accounts: 3, revenue: 1350.00, dozensPerWeek: 48, share: 8.5 },
  { segment: "Corporate", accounts: 2, revenue: 680.00, dozensPerWeek: 30, share: 4.3 },
  { segment: "Universities", accounts: 1, revenue: 400.00, dozensPerWeek: 19, share: 2.5 },
];

// ─── Lead Sources ────────────────────────────────────────────────────────────

export const leadSources = [
  { source: "Cold Outreach", leads: 22, converted: 8, rate: 36.4 },
  { source: "Referrals", leads: 15, converted: 9, rate: 60.0 },
  { source: "Walk-in / Tasting Events", leads: 12, converted: 6, rate: 50.0 },
  { source: "Website / Social Media", leads: 10, converted: 3, rate: 30.0 },
  { source: "Food Trade Shows", leads: 8, converted: 2, rate: 25.0 },
];

// ─── Monthly Revenue (12 months) ────────────────────────────────────────────

export const monthlyRevenue: MonthlyRevenue[] = [
  { month: "Apr 2025", revenue: 3200.00, target: 4000.00, dozensDelivered: 380 },
  { month: "May 2025", revenue: 4100.00, target: 5000.00, dozensDelivered: 490 },
  { month: "Jun 2025", revenue: 5450.00, target: 6000.00, dozensDelivered: 650 },
  { month: "Jul 2025", revenue: 6800.00, target: 7000.00, dozensDelivered: 810 },
  { month: "Aug 2025", revenue: 7950.00, target: 8000.00, dozensDelivered: 945 },
  { month: "Sep 2025", revenue: 9200.00, target: 9000.00, dozensDelivered: 1095 },
  { month: "Oct 2025", revenue: 10450.00, target: 10000.00, dozensDelivered: 1240 },
  { month: "Nov 2025", revenue: 11800.00, target: 11000.00, dozensDelivered: 1400 },
  { month: "Dec 2025", revenue: 12600.00, target: 12000.00, dozensDelivered: 1500 },
  { month: "Jan 2026", revenue: 13400.00, target: 13000.00, dozensDelivered: 1590 },
  { month: "Feb 2026", revenue: 14650.00, target: 14000.00, dozensDelivered: 1740 },
  { month: "Mar 2026", revenue: 15930.00, target: 15000.00, dozensDelivered: 1890 },
];

// ─── Weekly Performance ──────────────────────────────────────────────────────

export const weeklyPerformance = [
  { day: "Mon", calls: 12, emails: 8, tastings: 2, deliveries: 14 },
  { day: "Tue", calls: 9, emails: 11, tastings: 3, deliveries: 16 },
  { day: "Wed", calls: 14, emails: 6, tastings: 1, deliveries: 18 },
  { day: "Thu", calls: 8, emails: 13, tastings: 4, deliveries: 15 },
  { day: "Fri", calls: 11, emails: 9, tastings: 2, deliveries: 20 },
  { day: "Sat", calls: 3, emails: 2, tastings: 0, deliveries: 8 },
];

// ─── Sales Reps ──────────────────────────────────────────────────────────────

export const salesReps: SalesRep[] = [
  {
    id: "rep-1",
    name: "Rosie Manneh",
    avatar: "RM",
    role: "Founder / Head of Sales",
    quota: 6000.00,
    closed: 6480.00,
    pipeline: 3200.00,
    deals: 12,
    winRate: 45.2,
    avgDealSize: 540.00,
    accountsWon: 12,
  },
  {
    id: "rep-2",
    name: "Nadia Mansour",
    avatar: "NM",
    role: "Wholesale Account Manager",
    quota: 5000.00,
    closed: 5250.00,
    pipeline: 2800.00,
    deals: 10,
    winRate: 41.7,
    avgDealSize: 525.00,
    accountsWon: 10,
  },
  {
    id: "rep-3",
    name: "Marc-André Bouchard",
    avatar: "MB",
    role: "Territory Sales Rep",
    quota: 4500.00,
    closed: 4200.00,
    pipeline: 2450.00,
    deals: 8,
    winRate: 33.3,
    avgDealSize: 525.00,
    accountsWon: 6,
  },
];

// ─── Deals ───────────────────────────────────────────────────────────────────

export const deals: Deal[] = [
  // ── Signed accounts ──
  {
    id: "d-001", company: "Café Olimpico", contact: "Marco Rinaldi",
    value: 680.00, dozenPerWeek: 18, stage: "signed", probability: 100,
    expectedClose: "2025-06-15", owner: "Rosie Manneh", lastActivity: "2026-03-14",
    source: "Cold Outreach", segment: "Cafes", products: ["Plain", "Sesame", "Everything"], region: "Montreal",
  },
  {
    id: "d-002", company: "Le Petit Déjeuner", contact: "Sophie Tremblay",
    value: 510.00, dozenPerWeek: 14, stage: "signed", probability: 100,
    expectedClose: "2025-07-01", owner: "Nadia Mansour", lastActivity: "2026-03-13",
    source: "Referrals", segment: "Restaurants", products: ["Plain", "Everything"], region: "Montreal",
  },
  {
    id: "d-003", company: "Hôtel Le Germain", contact: "Jean-François Côté",
    value: 1020.00, dozenPerWeek: 28, stage: "signed", probability: 100,
    expectedClose: "2025-08-10", owner: "Rosie Manneh", lastActivity: "2026-03-15",
    source: "Cold Outreach", segment: "Hotels", products: ["Plain", "Sesame", "Everything"], region: "Montreal",
  },
  {
    id: "d-004", company: "Marché Jean-Talon Deli", contact: "Antonio Ferrara",
    value: 425.00, dozenPerWeek: 12, stage: "signed", probability: 100,
    expectedClose: "2025-09-01", owner: "Marc-André Bouchard", lastActivity: "2026-03-12",
    source: "Walk-in / Tasting Events", segment: "Grocery Stores", products: ["Plain", "Sesame"], region: "Montreal",
  },
  {
    id: "d-005", company: "Bistro Le Cartet", contact: "Isabelle Gagnon",
    value: 595.00, dozenPerWeek: 16, stage: "signed", probability: 100,
    expectedClose: "2025-09-15", owner: "Nadia Mansour", lastActivity: "2026-03-14",
    source: "Referrals", segment: "Restaurants", products: ["Everything", "Sesame"], region: "Montreal",
  },
  {
    id: "d-006", company: "McGill University Dining", contact: "David Chen",
    value: 400.00, dozenPerWeek: 19, stage: "signed", probability: 100,
    expectedClose: "2025-10-01", owner: "Rosie Manneh", lastActivity: "2026-03-11",
    source: "Cold Outreach", segment: "Universities", products: ["Plain", "Everything"], region: "Montreal",
  },
  {
    id: "d-007", company: "Café Myriade", contact: "Émilie Dubois",
    value: 340.00, dozenPerWeek: 9, stage: "signed", probability: 100,
    expectedClose: "2025-10-20", owner: "Nadia Mansour", lastActivity: "2026-03-13",
    source: "Referrals", segment: "Cafes", products: ["Plain", "Sesame"], region: "Montreal",
  },
  {
    id: "d-008", company: "Traiteur Agnus Dei", contact: "Pierre Lavoie",
    value: 480.00, dozenPerWeek: 15, stage: "signed", probability: 100,
    expectedClose: "2025-11-01", owner: "Marc-André Bouchard", lastActivity: "2026-03-15",
    source: "Food Trade Shows", segment: "Catering", products: ["Plain", "Sesame", "Everything"], region: "Montreal",
  },
  {
    id: "d-009", company: "Fairmont Le Reine Elizabeth", contact: "Catherine Roy",
    value: 850.00, dozenPerWeek: 24, stage: "signed", probability: 100,
    expectedClose: "2025-11-15", owner: "Rosie Manneh", lastActivity: "2026-03-14",
    source: "Cold Outreach", segment: "Hotels", products: ["Plain", "Sesame", "Everything"], region: "Montreal",
  },
  {
    id: "d-010", company: "Dispatch Coffee", contact: "Alex Moreau",
    value: 290.00, dozenPerWeek: 8, stage: "signed", probability: 100,
    expectedClose: "2025-12-01", owner: "Nadia Mansour", lastActivity: "2026-03-12",
    source: "Website / Social Media", segment: "Cafes", products: ["Everything", "Plain"], region: "Montreal",
  },
  {
    id: "d-011", company: "Restaurant Leméac", contact: "François Beaulieu",
    value: 620.00, dozenPerWeek: 17, stage: "signed", probability: 100,
    expectedClose: "2025-12-10", owner: "Rosie Manneh", lastActivity: "2026-03-15",
    source: "Referrals", segment: "Restaurants", products: ["Plain", "Sesame", "Everything"], region: "Montreal",
  },
  {
    id: "d-012", company: "IGA Extra Marché du Village", contact: "Luc Bélanger",
    value: 380.00, dozenPerWeek: 11, stage: "signed", probability: 100,
    expectedClose: "2026-01-05", owner: "Marc-André Bouchard", lastActivity: "2026-03-13",
    source: "Cold Outreach", segment: "Grocery Stores", products: ["Plain", "Sesame", "Everything"], region: "Montreal",
  },
  {
    id: "d-013", company: "Beautys Luncheonette", contact: "Larry Sckolnick",
    value: 560.00, dozenPerWeek: 15, stage: "signed", probability: 100,
    expectedClose: "2026-01-15", owner: "Rosie Manneh", lastActivity: "2026-03-14",
    source: "Walk-in / Tasting Events", segment: "Restaurants", products: ["Plain", "Everything"], region: "Montreal",
  },
  {
    id: "d-014", company: "Café Parvis", contact: "Mathieu Lessard",
    value: 310.00, dozenPerWeek: 8, stage: "signed", probability: 100,
    expectedClose: "2026-01-20", owner: "Nadia Mansour", lastActivity: "2026-03-11",
    source: "Referrals", segment: "Cafes", products: ["Sesame", "Everything"], region: "Montreal",
  },
  {
    id: "d-015", company: "Schwartz's Deli", contact: "Frank Silva",
    value: 720.00, dozenPerWeek: 20, stage: "signed", probability: 100,
    expectedClose: "2026-02-01", owner: "Rosie Manneh", lastActivity: "2026-03-15",
    source: "Walk-in / Tasting Events", segment: "Restaurants", products: ["Plain", "Sesame", "Everything"], region: "Montreal",
  },
  {
    id: "d-016", company: "Boulangerie Guillaume", contact: "Guillaume Vaillancourt",
    value: 270.00, dozenPerWeek: 7, stage: "signed", probability: 100,
    expectedClose: "2026-02-10", owner: "Marc-André Bouchard", lastActivity: "2026-03-14",
    source: "Referrals", segment: "Cafes", products: ["Plain"], region: "Montreal",
  },
  {
    id: "d-017", company: "Hôtel Nelligan", contact: "Marie-Claire Fontaine",
    value: 780.00, dozenPerWeek: 22, stage: "signed", probability: 100,
    expectedClose: "2026-02-15", owner: "Rosie Manneh", lastActivity: "2026-03-13",
    source: "Cold Outreach", segment: "Hotels", products: ["Plain", "Sesame", "Everything"], region: "Montreal",
  },
  {
    id: "d-018", company: "Olive et Gourmando", contact: "Dyan Solomon",
    value: 540.00, dozenPerWeek: 14, stage: "signed", probability: 100,
    expectedClose: "2026-02-20", owner: "Nadia Mansour", lastActivity: "2026-03-15",
    source: "Referrals", segment: "Restaurants", products: ["Everything", "Sesame"], region: "Montreal",
  },
  {
    id: "d-019", company: "Concordia Food Services", contact: "Michael Thompson",
    value: 350.00, dozenPerWeek: 16, stage: "signed", probability: 100,
    expectedClose: "2026-02-25", owner: "Nadia Mansour", lastActivity: "2026-03-12",
    source: "Cold Outreach", segment: "Universities", products: ["Plain", "Everything"], region: "Montreal",
  },
  {
    id: "d-020", company: "Provisions du Marché", contact: "Anne-Marie Lefebvre",
    value: 320.00, dozenPerWeek: 9, stage: "signed", probability: 100,
    expectedClose: "2026-03-01", owner: "Marc-André Bouchard", lastActivity: "2026-03-14",
    source: "Walk-in / Tasting Events", segment: "Grocery Stores", products: ["Plain", "Sesame"], region: "Montreal",
  },
  {
    id: "d-021", company: "Café Saint-Henri", contact: "Jean-Philippe Nadeau",
    value: 380.00, dozenPerWeek: 10, stage: "signed", probability: 100,
    expectedClose: "2026-03-05", owner: "Rosie Manneh", lastActivity: "2026-03-15",
    source: "Website / Social Media", segment: "Cafes", products: ["Plain", "Everything"], region: "Montreal",
  },
  {
    id: "d-022", company: "Traiteur Le Grain de Sel", contact: "Sylvie Boucher",
    value: 450.00, dozenPerWeek: 13, stage: "signed", probability: 100,
    expectedClose: "2026-03-08", owner: "Nadia Mansour", lastActivity: "2026-03-14",
    source: "Referrals", segment: "Catering", products: ["Plain", "Sesame", "Everything"], region: "Montreal",
  },
  {
    id: "d-023", company: "La Banquise", contact: "Marc Latendresse",
    value: 490.00, dozenPerWeek: 13, stage: "signed", probability: 100,
    expectedClose: "2026-03-10", owner: "Rosie Manneh", lastActivity: "2026-03-15",
    source: "Cold Outreach", segment: "Restaurants", products: ["Plain", "Everything"], region: "Montreal",
  },
  {
    id: "d-024", company: "Crew Café", contact: "Simon Fréchette",
    value: 260.00, dozenPerWeek: 7, stage: "signed", probability: 100,
    expectedClose: "2026-03-12", owner: "Marc-André Bouchard", lastActivity: "2026-03-13",
    source: "Website / Social Media", segment: "Cafes", products: ["Sesame", "Everything"], region: "Montreal",
  },
  {
    id: "d-025", company: "Metro Plus Verdun", contact: "Robert Gagné",
    value: 410.00, dozenPerWeek: 12, stage: "signed", probability: 100,
    expectedClose: "2026-03-14", owner: "Nadia Mansour", lastActivity: "2026-03-15",
    source: "Cold Outreach", segment: "Grocery Stores", products: ["Plain", "Sesame", "Everything"], region: "Montreal",
  },
  {
    id: "d-026", company: "Événements Montréal Catering", contact: "Chantal Bergeron",
    value: 420.00, dozenPerWeek: 13, stage: "signed", probability: 100,
    expectedClose: "2026-03-15", owner: "Rosie Manneh", lastActivity: "2026-03-16",
    source: "Food Trade Shows", segment: "Catering", products: ["Plain", "Sesame", "Everything"], region: "Montreal",
  },
  {
    id: "d-027", company: "Tech Park Corporate Dining", contact: "Sarah Mitchell",
    value: 380.00, dozenPerWeek: 16, stage: "signed", probability: 100,
    expectedClose: "2026-03-10", owner: "Nadia Mansour", lastActivity: "2026-03-15",
    source: "Cold Outreach", segment: "Corporate", products: ["Plain", "Everything"], region: "Montreal",
  },
  {
    id: "d-028", company: "Deloitte Montreal Office", contact: "Patrick Nguyen",
    value: 300.00, dozenPerWeek: 14, stage: "signed", probability: 100,
    expectedClose: "2026-03-12", owner: "Rosie Manneh", lastActivity: "2026-03-14",
    source: "Referrals", segment: "Corporate", products: ["Plain", "Sesame"], region: "Montreal",
  },

  // ── Pipeline deals (not yet signed) ──
  {
    id: "d-029", company: "Ritz-Carlton Montreal", contact: "Philippe Dumont",
    value: 1200.00, dozenPerWeek: 35, stage: "negotiation", probability: 75,
    expectedClose: "2026-04-01", owner: "Rosie Manneh", lastActivity: "2026-03-15",
    source: "Cold Outreach", segment: "Hotels", products: ["Plain", "Sesame", "Everything"], region: "Montreal",
  },
  {
    id: "d-030", company: "Provigo Le Marché", contact: "Diane Pelletier",
    value: 650.00, dozenPerWeek: 20, stage: "negotiation", probability: 70,
    expectedClose: "2026-04-05", owner: "Nadia Mansour", lastActivity: "2026-03-14",
    source: "Cold Outreach", segment: "Grocery Stores", products: ["Plain", "Sesame", "Everything"], region: "Montreal",
  },
  {
    id: "d-031", company: "Joe Beef", contact: "David McMillan",
    value: 580.00, dozenPerWeek: 16, stage: "negotiation", probability: 65,
    expectedClose: "2026-04-10", owner: "Rosie Manneh", lastActivity: "2026-03-13",
    source: "Referrals", segment: "Restaurants", products: ["Plain", "Everything"], region: "Montreal",
  },
  {
    id: "d-032", company: "Café Résonance", contact: "Julien Marchand",
    value: 280.00, dozenPerWeek: 8, stage: "tasting", probability: 55,
    expectedClose: "2026-04-15", owner: "Marc-André Bouchard", lastActivity: "2026-03-14",
    source: "Website / Social Media", segment: "Cafes", products: ["Everything", "Sesame"], region: "Montreal",
  },
  {
    id: "d-033", company: "Mandy's Salads", contact: "Mandy Wolfe",
    value: 420.00, dozenPerWeek: 12, stage: "tasting", probability: 50,
    expectedClose: "2026-04-20", owner: "Nadia Mansour", lastActivity: "2026-03-15",
    source: "Referrals", segment: "Restaurants", products: ["Plain", "Sesame"], region: "Montreal",
  },
  {
    id: "d-034", company: "Université de Montréal Dining", contact: "Louise Paradis",
    value: 550.00, dozenPerWeek: 25, stage: "tasting", probability: 45,
    expectedClose: "2026-04-25", owner: "Rosie Manneh", lastActivity: "2026-03-12",
    source: "Cold Outreach", segment: "Universities", products: ["Plain", "Everything"], region: "Montreal",
  },
  {
    id: "d-035", company: "Tommy Café", contact: "Thomas Nguyen",
    value: 320.00, dozenPerWeek: 9, stage: "sample_request", probability: 35,
    expectedClose: "2026-05-01", owner: "Marc-André Bouchard", lastActivity: "2026-03-14",
    source: "Website / Social Media", segment: "Cafes", products: ["Plain", "Everything"], region: "Montreal",
  },
  {
    id: "d-036", company: "Auberge Saint-Gabriel", contact: "Nicolas Gauthier",
    value: 480.00, dozenPerWeek: 14, stage: "sample_request", probability: 30,
    expectedClose: "2026-05-05", owner: "Rosie Manneh", lastActivity: "2026-03-13",
    source: "Cold Outreach", segment: "Hotels", products: ["Plain", "Sesame", "Everything"], region: "Montreal",
  },
  {
    id: "d-037", company: "Rachelle-Béry", contact: "Véronique Deschamps",
    value: 350.00, dozenPerWeek: 10, stage: "sample_request", probability: 30,
    expectedClose: "2026-05-10", owner: "Nadia Mansour", lastActivity: "2026-03-15",
    source: "Food Trade Shows", segment: "Grocery Stores", products: ["Plain", "Sesame"], region: "Montreal",
  },
  {
    id: "d-038", company: "Brasserie T!", contact: "Normand Laprise",
    value: 450.00, dozenPerWeek: 12, stage: "sample_request", probability: 25,
    expectedClose: "2026-05-15", owner: "Rosie Manneh", lastActivity: "2026-03-11",
    source: "Referrals", segment: "Restaurants", products: ["Plain", "Sesame", "Everything"], region: "Montreal",
  },
  // ── Leads ──
  {
    id: "d-039", company: "Four Seasons Montreal", contact: "Isabelle Martin",
    value: 1400.00, dozenPerWeek: 40, stage: "lead", probability: 15,
    expectedClose: "2026-06-01", owner: "Rosie Manneh", lastActivity: "2026-03-14",
    source: "Cold Outreach", segment: "Hotels", products: ["Plain", "Sesame", "Everything"], region: "Montreal",
  },
  {
    id: "d-040", company: "Costco Marché Central", contact: "Brian Wilson",
    value: 2200.00, dozenPerWeek: 80, stage: "lead", probability: 10,
    expectedClose: "2026-07-01", owner: "Rosie Manneh", lastActivity: "2026-03-10",
    source: "Cold Outreach", segment: "Grocery Stores", products: ["Plain", "Sesame", "Everything"], region: "Montreal",
  },
  {
    id: "d-041", company: "Café Névé", contact: "Sébastien Fiset",
    value: 240.00, dozenPerWeek: 6, stage: "lead", probability: 20,
    expectedClose: "2026-05-20", owner: "Marc-André Bouchard", lastActivity: "2026-03-13",
    source: "Website / Social Media", segment: "Cafes", products: ["Everything"], region: "Montreal",
  },
  {
    id: "d-042", company: "Restaurant Toqué!", contact: "Normand Laprise",
    value: 680.00, dozenPerWeek: 18, stage: "lead", probability: 15,
    expectedClose: "2026-06-15", owner: "Rosie Manneh", lastActivity: "2026-03-12",
    source: "Referrals", segment: "Restaurants", products: ["Plain", "Sesame", "Everything"], region: "Montreal",
  },
  {
    id: "d-043", company: "Ottawa Convention Centre", contact: "Jennifer Adams",
    value: 950.00, dozenPerWeek: 30, stage: "lead", probability: 10,
    expectedClose: "2026-07-15", owner: "Nadia Mansour", lastActivity: "2026-03-09",
    source: "Cold Outreach", segment: "Catering", products: ["Plain", "Everything"], region: "Ottawa",
  },
  {
    id: "d-044", company: "Café Pista", contact: "Ravi Sharma",
    value: 310.00, dozenPerWeek: 8, stage: "lead", probability: 20,
    expectedClose: "2026-05-25", owner: "Marc-André Bouchard", lastActivity: "2026-03-14",
    source: "Walk-in / Tasting Events", segment: "Cafes", products: ["Plain", "Sesame"], region: "Montreal",
  },
  {
    id: "d-045", company: "Whole Foods Monkland", contact: "Lisa Park",
    value: 520.00, dozenPerWeek: 15, stage: "lead", probability: 15,
    expectedClose: "2026-06-10", owner: "Nadia Mansour", lastActivity: "2026-03-11",
    source: "Cold Outreach", segment: "Grocery Stores", products: ["Plain", "Sesame", "Everything"], region: "Montreal",
  },
  {
    id: "d-046", company: "Le Mousso", contact: "Antonin Mousseau-Rivard",
    value: 380.00, dozenPerWeek: 10, stage: "lead", probability: 15,
    expectedClose: "2026-06-20", owner: "Rosie Manneh", lastActivity: "2026-03-13",
    source: "Referrals", segment: "Restaurants", products: ["Plain", "Everything"], region: "Montreal",
  },
];

// ─── Recent Activities ───────────────────────────────────────────────────────

export const recentActivities: Activity[] = [
  {
    id: "a-001", type: "deal_won", description: "Signed wholesale contract with Événements Montréal Catering — 13 dz/week",
    contact: "Chantal Bergeron", company: "Événements Montréal Catering", timestamp: "2026-03-16T08:30:00", rep: "Rosie Manneh",
  },
  {
    id: "a-002", type: "tasting", description: "Delivered tasting samples to Mandy's Salads — Plain & Sesame, 2 dozen",
    contact: "Mandy Wolfe", company: "Mandy's Salads", timestamp: "2026-03-15T14:00:00", rep: "Nadia Mansour",
  },
  {
    id: "a-003", type: "call", description: "Follow-up call with Ritz-Carlton — finalizing weekly order volume and delivery schedule",
    contact: "Philippe Dumont", company: "Ritz-Carlton Montreal", timestamp: "2026-03-15T11:30:00", rep: "Rosie Manneh",
  },
  {
    id: "a-004", type: "email", description: "Sent wholesale pricing sheet and product catalog to Provigo Le Marché",
    contact: "Diane Pelletier", company: "Provigo Le Marché", timestamp: "2026-03-15T09:15:00", rep: "Nadia Mansour",
  },
  {
    id: "a-005", type: "sample_sent", description: "Shipped sample box (Plain, Sesame, Everything — 1 dz each) to Brasserie T!",
    contact: "Normand Laprise", company: "Brasserie T!", timestamp: "2026-03-14T16:00:00", rep: "Rosie Manneh",
  },
  {
    id: "a-006", type: "meeting", description: "On-site meeting at Joe Beef — discussed brunch menu integration and weekly volume",
    contact: "David McMillan", company: "Joe Beef", timestamp: "2026-03-14T10:00:00", rep: "Rosie Manneh",
  },
  {
    id: "a-007", type: "email", description: "Sent follow-up to Whole Foods Monkland with organic certification details",
    contact: "Lisa Park", company: "Whole Foods Monkland", timestamp: "2026-03-13T15:30:00", rep: "Nadia Mansour",
  },
  {
    id: "a-008", type: "call", description: "Cold call to Four Seasons Montreal — spoke with F&B director, interested in tasting",
    contact: "Isabelle Martin", company: "Four Seasons Montreal", timestamp: "2026-03-13T11:00:00", rep: "Rosie Manneh",
  },
  {
    id: "a-009", type: "deal_won", description: "Signed contract with Deloitte Montreal Office — 14 dz/week for employee breakfasts",
    contact: "Patrick Nguyen", company: "Deloitte Montreal Office", timestamp: "2026-03-12T14:00:00", rep: "Rosie Manneh",
  },
  {
    id: "a-010", type: "note", description: "Updated Café Résonance tasting notes — loved Everything bagels, wants to try with house cream cheese",
    contact: "Julien Marchand", company: "Café Résonance", timestamp: "2026-03-12T09:30:00", rep: "Marc-André Bouchard",
  },
  {
    id: "a-011", type: "tasting", description: "Hosted tasting event at Marché Jean-Talon — 6 new leads generated",
    contact: "Various", company: "Marché Jean-Talon", timestamp: "2026-03-11T10:00:00", rep: "Marc-André Bouchard",
  },
  {
    id: "a-012", type: "deal_lost", description: "Lost bid for Marriott Downtown — went with larger supplier for lower price",
    contact: "James Roberts", company: "Marriott Downtown Montreal", timestamp: "2026-03-10T16:00:00", rep: "Nadia Mansour",
  },
  {
    id: "a-013", type: "email", description: "Sent intro email to Ottawa Convention Centre — exploring expansion outside Montreal",
    contact: "Jennifer Adams", company: "Ottawa Convention Centre", timestamp: "2026-03-09T11:00:00", rep: "Nadia Mansour",
  },
  {
    id: "a-014", type: "call", description: "Weekly check-in with Schwartz's Deli — increasing order from 18 to 20 dz/week",
    contact: "Frank Silva", company: "Schwartz's Deli", timestamp: "2026-03-09T09:00:00", rep: "Rosie Manneh",
  },
];

// ─── Forecast Data ───────────────────────────────────────────────────────────

export const forecastData = [
  ...monthlyRevenue.map((m) => ({ ...m, type: "actual" as const })),
  { month: "Apr 2026", revenue: 17200.00, target: 16500.00, dozensDelivered: 2040, type: "forecast" as const },
  { month: "May 2026", revenue: 18800.00, target: 18000.00, dozensDelivered: 2230, type: "forecast" as const },
  { month: "Jun 2026", revenue: 20500.00, target: 19500.00, dozensDelivered: 2430, type: "forecast" as const },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function timeAgo(timestamp: string): string {
  const now = new Date("2026-03-16T12:00:00");
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}

export function stageLabel(stage: Deal["stage"]): string {
  const labels: Record<Deal["stage"], string> = {
    lead: "Lead",
    sample_request: "Sample Request",
    tasting: "Tasting",
    negotiation: "Negotiation",
    signed: "Signed",
    lost: "Lost",
  };
  return labels[stage];
}

export function stageColor(stage: Deal["stage"]): string {
  const colors: Record<Deal["stage"], string> = {
    lead: "bg-slate-100 text-slate-700",
    sample_request: "bg-amber-50 text-amber-700",
    tasting: "bg-orange-50 text-orange-700",
    negotiation: "bg-sky-50 text-sky-700",
    signed: "bg-emerald-50 text-emerald-700",
    lost: "bg-red-50 text-red-600",
  };
  return colors[stage];
}
