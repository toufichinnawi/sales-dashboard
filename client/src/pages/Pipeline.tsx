/**
 * Pipeline — Hinnawi Bros Bagels Wholesale
 * Wholesale sales pipeline: Lead → Sample Request → Tasting → Negotiation → Signed
 */

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import {
  deals,
  pipelineStages,
  leadSources,
  formatCurrency,
  stageLabel,
  stageColor,
  type Deal,
} from "@/lib/data";

const AMBER = "#B45309";
const AMBER_LIGHT = "#D97706";
const WARM_BROWN = "#92400E";
const SLATE = "#78716C";

const WHOLESALE_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663391168179/X4Qkp2kKx9JEdEZTkB9mBy/hinnawi-wholesale-display-BQDXsxqBED2xjEkUfALSkd.webp";

export default function Pipeline() {
  const pipelineDeals = useMemo(
    () => deals.filter((d) => d.stage !== "signed" && d.stage !== "lost"),
    []
  );

  const totalPipelineValue = useMemo(
    () => pipelineDeals.reduce((sum, d) => sum + d.value, 0),
    [pipelineDeals]
  );

  const weightedValue = useMemo(
    () => pipelineDeals.reduce((sum, d) => sum + d.value * (d.probability / 100), 0),
    [pipelineDeals]
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
            {pipelineDeals.length} prospects · {formatCurrency(totalPipelineValue)} potential monthly revenue
          </p>
        </div>
      </div>

      <div className="px-4 md:px-6 space-y-6 pb-6">
        {/* Stage summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {pipelineStages.filter(s => s.stage !== "Signed").map((stage, i) => {
            return (
              <Card
                key={stage.stage}
                className="animate-cascade border-border/50 py-0"
                style={{ animationDelay: `${i * 80}ms`, opacity: 0 }}
              >
                <CardContent className="p-3.5">
                  <div className="text-[11px] text-muted-foreground mb-1">{stage.stage}</div>
                  <div className="font-data text-lg font-semibold">{stage.count}</div>
                  <div className="font-data text-xs text-muted-foreground mt-0.5">
                    {formatCurrency(stage.value)}/mo
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {/* Weighted pipeline card */}
          <Card className="animate-cascade border-primary/30 bg-primary/5 py-0" style={{ animationDelay: "320ms", opacity: 0 }}>
            <CardContent className="p-3.5">
              <Badge className="bg-amber-100 text-amber-800 text-[10px] mb-2">Weighted</Badge>
              <div className="font-data text-lg font-semibold">{formatCurrency(weightedValue)}</div>
              <div className="text-[11px] text-muted-foreground">Expected monthly</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Pipeline value chart */}
          <Card className="border-border/50 py-0">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-display font-semibold">Pipeline by Stage</CardTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">Monthly value at each stage</p>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={pipelineStages.filter(s => s.stage !== "Signed")} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
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
                    tickFormatter={(v) => `$${v.toLocaleString()}`}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      fontFamily: "'IBM Plex Mono', monospace",
                      borderRadius: 6,
                      border: "1px solid #e5e5e5",
                    }}
                    formatter={(value: number) => [formatCurrency(value), "Monthly Value"]}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={36}>
                    {pipelineStages.filter(s => s.stage !== "Signed").map((_, index) => (
                      <Cell key={`cell-${index}`} fill={[SLATE, "#D4A574", AMBER_LIGHT, AMBER][index]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Lead source conversion */}
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

        {/* Pipeline deals table */}
        <Card className="border-border/50 py-0">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-display font-semibold">Active Pipeline</CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">All prospects in the funnel</p>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="text-left font-semibold text-[10px] uppercase tracking-wider text-muted-foreground px-5 py-2.5">Account</th>
                    <th className="text-left font-semibold text-[10px] uppercase tracking-wider text-muted-foreground px-3 py-2.5">Contact</th>
                    <th className="text-left font-semibold text-[10px] uppercase tracking-wider text-muted-foreground px-3 py-2.5">Segment</th>
                    <th className="text-left font-semibold text-[10px] uppercase tracking-wider text-muted-foreground px-3 py-2.5">Stage</th>
                    <th className="text-right font-semibold text-[10px] uppercase tracking-wider text-muted-foreground px-3 py-2.5">Dz/Week</th>
                    <th className="text-right font-semibold text-[10px] uppercase tracking-wider text-muted-foreground px-3 py-2.5">Value/Mo</th>
                    <th className="text-right font-semibold text-[10px] uppercase tracking-wider text-muted-foreground px-5 py-2.5">Prob</th>
                  </tr>
                </thead>
                <tbody>
                  {pipelineDeals
                    .sort((a, b) => b.value - a.value)
                    .map((deal) => (
                      <tr key={deal.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-2.5 font-medium">{deal.company}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{deal.contact}</td>
                        <td className="px-3 py-2.5">
                          <Badge variant="secondary" className="text-[10px] h-5">{deal.segment}</Badge>
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge className={`${stageColor(deal.stage)} text-[10px]`}>
                            {stageLabel(deal.stage)}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 text-right font-data">{deal.dozenPerWeek} dz</td>
                        <td className="px-3 py-2.5 text-right font-data font-medium">{formatCurrency(deal.value)}</td>
                        <td className="px-5 py-2.5 text-right font-data">{deal.probability}%</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
