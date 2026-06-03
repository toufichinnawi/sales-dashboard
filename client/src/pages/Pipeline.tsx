/**
 * Pipeline — Hinnawi Bros Bagels Wholesale
 * Wholesale sales pipeline driven by live leads (status NOT IN won/lost).
 * Both this page and the Overview "Open Leads" KPI read the same query.
 * A dollar-based pipeline can replace the count view once per-tier $ estimates exist.
 */

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { leadSources } from "@/lib/data";
import { trpc } from "@/lib/trpc";

const AMBER = "#B45309";
const AMBER_LIGHT = "#D97706";
const SLATE = "#78716C";

const WHOLESALE_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663391168179/X4Qkp2kKx9JEdEZTkB9mBy/hinnawi-wholesale-display-BQDXsxqBED2xjEkUfALSkd.webp";

// Open lead statuses in funnel order. Mirrors the leads.status enum minus won/lost.
const STAGE_ORDER = [
  "new",
  "contacted",
  "interested",
  "tasting_scheduled",
  "quote_sent",
  "negotiation",
] as const;
type OpenStatus = (typeof STAGE_ORDER)[number];

const STAGE_LABELS: Record<OpenStatus, string> = {
  new: "New",
  contacted: "Contacted",
  interested: "Interested",
  tasting_scheduled: "Tasting",
  quote_sent: "Quote Sent",
  negotiation: "Negotiation",
};

const STAGE_COLORS = [SLATE, "#A8A29E", "#D4A574", AMBER_LIGHT, "#C2410C", AMBER];

const STAGE_BADGE: Record<OpenStatus, string> = {
  new: "bg-stone-100 text-stone-700",
  contacted: "bg-stone-200 text-stone-800",
  interested: "bg-amber-100 text-amber-800",
  tasting_scheduled: "bg-amber-200 text-amber-900",
  quote_sent: "bg-orange-100 text-orange-800",
  negotiation: "bg-amber-300 text-amber-900",
};

const TIER_BADGE: Record<"low" | "medium" | "high", string> = {
  low: "bg-stone-100 text-stone-700",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-amber-200 text-amber-900",
};

