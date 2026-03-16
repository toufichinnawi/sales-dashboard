/**
 * Analytics Page — "Ink & Data" Editorial Design
 * Industry breakdown, quarterly comparison, lead source analysis, forecasting
 */

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  ComposedChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  Activity,
} from "lucide-react";
import {
  industryBreakdown,
  quarterlyComparison,
  leadSources,
  monthlyRevenue,
  weeklyPerformance,
  formatCurrency,
  formatNumber,
} from "@/lib/data";

const TEAL = "#0D7377";
const TEAL_LIGHT = "#14919B";
const AMBER = "#C4841D";
const SLATE = "#64748B";
const CRIMSON = "#B5363A";

const PIE_COLORS = [TEAL, TEAL_LIGHT, AMBER, SLATE, "#4B9CD3", CRIMSON];

const HERO_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663391168179/X4Qkp2kKx9JEdEZTkB9mBy/dashboard-hero-abstract-E8YuzSH4AgzZhHK8tENNyE.webp";

export default function Analytics() {
  // Forecast data: extend monthly revenue with projections
  const forecastData = useMemo(() => {
    const last3 = monthlyRevenue.slice(-3);
    const avgGrowth =
      last3.reduce((s, m, i) => {
        if (i === 0) return s;
        return s + (m.revenue - last3[i - 1].revenue) / last3[i - 1].revenue;
      }, 0) / 2;

    const lastRev = monthlyRevenue[monthlyRevenue.length - 1].revenue;
    const projections = [
      { month: "Apr 2026", revenue: null, target: 310000, forecast: Math.round(lastRev * (1 + avgGrowth)) },
      { month: "May 2026", revenue: null, target: 320000, forecast: Math.round(lastRev * (1 + avgGrowth) ** 2) },
      { month: "Jun 2026", revenue: null, target: 330000, forecast: Math.round(lastRev * (1 + avgGrowth) ** 3) },
    ];

    return [
      ...monthlyRevenue.map((m) => ({ ...m, forecast: null as number | null })),
      ...projections,
    ];
  }, []);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Hero banner */}
      <div className="relative rounded-lg overflow-hidden h-36 md:h-44">
        <img
          src={HERO_IMAGE}
          alt="Analytics visualization"
          className="absolute inset-0 w-full h-full object-cover opacity-25"
        />
        <div className="relative z-10 h-full flex flex-col justify-end p-5">
          <h1 className="font-display text-xl md:text-2xl font-bold text-foreground">Analytics & Insights</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Deep-dive into revenue trends, industry segments, and forecasting
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="revenue" className="space-y-5">
        <TabsList className="bg-muted/50 h-9">
          <TabsTrigger value="revenue" className="text-xs gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="industry" className="text-xs gap-1.5">
            <PieChartIcon className="h-3.5 w-3.5" />
            Industry
          </TabsTrigger>
          <TabsTrigger value="sources" className="text-xs gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            Sources
          </TabsTrigger>
          <TabsTrigger value="forecast" className="text-xs gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            Forecast
          </TabsTrigger>
        </TabsList>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Quarterly comparison */}
            <Card className="border-border/50 py-0">
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-sm font-display font-semibold">Quarterly Performance</CardTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">Revenue vs target by quarter</p>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={quarterlyComparison} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                    <XAxis
                      dataKey="quarter"
                      tick={{ fontSize: 11, fill: SLATE }}
                      tickLine={false}
                      axisLine={{ stroke: "#e5e5e5" }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: SLATE, fontFamily: "'IBM Plex Mono', monospace" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                    />
                    <Tooltip
                      contentStyle={{
                        fontSize: 12,
                        fontFamily: "'IBM Plex Mono', monospace",
                        borderRadius: 6,
                        border: "1px solid #e5e5e5",
                      }}
                      formatter={(value: number, name: string) => [
                        formatCurrency(value),
                        name === "revenue" ? "Revenue" : "Target",
                      ]}
                    />
                    <Bar dataKey="target" fill="#E5E5E5" radius={[3, 3, 0, 0]} barSize={24} name="Target" />
                    <Bar dataKey="revenue" fill={TEAL} radius={[3, 3, 0, 0]} barSize={24} name="Revenue" />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      iconType="square"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 10, paddingBottom: 4 }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Growth trend */}
            <Card className="border-border/50 py-0">
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-sm font-display font-semibold">Growth Trend</CardTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">Quarter-over-quarter growth rate</p>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={quarterlyComparison} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                    <XAxis
                      dataKey="quarter"
                      tick={{ fontSize: 11, fill: SLATE }}
                      tickLine={false}
                      axisLine={{ stroke: "#e5e5e5" }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: SLATE, fontFamily: "'IBM Plex Mono', monospace" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        fontSize: 12,
                        fontFamily: "'IBM Plex Mono', monospace",
                        borderRadius: 6,
                        border: "1px solid #e5e5e5",
                      }}
                      formatter={(value: number) => [`${value}%`, "Growth"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="growth"
                      stroke={TEAL}
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: TEAL, strokeWidth: 2, stroke: "#fff" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Monthly revenue table */}
          <Card className="border-border/50 py-0">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-display font-semibold">Monthly Revenue Detail</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-t border-b border-border/60">
                      <th className="text-left py-2.5 px-5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Month</th>
                      <th className="text-right py-2.5 px-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Revenue</th>
                      <th className="text-right py-2.5 px-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Target</th>
                      <th className="text-right py-2.5 px-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Variance</th>
                      <th className="text-right py-2.5 px-5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Deals</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyRevenue.map((m) => {
                      const variance = m.revenue - m.target;
                      const positive = variance >= 0;
                      return (
                        <tr key={m.month} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 px-5 font-medium">{m.month}</td>
                          <td className="py-2.5 px-3 text-right font-data">{formatCurrency(m.revenue)}</td>
                          <td className="py-2.5 px-3 text-right font-data text-muted-foreground">{formatCurrency(m.target)}</td>
                          <td className={`py-2.5 px-3 text-right font-data ${positive ? "text-teal-700" : "text-red-600"}`}>
                            {positive ? "+" : ""}{formatCurrency(variance)}
                          </td>
                          <td className="py-2.5 px-5 text-right font-data">{m.deals}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Industry Tab */}
        <TabsContent value="industry" className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Pie chart */}
            <Card className="border-border/50 py-0">
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-sm font-display font-semibold">Revenue by Industry</CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={industryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={110}
                      paddingAngle={2}
                      dataKey="revenue"
                      nameKey="industry"
                      stroke="none"
                    >
                      {industryBreakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        fontSize: 12,
                        fontFamily: "'IBM Plex Mono', monospace",
                        borderRadius: 6,
                        border: "1px solid #e5e5e5",
                      }}
                      formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
                  {industryBreakdown.map((item, i) => (
                    <div key={item.industry} className="flex items-center gap-1.5">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="text-[10px] text-muted-foreground">{item.industry}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Industry table */}
            <Card className="border-border/50 py-0">
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-sm font-display font-semibold">Industry Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-t border-b border-border/60">
                      <th className="text-left py-2.5 px-5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Industry</th>
                      <th className="text-right py-2.5 px-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Revenue</th>
                      <th className="text-right py-2.5 px-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Deals</th>
                      <th className="text-right py-2.5 px-5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {industryBreakdown.map((item, i) => (
                      <tr key={item.industry} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-5">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2 w-2 rounded-full shrink-0"
                              style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                            />
                            <span className="font-medium">{item.industry}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-data">{formatCurrency(item.revenue)}</td>
                        <td className="py-2.5 px-3 text-right font-data">{item.deals}</td>
                        <td className="py-2.5 px-5 text-right font-data">{item.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sources Tab */}
        <TabsContent value="sources" className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Lead source bar chart */}
            <Card className="border-border/50 py-0">
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-sm font-display font-semibold">Revenue by Lead Source</CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={leadSources}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10, fill: SLATE, fontFamily: "'IBM Plex Mono', monospace" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                    />
                    <YAxis
                      dataKey="source"
                      type="category"
                      tick={{ fontSize: 11, fill: "#1A1A1A" }}
                      tickLine={false}
                      axisLine={false}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{
                        fontSize: 12,
                        fontFamily: "'IBM Plex Mono', monospace",
                        borderRadius: 6,
                        border: "1px solid #e5e5e5",
                      }}
                      formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                    />
                    <Bar dataKey="revenue" fill={TEAL} radius={[0, 4, 4, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Source conversion rates */}
            <Card className="border-border/50 py-0">
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-sm font-display font-semibold">Source Conversion Rates</CardTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">Lead to customer conversion</p>
              </CardHeader>
              <CardContent className="px-5 pb-4">
                <div className="space-y-4">
                  {leadSources
                    .sort((a, b) => b.conversionRate - a.conversionRate)
                    .map((source) => (
                      <div key={source.source}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium">{source.source}</span>
                          <div className="flex items-center gap-3">
                            <span className="font-data text-[11px] text-muted-foreground">
                              {formatCurrency(source.revenue)}
                            </span>
                            <Badge
                              variant="secondary"
                              className={`text-[10px] h-4 font-data ${
                                source.conversionRate > 40
                                  ? "bg-teal-50 text-teal-700"
                                  : source.conversionRate > 25
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-slate-50 text-slate-600"
                              }`}
                            >
                              {source.conversionRate}%
                            </Badge>
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${source.conversionRate}%`,
                              backgroundColor:
                                source.conversionRate > 40
                                  ? TEAL
                                  : source.conversionRate > 25
                                  ? AMBER
                                  : SLATE,
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] text-muted-foreground">
                            {source.converted} converted of {source.leads} leads
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Forecast Tab */}
        <TabsContent value="forecast" className="space-y-5">
          <Card className="border-border/50 py-0">
            <CardHeader className="pb-2 pt-4 px-5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-display font-semibold">Revenue Forecast</CardTitle>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Historical data with 3-month projection based on growth trend
                  </p>
                </div>
                <Badge variant="secondary" className="text-[10px] h-5 bg-amber-50 text-amber-700">
                  Projected
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              <ResponsiveContainer width="100%" height={340}>
                <ComposedChart data={forecastData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={AMBER} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={AMBER} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="revenueGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={TEAL} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={TEAL} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: SLATE }}
                    tickLine={false}
                    axisLine={{ stroke: "#e5e5e5" }}
                    tickFormatter={(v) => v.split(" ")[0].slice(0, 3)}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: SLATE, fontFamily: "'IBM Plex Mono', monospace" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      fontFamily: "'IBM Plex Mono', monospace",
                      borderRadius: 6,
                      border: "1px solid #e5e5e5",
                    }}
                    formatter={(value: any, name: string) => {
                      if (value === null || value === undefined) return ["-", name];
                      return [
                        formatCurrency(Number(value)),
                        name === "revenue" ? "Actual" : name === "forecast" ? "Forecast" : "Target",
                      ];
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={TEAL}
                    strokeWidth={2}
                    fill="url(#revenueGrad2)"
                    dot={{ r: 2.5, fill: TEAL, strokeWidth: 0 }}
                    connectNulls={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="forecast"
                    stroke={AMBER}
                    strokeWidth={2}
                    strokeDasharray="6 3"
                    fill="url(#forecastGrad)"
                    dot={{ r: 3, fill: AMBER, strokeWidth: 2, stroke: "#fff" }}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke={SLATE}
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="line"
                    wrapperStyle={{ fontSize: 10, paddingBottom: 8 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Forecast summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {forecastData
              .filter((d) => d.forecast !== null)
              .map((d) => (
                <Card key={d.month} className="border-border/50 border-dashed py-0">
                  <CardContent className="p-4">
                    <div className="text-[11px] text-muted-foreground mb-1">{d.month}</div>
                    <div className="font-data text-lg font-semibold text-amber-700">
                      {formatCurrency(d.forecast!)}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      Target: {formatCurrency(d.target)}
                    </div>
                    <Badge variant="secondary" className="mt-2 text-[9px] bg-amber-50 text-amber-700">
                      Projected
                    </Badge>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
