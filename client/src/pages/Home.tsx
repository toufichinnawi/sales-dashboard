/**
 * Home / Overview — Hinnawi Bros Bagels Wholesale Dashboard
 * KPI cards, revenue chart, pipeline overview, activity feed, top accounts
 */

import { useMemo } from "react";
import {
  DollarSign,
  TrendingUp,
  Users,
  ShoppingBag,
  Package,
  Percent,
  Phone,
  Mail,
  Calendar,
  FileText,
  Trophy,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Send,
  UtensilsCrossed,
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

const AMBER = "#B45309";
const AMBER_LIGHT = "#D97706";
const WARM_BROWN = "#92400E";
const SLATE = "#78716C";

const HERO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663391168179/X4Qkp2kKx9JEdEZTkB9mBy/hinnawi-hero-banner-jQuk3nq5Y7HgaMHmi3Jmtv.webp";

export default function Home() {
  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative h-36 md:h-44 overflow-hidden">
        <img
          src={HERO_IMG}
          alt="Hinnawi Bros Bagels"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        <div className="absolute bottom-4 left-6">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-white tracking-tight">
            Wholesale Dashboard
          </h1>
          <p className="text-white/80 text-sm mt-0.5">
            Hinnawi Bros Bagels · Montreal · {kpiData.activeAccounts} active accounts
          </p>
        </div>
      </div>

      <div className="px-4 md:px-6 space-y-6 pb-6">
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

          {/* Right: Activity Feed + Top Accounts */}
          <div className="space-y-5">
            <ActivityFeed />
            <TopAccounts />
          </div>
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
        label: "Monthly Revenue",
        value: formatCurrency(kpiData.monthlyRevenue),
        change: kpiData.revenueChange,
        icon: DollarSign,
      },
      {
        label: "Dozens / Week",
        value: `${kpiData.weeklyDozens} dz`,
        change: kpiData.dozensChange,
        icon: Package,
      },
      {
        label: "Active Accounts",
        value: String(kpiData.activeAccounts),
        change: kpiData.accountsChange,
        icon: Users,
      },
      {
        label: "Avg Order / Mo",
        value: formatCurrency(kpiData.avgOrderSize),
        change: kpiData.avgOrderChange,
        icon: ShoppingBag,
      },
      {
        label: "Pipeline Value",
        value: formatCurrency(kpiData.pipelineValue),
        change: kpiData.pipelineChange,
        icon: TrendingUp,
      },
      {
        label: "Conversion Rate",
        value: `${kpiData.conversionRate}%`,
        change: kpiData.conversionChange,
        icon: Percent,
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
            <p className="text-[11px] text-muted-foreground mt-0.5">12-month wholesale growth trajectory</p>
          </div>
          <Badge variant="secondary" className="text-[10px] font-data h-5">
            Apr 2025 – Mar 2026
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-4">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={monthlyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
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
              stroke={AMBER}
              strokeWidth={2}
              fill="url(#revenueGrad)"
              dot={{ r: 2.5, fill: AMBER, strokeWidth: 0 }}
              activeDot={{ r: 4, fill: AMBER, strokeWidth: 2, stroke: "#fff" }}
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
  const colors = [SLATE, "#D4A574", AMBER_LIGHT, AMBER, WARM_BROWN];

  return (
    <Card className="border-border/50 py-0">
      <CardHeader className="pb-2 pt-4 px-5">
        <CardTitle className="text-sm font-display font-semibold">Sales Pipeline</CardTitle>
        <p className="text-[11px] text-muted-foreground mt-0.5">Accounts by stage</p>
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
              tick={{ fontSize: 11, fill: "#44403C" }}
              tickLine={false}
              axisLine={false}
              width={95}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                fontFamily: "'IBM Plex Mono', monospace",
                borderRadius: 6,
                border: "1px solid #e5e5e5",
              }}
              formatter={(value: number) => [value, "Accounts"]}
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
        <p className="text-[11px] text-muted-foreground mt-0.5">Outreach & deliveries this week</p>
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
            <Bar dataKey="calls" fill={WARM_BROWN} radius={[3, 3, 0, 0]} barSize={8} name="Calls" />
            <Bar dataKey="emails" fill={AMBER} radius={[3, 3, 0, 0]} barSize={8} name="Emails" />
            <Bar dataKey="tastings" fill={AMBER_LIGHT} radius={[3, 3, 0, 0]} barSize={8} name="Tastings" />
            <Bar dataKey="deliveries" fill="#D4A574" radius={[3, 3, 0, 0]} barSize={8} name="Deliveries" />
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
  sample_sent: Send,
  tasting: UtensilsCrossed,
};

const activityColors: Record<Activity["type"], string> = {
  call: "text-sky-600 bg-sky-50",
  email: "text-stone-600 bg-stone-50",
  meeting: "text-violet-600 bg-violet-50",
  note: "text-stone-500 bg-stone-50",
  deal_won: "text-amber-700 bg-amber-50",
  deal_lost: "text-red-500 bg-red-50",
  sample_sent: "text-orange-600 bg-orange-50",
  tasting: "text-amber-600 bg-amber-50",
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

// ─── Top Accounts ───────────────────────────────────────────────────────────

function TopAccounts() {
  const topAccounts = useMemo(() => {
    return deals
      .filter((d) => d.stage === "signed")
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, []);

  return (
    <Card className="border-border/50 py-0">
      <CardHeader className="pb-2 pt-4 px-5">
        <CardTitle className="text-sm font-display font-semibold">Top Accounts</CardTitle>
        <p className="text-[11px] text-muted-foreground mt-0.5">By monthly revenue</p>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <div className="space-y-0">
          {topAccounts.map((deal, i) => (
            <div key={deal.id}>
              <div className="flex items-center justify-between py-2.5">
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{deal.company}</p>
                  <p className="text-[10px] text-muted-foreground">{deal.dozenPerWeek} dz/week · {deal.segment}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="font-data text-xs font-medium">{formatCurrency(deal.value)}/mo</p>
                  <p className="text-[10px] text-muted-foreground">{deal.products.join(", ")}</p>
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
    <div className={`flex items-center gap-0.5 ${positive ? "text-amber-800" : "text-red-600"}`}>
      {positive ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      <span className="font-data text-[10px] font-medium">{formatPercent(value)}</span>
    </div>
  );
}
