/**
 * Home / Overview — "Ink & Data" Editorial Dashboard
 * KPI ticker, revenue chart, pipeline funnel, activity feed
 * Asymmetric layout: left 2/3 charts, right 1/3 activity
 */

import { useMemo } from "react";
import {
  DollarSign,
  TrendingUp,
  Target,
  Handshake,
  Clock,
  Users,
  Phone,
  Mail,
  Calendar,
  FileText,
  Trophy,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import {
  kpiData,
  monthlyRevenue,
  pipelineStages,
  recentActivities,
  weeklyPerformance,
  deals,
  formatCurrency,
  formatPercent,
  timeAgo,
  type Activity,
} from "@/lib/data";

const TEAL = "#0D7377";
const TEAL_LIGHT = "#14919B";
const AMBER = "#C4841D";
const SLATE = "#64748B";

export default function Home() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* KPI Ticker Row */}
      <KPITicker />

      {/* Main grid: 2/3 charts + 1/3 activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Charts */}
        <div className="lg:col-span-2 space-y-5">
          <RevenueChart />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <PipelineFunnel />
            <WeeklyActivity />
          </div>
        </div>

        {/* Right: Activity Feed */}
        <div className="space-y-5">
          <ActivityFeed />
          <TopDeals />
        </div>
      </div>
    </div>
  );
}

// ─── KPI Ticker ──────────────────────────────────────────────────────────────

