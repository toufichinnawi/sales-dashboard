/**
 * Pipeline Page — "Ink & Data" Editorial Design
 * Visual pipeline funnel, stage breakdown, and deal flow
 */

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  pipelineStages,
  deals,
  leadSources,
  formatCurrency,
  formatNumber,
  getStageColor,
  getStageLabel,
  type Deal,
} from "@/lib/data";

const TEAL = "#0D7377";
const TEAL_LIGHT = "#14919B";
const AMBER = "#C4841D";
const SLATE = "#64748B";
const CRIMSON = "#B5363A";

const HERO_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663391168179/X4Qkp2kKx9JEdEZTkB9mBy/crm-pipeline-visual-MSrYH9vJJdPF3eHo3EsdKz.webp";

export default function Pipeline() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Hero banner */}
      <div className="relative rounded-lg overflow-hidden h-36 md:h-44">
        <img
          src={HERO_IMAGE}
          alt="Pipeline visualization"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="relative z-10 h-full flex flex-col justify-end p-5">
          <h1 className="font-display text-xl md:text-2xl font-bold text-foreground">Sales Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track deal progression from lead to close across all stages
          </p>
        </div>
      </div>

      {/* Stage summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {pipelineStages.map((stage, i) => (
          <Card
            key={stage.stage}
            className="border-border/50 animate-cascade py-0"
            style={{ animationDelay: `${i * 80}ms`, opacity: 0 }}
          >
            <CardContent className="p-3.5">
              <div className="text-[11px] text-muted-foreground mb-1">{stage.stage}</div>
              <div className="font-data text-lg font-semibold">{stage.count}</div>
              <div className="font-data text-xs text-muted-foreground mt-0.5">
                {formatCurrency(stage.value)}
              </div>
              <div className="mt-2">
                <Progress value={stage.conversionRate} className="h-1" />
                <div className="text-[10px] text-muted-foreground mt-1">
                  {stage.conversionRate}% conversion
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pipeline value by stage */}
        <Card className="border-border/50 py-0">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-display font-semibold">Pipeline Value by Stage</CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">Total value at each stage</p>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={pipelineStages} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                <XAxis
                  dataKey="stage"
                  tick={{ fontSize: 11, fill: SLATE }}
                  tickLine={false}
                  axisLine={{ stroke: "#e5e5e5" }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: SLATE, fontFamily: "'IBM Plex Mono', monospace" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    fontFamily: "'IBM Plex Mono', monospace",
                    borderRadius: 6,
                    border: "1px solid #e5e5e5",
                  }}
                  formatter={(value: number) => [formatCurrency(value), "Value"]}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={36}>
                  {pipelineStages.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={[SLATE, "#4B9CD3", AMBER, TEAL_LIGHT, TEAL][index]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lead source breakdown */}
        <Card className="border-border/50 py-0">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-display font-semibold">Lead Sources</CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">Conversion rates by source</p>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="space-y-3">
              {leadSources.slice(0, 6).map((source) => (
                <div key={source.source}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs">{source.source}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-data text-[11px] text-muted-foreground">
                        {source.converted}/{source.leads} leads
                      </span>
                      <span className="font-data text-xs font-medium w-12 text-right">
                        {source.conversionRate}%
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${source.conversionRate}%`,
                        backgroundColor: source.conversionRate > 40 ? TEAL : source.conversionRate > 25 ? TEAL_LIGHT : SLATE,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deals in pipeline table */}
      <Card className="border-border/50 py-0">
        <CardHeader className="pb-2 pt-4 px-5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-display font-semibold">Active Deals in Pipeline</CardTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {deals.filter((d) => d.stage !== "closed_won" && d.stage !== "closed_lost").length} open deals
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-t border-b border-border/60">
                  <th className="text-left py-2.5 px-5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Deal</th>
                  <th className="text-left py-2.5 px-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Company</th>
                  <th className="text-left py-2.5 px-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Stage</th>
                  <th className="text-right py-2.5 px-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Value</th>
                  <th className="text-right py-2.5 px-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Prob</th>
                  <th className="text-left py-2.5 px-5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Owner</th>
                </tr>
              </thead>
              <tbody>
                {deals
                  .filter((d) => d.stage !== "closed_won" && d.stage !== "closed_lost")
                  .sort((a, b) => b.value - a.value)
                  .map((deal) => (
                    <tr key={deal.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-5 font-data text-muted-foreground">{deal.id}</td>
                      <td className="py-2.5 px-3">
                        <div>
                          <span className="font-medium">{deal.company}</span>
                          <div className="text-[10px] text-muted-foreground">{deal.contact}</div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant="secondary" className={`text-[10px] ${getStageColor(deal.stage)}`}>
                          {getStageLabel(deal.stage)}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right font-data font-medium">{formatCurrency(deal.value)}</td>
                      <td className="py-2.5 px-3 text-right font-data">{deal.probability}%</td>
                      <td className="py-2.5 px-5 text-muted-foreground">{deal.owner}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
