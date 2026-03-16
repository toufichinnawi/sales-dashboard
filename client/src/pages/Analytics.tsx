/**
 * Analytics — Hinnawi Bros Bagels Wholesale
 * Customer segments, product mix, lead sources, revenue forecast
 */

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  customerSegments,
  products,
  leadSources,
  monthlyRevenue,
  forecastData,
  formatCurrency,
} from "@/lib/data";

const AMBER = "#B45309";
const AMBER_LIGHT = "#D97706";
const WARM_BROWN = "#92400E";
const SLATE = "#78716C";

const PIE_COLORS = [WARM_BROWN, AMBER, AMBER_LIGHT, "#D4A574", SLATE, "#A8A29E", "#78716C"];

const ANALYTICS_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663391168179/X4Qkp2kKx9JEdEZTkB9mBy/hinnawi-analytics-bg-iQSJvbPJkPKkKBfWPvJxVH.webp";

export default function Analytics() {
  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div className="relative h-36 md:h-44 overflow-hidden">
        <img src={ANALYTICS_IMG} alt="Analytics" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        <div className="absolute bottom-4 left-6">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-white tracking-tight">
            Analytics & Insights
          </h1>
          <p className="text-white/80 text-sm mt-0.5">
            Revenue trends, customer segments, product mix, and growth forecasting
          </p>
        </div>
      </div>

      <div className="px-4 md:px-6 space-y-6 pb-6">
        {/* Tabs */}
        <Tabs defaultValue="revenue" className="space-y-5">
          <TabsList className="bg-muted/50 h-9">
            <TabsTrigger value="revenue" className="text-xs gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              Revenue
            </TabsTrigger>
            <TabsTrigger value="segments" className="text-xs gap-1.5">
              <PieChartIcon className="h-3.5 w-3.5" />
              Segments
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
              {/* Product mix pie chart */}
              <Card className="border-border/50 py-0">
                <CardHeader className="pb-2 pt-4 px-5">
                  <CardTitle className="text-sm font-display font-semibold">Product Mix</CardTitle>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Revenue share by bagel type</p>
                </CardHeader>
                <CardContent className="px-2 pb-4">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={products}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="monthlyRevenue"
                        nameKey="name"
                        stroke="none"
                      >
                        {products.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          fontSize: 12,
                          fontFamily: "'IBM Plex Mono', monospace",
                          borderRadius: 6,
                          border: "1px solid #e5e5e5",
                        }}
                        formatter={(value: number) => [formatCurrency(value), "Monthly Revenue"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
                    {products.map((item, i) => (
                      <div key={item.name} className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                        <span className="text-[10px] text-muted-foreground">{item.name} ({item.sharePercent}%)</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Product pricing table */}
              <Card className="border-border/50 py-0">
                <CardHeader className="pb-2 pt-4 px-5">
                  <CardTitle className="text-sm font-display font-semibold">Product Details</CardTitle>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Pricing and volume breakdown</p>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-t border-b border-border/60">
                        <th className="text-left py-2.5 px-5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Product</th>
                        <th className="text-right py-2.5 px-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Price/Dz</th>
                        <th className="text-right py-2.5 px-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Dz/Week</th>
                        <th className="text-right py-2.5 px-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Revenue/Mo</th>
                        <th className="text-right py-2.5 px-5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p, i) => (
                        <tr key={p.name} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 px-5">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i] }} />
                              <span className="font-medium">{p.name}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-data">{formatCurrency(p.pricePerDozen)}</td>
                          <td className="py-2.5 px-3 text-right font-data">{p.weeklyDozens} dz</td>
                          <td className="py-2.5 px-3 text-right font-data font-medium">{formatCurrency(p.monthlyRevenue)}</td>
                          <td className="py-2.5 px-5 text-right font-data">{p.sharePercent}%</td>
                        </tr>
                      ))}
                      <tr className="bg-muted/30 font-medium">
                        <td className="py-2.5 px-5">Total</td>
                        <td className="py-2.5 px-3 text-right font-data">—</td>
                        <td className="py-2.5 px-3 text-right font-data">{products.reduce((s, p) => s + p.weeklyDozens, 0)} dz</td>
                        <td className="py-2.5 px-3 text-right font-data">{formatCurrency(products.reduce((s, p) => s + p.monthlyRevenue, 0))}</td>
                        <td className="py-2.5 px-5 text-right font-data">100%</td>
                      </tr>
                    </tbody>
                  </table>
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
                        <th className="text-right py-2.5 px-5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Dozens</th>
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
                            <td className={`py-2.5 px-3 text-right font-data ${positive ? "text-amber-800" : "text-red-600"}`}>
                              {positive ? "+" : ""}{formatCurrency(variance)}
                            </td>
                            <td className="py-2.5 px-5 text-right font-data">{m.dozensDelivered.toLocaleString()} dz</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Segments Tab */}
          <TabsContent value="segments" className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Segment pie chart */}
              <Card className="border-border/50 py-0">
                <CardHeader className="pb-2 pt-4 px-5">
                  <CardTitle className="text-sm font-display font-semibold">Revenue by Customer Segment</CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={customerSegments}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={110}
                        paddingAngle={2}
                        dataKey="revenue"
                        nameKey="segment"
                        stroke="none"
                      >
                        {customerSegments.map((_, index) => (
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
                        formatter={(value: number) => [formatCurrency(value), "Revenue/Mo"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
                    {customerSegments.map((item, i) => (
                      <div key={item.segment} className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-[10px] text-muted-foreground">{item.segment}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Segment table */}
              <Card className="border-border/50 py-0">
                <CardHeader className="pb-2 pt-4 px-5">
                  <CardTitle className="text-sm font-display font-semibold">Segment Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-t border-b border-border/60">
                        <th className="text-left py-2.5 px-5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Segment</th>
                        <th className="text-right py-2.5 px-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Accounts</th>
                        <th className="text-right py-2.5 px-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Revenue/Mo</th>
                        <th className="text-right py-2.5 px-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Dz/Week</th>
                        <th className="text-right py-2.5 px-5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerSegments.map((item, i) => (
                        <tr key={item.segment} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 px-5">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                              <span className="font-medium">{item.segment}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-data">{item.accounts}</td>
                          <td className="py-2.5 px-3 text-right font-data">{formatCurrency(item.revenue)}</td>
                          <td className="py-2.5 px-3 text-right font-data">{item.dozensPerWeek} dz</td>
                          <td className="py-2.5 px-5 text-right font-data">{item.share}%</td>
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
                  <CardTitle className="text-sm font-display font-semibold">Leads by Source</CardTitle>
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
                      />
                      <YAxis
                        dataKey="source"
                        type="category"
                        tick={{ fontSize: 10, fill: "#44403C" }}
                        tickLine={false}
                        axisLine={false}
                        width={130}
                      />
                      <Tooltip
                        contentStyle={{
                          fontSize: 12,
                          fontFamily: "'IBM Plex Mono', monospace",
                          borderRadius: 6,
                          border: "1px solid #e5e5e5",
                        }}
                      />
                      <Bar dataKey="leads" fill={AMBER} radius={[0, 4, 4, 0]} barSize={16} name="Total Leads" />
                      <Bar dataKey="converted" fill={WARM_BROWN} radius={[0, 4, 4, 0]} barSize={16} name="Converted" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Source conversion rates */}
              <Card className="border-border/50 py-0">
                <CardHeader className="pb-2 pt-4 px-5">
                  <CardTitle className="text-sm font-display font-semibold">Source Conversion Rates</CardTitle>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Lead to signed account conversion</p>
                </CardHeader>
                <CardContent className="px-5 pb-4">
                  <div className="space-y-4 mt-2">
                    {[...leadSources]
                      .sort((a, b) => b.rate - a.rate)
                      .map((source) => (
                        <div key={source.source}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-medium">{source.source}</span>
                            <div className="flex items-center gap-3">
                              <span className="font-data text-[11px] text-muted-foreground">
                                {source.converted}/{source.leads}
                              </span>
                              <Badge
                                variant="secondary"
                                className={`text-[10px] h-4 font-data ${
                                  source.rate > 40
                                    ? "bg-amber-100 text-amber-800"
                                    : source.rate > 25
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-stone-50 text-stone-600"
                                }`}
                              >
                                {source.rate.toFixed(1)}%
                              </Badge>
                            </div>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${source.rate}%`,
                                backgroundColor:
                                  source.rate > 40 ? WARM_BROWN : source.rate > 25 ? AMBER : SLATE,
                              }}
                            />
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
                      12-month history with 3-month projection based on growth trend
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
                        <stop offset="5%" stopColor={AMBER_LIGHT} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={AMBER_LIGHT} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="revenueGrad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={AMBER} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={AMBER} stopOpacity={0} />
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
                      stroke={AMBER}
                      strokeWidth={2}
                      fill="url(#revenueGrad2)"
                      dot={{ r: 2.5, fill: AMBER, strokeWidth: 0 }}
                      connectNulls={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="forecast"
                      stroke={AMBER_LIGHT}
                      strokeWidth={2}
                      strokeDasharray="6 3"
                      fill="url(#forecastGrad)"
                      dot={{ r: 3, fill: AMBER_LIGHT, strokeWidth: 2, stroke: "#fff" }}
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
                .filter((d) => d.type === "forecast")
                .map((d) => (
                  <Card key={d.month} className="border-border/50 border-dashed py-0">
                    <CardContent className="p-4">
                      <div className="text-[11px] text-muted-foreground mb-1">{d.month}</div>
                      <div className="font-data text-lg font-semibold text-amber-700">
                        {formatCurrency(d.revenue)}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        Target: {formatCurrency(d.target)} · {d.dozensDelivered.toLocaleString()} dz projected
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
    </div>
  );
}