function KPITicker() {
  const kpis = useMemo(
    () => [
      {
        label: "Total Revenue",
        value: formatCurrency(kpiData.totalRevenue),
        change: kpiData.revenueChange,
        icon: DollarSign,
      },
      {
        label: "MRR",
        value: formatCurrency(kpiData.monthlyRecurring),
        change: kpiData.mrrChange,
        icon: TrendingUp,
      },
      {
        label: "Pipeline Value",
        value: formatCurrency(kpiData.pipelineValue),
        change: kpiData.pipelineChange,
        icon: Target,
      },
      {
        label: "Win Rate",
        value: `${kpiData.winRate}%`,
        change: kpiData.winRateChange,
        icon: Handshake,
      },
      {
        label: "Avg Deal Size",
        value: formatCurrency(kpiData.avgDealSize),
        change: kpiData.avgDealChange,
        icon: DollarSign,
      },
      {
        label: "Avg Sales Cycle",
        value: `${kpiData.avgSalesCycle} days`,
        change: kpiData.cycleChange,
        icon: Clock,
      },
    ],
    []
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map((kpi, i) => (
        <Card
          key={kpi.label}
          className="animate-cascade border-border/50 hover:border-border transition-colors py-0"
          style={{ animationDelay: `${i * 80}ms`, opacity: 0 }}
        >
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between mb-2">
              <kpi.icon className="h-3.5 w-3.5 text-muted-foreground" />
              <ChangeIndicator value={kpi.change} />
            </div>
            <div className="font-data text-lg font-semibold tracking-tight leading-none mb-1">
              {kpi.value}
            </div>
            <div className="text-[11px] text-muted-foreground">{kpi.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Revenue Chart ───────────────────────────────────────────────────────────

function RevenueChart() {
  return (
    <Card className="border-border/50 py-0">
      <CardHeader className="pb-2 pt-4 px-5">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-display font-semibold">Monthly Revenue vs Target</CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">Last 12 months performance</p>
          </div>
          <Badge variant="secondary" className="text-[10px] font-data h-5">
            FY 2025–26
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-4">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={monthlyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
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
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                name === "revenue" ? "Revenue" : "Target",
              ]}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke={TEAL}
              strokeWidth={2}
              fill="url(#revenueGrad)"
              dot={{ r: 2.5, fill: TEAL, strokeWidth: 0 }}
              activeDot={{ r: 4, fill: TEAL, strokeWidth: 2, stroke: "#fff" }}
            />
            <Area
              type="monotone"
              dataKey="target"
              stroke={SLATE}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fill="none"
              dot={false}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="line"
              wrapperStyle={{ fontSize: 11, paddingBottom: 8 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── Pipeline Funnel ─────────────────────────────────────────────────────────

function PipelineFunnel() {
  const colors = [SLATE, "#4B9CD3", AMBER, TEAL_LIGHT, TEAL];

  return (
    <Card className="border-border/50 py-0">
      <CardHeader className="pb-2 pt-4 px-5">
        <CardTitle className="text-sm font-display font-semibold">Pipeline Funnel</CardTitle>
        <p className="text-[11px] text-muted-foreground mt-0.5">Deals by stage</p>
      </CardHeader>
      <CardContent className="px-2 pb-4">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={pipelineStages}
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
              dataKey="stage"
              type="category"
              tick={{ fontSize: 11, fill: "#1A1A1A" }}
              tickLine={false}
              axisLine={false}
              width={80}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                fontFamily: "'IBM Plex Mono', monospace",
                borderRadius: 6,
                border: "1px solid #e5e5e5",
              }}
              formatter={(value: number) => [value, "Deals"]}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={18}>
              {pipelineStages.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── Weekly Activity ─────────────────────────────────────────────────────────

function WeeklyActivity() {
  return (
    <Card className="border-border/50 py-0">
      <CardHeader className="pb-2 pt-4 px-5">
        <CardTitle className="text-sm font-display font-semibold">Weekly Activity</CardTitle>
        <p className="text-[11px] text-muted-foreground mt-0.5">This week's outreach</p>
      </CardHeader>
      <CardContent className="px-2 pb-4">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={weeklyPerformance} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: SLATE }}
              tickLine={false}
              axisLine={{ stroke: "#e5e5e5" }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: SLATE, fontFamily: "'IBM Plex Mono', monospace" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                fontFamily: "'IBM Plex Mono', monospace",
                borderRadius: 6,
                border: "1px solid #e5e5e5",
              }}
            />
            <Bar dataKey="calls" fill={TEAL} radius={[3, 3, 0, 0]} barSize={10} name="Calls" />
            <Bar dataKey="emails" fill={TEAL_LIGHT} radius={[3, 3, 0, 0]} barSize={10} name="Emails" />
            <Bar dataKey="meetings" fill={AMBER} radius={[3, 3, 0, 0]} barSize={10} name="Meetings" />
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
  );
}

// ─── Activity Feed ───────────────────────────────────────────────────────────

const activityIcons: Record<Activity["type"], React.ElementType> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note: FileText,
  deal_won: Trophy,
  deal_lost: XCircle,
};

const activityColors: Record<Activity["type"], string> = {
  call: "text-sky-600 bg-sky-50",
  email: "text-slate-600 bg-slate-50",
  meeting: "text-violet-600 bg-violet-50",
  note: "text-slate-500 bg-slate-50",
  deal_won: "text-emerald-600 bg-emerald-50",
  deal_lost: "text-red-500 bg-red-50",
};

function ActivityFeed() {
  return (
    <Card className="border-border/50 py-0">
      <CardHeader className="pb-2 pt-4 px-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-display font-semibold">Recent Activity</CardTitle>
          <Badge variant="secondary" className="text-[10px] h-5">Live</Badge>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <div className="space-y-0">
          {recentActivities.slice(0, 8).map((activity, i) => {
            const Icon = activityIcons[activity.type];
            const colorClass = activityColors[activity.type];
            return (
              <div key={activity.id}>
                <div className="flex gap-2.5 py-2.5">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${colorClass}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-snug line-clamp-2">{activity.description}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] text-muted-foreground">{activity.rep}</span>
                      <span className="text-[10px] text-muted-foreground/40">·</span>
                      <span className="text-[10px] text-muted-foreground">{timeAgo(activity.timestamp)}</span>
                    </div>
                  </div>
                </div>
                {i < 7 && <Separator className="opacity-50" />}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Top Deals ───────────────────────────────────────────────────────────────

function TopDeals() {
  const topDeals = useMemo(() => {
    return deals
      .filter((d) => d.stage !== "closed_won" && d.stage !== "closed_lost")
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, []);

  return (
    <Card className="border-border/50 py-0">
      <CardHeader className="pb-2 pt-4 px-5">
        <CardTitle className="text-sm font-display font-semibold">Top Open Deals</CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <div className="space-y-0">
          {topDeals.map((deal, i) => (
            <div key={deal.id}>
              <div className="flex items-center justify-between py-2.5">
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{deal.company}</p>
                  <p className="text-[10px] text-muted-foreground">{deal.contact}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="font-data text-xs font-medium">{formatCurrency(deal.value)}</p>
                  <p className="text-[10px] text-muted-foreground">{deal.probability}% prob</p>
                </div>
              </div>
              {i < 4 && <Separator className="opacity-50" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Change Indicator ────────────────────────────────────────────────────────

function ChangeIndicator({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <div className={`flex items-center gap-0.5 ${positive ? "text-teal-700" : "text-red-600"}`}>
      {positive ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      <span className="font-data text-[10px] font-medium">{formatPercent(value)}</span>
    </div>
  );
}