export default function Pipeline() {
  const { data: funnel, isLoading: funnelLoading } = trpc.dashboard.openLeadsFunnel.useQuery();
  const { data: openLeads, isLoading: leadsLoading } = trpc.dashboard.openLeads.useQuery();

  const stageRows = useMemo(() => {
    const countByStatus = new Map<string, number>();
    for (const row of funnel?.byStatus ?? []) {
      countByStatus.set(row.status, row.count);
    }
    return STAGE_ORDER.map((status) => ({
      status,
      stage: STAGE_LABELS[status],
      count: countByStatus.get(status) ?? 0,
    }));
  }, [funnel]);

  const tierLine = useMemo(() => {
    const t = funnel?.byTier;
    if (!t) return null;
    const parts: string[] = [];
    if (t.high) parts.push(`${t.high} high`);
    if (t.medium) parts.push(`${t.medium} medium`);
    if (t.low) parts.push(`${t.low} low`);
    if (t.unset) parts.push(`${t.unset} unset`);
    return parts.length ? parts.join(" · ") : null;
  }, [funnel]);

  const totalOpen = funnel?.totalOpen ?? 0;
  const sortedLeads = useMemo(
    () =>
      [...(openLeads ?? [])].sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 } as const;
        const av = a.potentialValue ? order[a.potentialValue] : 3;
        const bv = b.potentialValue ? order[b.potentialValue] : 3;
        return av - bv;
      }),
    [openLeads]
  );

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative h-36 md:h-44 overflow-hidden">
        <img src={WHOLESALE_IMG} alt="Wholesale bagels" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        <div className="absolute bottom-4 left-6">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-white tracking-tight">
            Sales Pipeline
          </h1>
          <p className="text-white/80 text-sm mt-0.5">
            {funnelLoading ? "Loading…" : `${totalOpen} open leads${tierLine ? ` · ${tierLine}` : ""}`}
          </p>
        </div>
      </div>

      <div className="px-4 md:px-6 space-y-6 pb-6">
        {/* Stage summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {stageRows.map((row, i) => (
            <Card
              key={row.status}
              className="animate-cascade border-border/50 py-0"
              style={{ animationDelay: `${i * 80}ms`, opacity: 0 }}
            >
              <CardContent className="p-3.5">
                <div className="text-[11px] text-muted-foreground mb-1">{row.stage}</div>
                <div className="font-data text-lg font-semibold">
                  {funnelLoading ? <Skeleton className="h-5 w-8" /> : row.count}
                </div>
                <div className="font-data text-xs text-muted-foreground mt-0.5">leads</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Funnel chart — counts per stage */}
          <Card className="border-border/50 py-0">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-display font-semibold">Pipeline by Stage</CardTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">Open leads at each stage</p>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stageRows} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                  <XAxis
                    dataKey="stage"
                    tick={{ fontSize: 10, fill: SLATE }}
                    tickLine={false}
                    axisLine={{ stroke: "#e5e5e5" }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: SLATE, fontFamily: "'IBM Plex Mono', monospace" }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      fontFamily: "'IBM Plex Mono', monospace",
                      borderRadius: 6,
                      border: "1px solid #e5e5e5",
                    }}
                    formatter={(value: number) => [`${value}`, "Open leads"]}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={36}>
                    {stageRows.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={STAGE_COLORS[index % STAGE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Lead source conversion (still demo data) */}
          <Card className="border-border/50 py-0">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-display font-semibold">Lead Source Performance</CardTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">Conversion rate by source</p>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="space-y-4 mt-2">
                {leadSources.map((source) => (
                  <div key={source.source}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium">{source.source}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-data text-[11px] text-muted-foreground">
                          {source.converted}/{source.leads}
                        </span>
                        <span className="font-data text-xs font-semibold text-amber-800">
                          {source.rate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <Progress value={source.rate} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Open leads table */}
        <Card className="border-border/50 py-0">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-display font-semibold">Active Pipeline</CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">All open leads in the funnel</p>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="text-left font-semibold text-[10px] uppercase tracking-wider text-muted-foreground px-5 py-2.5">Account</th>
                    <th className="text-left font-semibold text-[10px] uppercase tracking-wider text-muted-foreground px-3 py-2.5">Contact</th>
                    <th className="text-left font-semibold text-[10px] uppercase tracking-wider text-muted-foreground px-3 py-2.5">Type</th>
                    <th className="text-left font-semibold text-[10px] uppercase tracking-wider text-muted-foreground px-3 py-2.5">Stage</th>
                    <th className="text-left font-semibold text-[10px] uppercase tracking-wider text-muted-foreground px-3 py-2.5">Est. Weekly</th>
                    <th className="text-left font-semibold text-[10px] uppercase tracking-wider text-muted-foreground px-3 py-2.5">Tier</th>
                    <th className="text-left font-semibold text-[10px] uppercase tracking-wider text-muted-foreground px-5 py-2.5">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {leadsLoading && (
                    <tr>
                      <td colSpan={7} className="px-5 py-6 text-center text-muted-foreground">
                        Loading…
                      </td>
                    </tr>
                  )}
                  {!leadsLoading && sortedLeads.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-6 text-center text-muted-foreground">
                        No open leads.
                      </td>
                    </tr>
                  )}
                  {!leadsLoading &&
                    sortedLeads.map((lead) => {
                      const stage = STAGE_ORDER.includes(lead.status as OpenStatus)
                        ? (lead.status as OpenStatus)
                        : null;
                      return (
                        <tr key={lead.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                          <td className="px-5 py-2.5 font-medium">{lead.business}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">{lead.name}</td>
                          <td className="px-3 py-2.5">
                            {lead.businessType ? (
                              <Badge variant="secondary" className="text-[10px] h-5 capitalize">
                                {lead.businessType}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            {stage ? (
                              <Badge className={`${STAGE_BADGE[stage]} text-[10px]`}>
                                {STAGE_LABELS[stage]}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">{lead.status}</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 font-data text-muted-foreground">
                            {lead.estimatedWeeklyOrder || "—"}
                          </td>
                          <td className="px-3 py-2.5">
                            {lead.potentialValue ? (
                              <Badge className={`${TIER_BADGE[lead.potentialValue]} text-[10px] capitalize`}>
                                {lead.potentialValue}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-5 py-2.5 text-muted-foreground capitalize">
                            {lead.leadSource ?? lead.source ?? "—"}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
