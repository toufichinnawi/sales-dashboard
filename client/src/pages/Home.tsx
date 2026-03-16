/**
 * Home / Overview — Hinnawi Bros Bagels Wholesale Dashboard
 * Live KPI cards from database, revenue chart, pipeline overview, activity feed, top accounts
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
  RefreshCw,
  Repeat,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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
import { trpc } from "@/lib/trpc";
import {
  kpiData as demoKpiData,
  monthlyRevenue as demoMonthlyRevenue,
  pipelineStages as demoPipelineStages,
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
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery(undefined, {
    refetchInterval: 30000, // refresh every 30s
  });
  const { data: customerList } = trpc.customers.list.useQuery();

  // Build a customer name lookup
  const customerMap = useMemo(() => {
    const map = new Map<number, string>();
    if (customerList) {
      for (const c of customerList) {
        map.set(c.id, c.businessName);
      }
    }
    return map;
  }, [customerList]);

  // Use live data if available, otherwise fall back to demo
  const hasLiveData = !!stats && (stats.kpis.totalOrders > 0 || stats.kpis.activeAccounts > 0);

  const kpis = hasLiveData ? stats.kpis : null;
  const activeAccountCount = kpis?.activeAccounts ?? demoKpiData.activeAccounts;

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
            Hinnawi Bros Bagels · Montreal · {activeAccountCount} active accounts
          </p>
        </div>
        {hasLiveData && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-green-600/80 text-white text-[10px] border-0">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-300 mr-1 animate-pulse" />
              Live Data
            </Badge>
          </div>
        )}
      </div>

      <div className="px-4 md:px-6 space-y-6 pb-6">
        {/* KPI Ticker Row */}
        <KPITicker stats={stats} isLoading={isLoading} hasLiveData={hasLiveData} />

        {/* Main grid: 2/3 charts + 1/3 activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Charts */}
          <div className="lg:col-span-2 space-y-5">
            <RevenueChart stats={stats} hasLiveData={hasLiveData} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <PipelineFunnel stats={stats} hasLiveData={hasLiveData} />
              <WeeklyActivity />
            </div>
          </div>

          {/* Right: Activity Feed + Top Accounts */}
          <div className="space-y-5">
            <LiveActivityFeed stats={stats} customerMap={customerMap} hasLiveData={hasLiveData} />
            <TopAccounts stats={stats} customerMap={customerMap} hasLiveData={hasLiveData} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── KPI Ticker ──────────────────────────────────────────────────────────────

function KPITicker({ stats, isLoading, hasLiveData }: { stats: any; isLoading: boolean; hasLiveData: boolean }) {
  const kpis = useMemo(() => {
    if (hasLiveData && stats) {
      return [
        {
          label: "Monthly Revenue",
          value: formatCurrency(stats.kpis.monthlyRevenue),
          change: stats.kpis.revenueChange,
          icon: DollarSign,
        },
        {
          label: "Dozens / Week",
          value: `${stats.kpis.weeklyDozens} dz`,
          change: 0,
          icon: Package,
        },
        {
          label: "Active Accounts",
          value: String(stats.kpis.activeAccounts),
          change: 0,
          icon: Users,
        },
        {
          label: "Avg Order",
          value: formatCurrency(stats.kpis.avgOrderSize),
          change: stats.kpis.avgOrderChange,
          icon: ShoppingBag,
        },
        {
          label: "Pipeline Value",
          value: formatCurrency(stats.kpis.pipelineValue),
          change: 0,
          icon: TrendingUp,
        },
        {
          label: "Standing Orders",
          value: String(stats.kpis.activeRecurring),
          change: 0,
          icon: Repeat,
        },
      ];
    }
    return [
      {
        label: "Monthly Revenue",
        value: formatCurrency(demoKpiData.monthlyRevenue),
        change: demoKpiData.revenueChange,
        icon: DollarSign,
      },
      {
        label: "Dozens / Week",
        value: `${demoKpiData.weeklyDozens} dz`,
        change: demoKpiData.dozensChange,
        icon: Package,
      },
      {
        label: "Active Accounts",
        value: String(demoKpiData.activeAccounts),
        change: demoKpiData.accountsChange,
        icon: Users,
      },
      {
        label: "Avg Order / Mo",
        value: formatCurrency(demoKpiData.avgOrderSize),
        change: demoKpiData.avgOrderChange,
        icon: ShoppingBag,
      },
      {
        label: "Pipeline Value",
        value: formatCurrency(demoKpiData.pipelineValue),
        change: demoKpiData.pipelineChange,
        icon: TrendingUp,
      },
      {
        label: "Conversion Rate",
        value: `${demoKpiData.conversionRate}%`,
        change: demoKpiData.conversionChange,
        icon: Percent,
      },
    ];
  }, [stats, hasLiveData]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="border-border/50 py-0">
            <CardContent className="p-3.5">
              <Skeleton className="h-3 w-8 mb-2" />
              <Skeleton className="h-6 w-20 mb-1" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

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
              {kpi.change !== 0 && <ChangeIndicator value={kpi.change} />}
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

function RevenueChart({ stats, hasLiveData }: { stats: any; hasLiveData: boolean }) {
  const chartData = useMemo(() => {
    if (hasLiveData && stats?.monthlyRevenue?.length > 0) {
      return stats.monthlyRevenue.map((r: any) => ({
        month: r.month,
        revenue: r.revenue,
        orders: r.orderCount,
      }));
    }
    return demoMonthlyRevenue.map((r) => ({
      month: r.month,
      revenue: r.revenue,
      target: r.target,
    }));
  }, [stats, hasLiveData]);

  const hasTarget = !hasLiveData;

  return (
    <Card className="border-border/50 py-0">
      <CardHeader className="pb-2 pt-4 px-5">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-display font-semibold">
              {hasLiveData ? "Monthly Revenue" : "Monthly Revenue vs Target"}
            </CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {hasLiveData ? "From actual orders (delivered & paid)" : "12-month wholesale growth trajectory"}
            </p>
          </div>
          {hasLiveData ? (
            <Badge className="bg-green-600/80 text-white text-[10px] border-0 h-5">Live</Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px] font-data h-5">
              Apr 2025 – Mar 2026
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-4">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
              tickFormatter={(v) => {
                if (v.match(/^\d{4}-\d{2}$/)) {
                  const [y, m] = v.split("-");
                  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                  return months[parseInt(m) - 1] || v;
                }
                return v.split(" ")[0].slice(0, 3);
              }}
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
                name === "revenue" ? "Revenue" : name === "target" ? "Target" : name,
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
            {hasTarget && (
              <Area
                type="monotone"
                dataKey="target"
                stroke={SLATE}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="none"
                dot={false}
              />
            )}
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

function PipelineFunnel({ stats, hasLiveData }: { stats: any; hasLiveData: boolean }) {
  const colors = [SLATE, "#D4A574", AMBER_LIGHT, AMBER, WARM_BROWN];

  const data = useMemo(() => {
    if (hasLiveData && stats?.leadsByStatus?.length > 0) {
      const statusLabels: Record<string, string> = {
        new: "New Leads",
        contacted: "Contacted",
        qualified: "Qualified",
        converted: "Converted",
        lost: "Lost",
      };
      return stats.leadsByStatus.map((l: any) => ({
        stage: statusLabels[l.status] || l.status,
        count: l.count,
      }));
    }
    return demoPipelineStages;
  }, [stats, hasLiveData]);

  return (
    <Card className="border-border/50 py-0">
      <CardHeader className="pb-2 pt-4 px-5">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-display font-semibold">Sales Pipeline</CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {hasLiveData ? "Leads by status" : "Accounts by stage"}
            </p>
          </div>
          {hasLiveData && (
            <Badge className="bg-green-600/80 text-white text-[10px] border-0 h-5">Live</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-4">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={data}
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
              formatter={(value: number) => [value, hasLiveData ? "Leads" : "Accounts"]}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={18}>
              {data.map((_: any, index: number) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
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

// ─── Live Activity Feed ─────────────────────────────────────────────────────

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

const orderStatusIcons: Record<string, { icon: React.ElementType; color: string }> = {
  pending: { icon: FileText, color: "text-stone-500 bg-stone-50" },
  confirmed: { icon: Trophy, color: "text-blue-600 bg-blue-50" },
  preparing: { icon: UtensilsCrossed, color: "text-amber-600 bg-amber-50" },
  delivered: { icon: Send, color: "text-green-600 bg-green-50" },
  paid: { icon: DollarSign, color: "text-green-700 bg-green-50" },
  cancelled: { icon: XCircle, color: "text-red-500 bg-red-50" },
};

function LiveActivityFeed({ stats, customerMap, hasLiveData }: { stats: any; customerMap: Map<number, string>; hasLiveData: boolean }) {
  if (hasLiveData && stats?.recentOrders?.length > 0) {
    return (
      <Card className="border-border/50 py-0">
        <CardHeader className="pb-2 pt-4 px-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-display font-semibold">Recent Orders</CardTitle>
            <Badge className="bg-green-600/80 text-white text-[10px] border-0 h-5">Live</Badge>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="space-y-0">
            {stats.recentOrders.slice(0, 8).map((order: any, i: number) => {
              const statusInfo = orderStatusIcons[order.status] || orderStatusIcons.pending;
              const Icon = statusInfo.icon;
              const customerName = customerMap.get(order.customerId) || `Customer #${order.customerId}`;
              return (
                <div key={order.id}>
                  <div className="flex gap-2.5 py-2.5">
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${statusInfo.color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-snug line-clamp-2">
                        <span className="font-medium">{order.orderNumber}</span> — {customerName}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge variant="outline" className="text-[9px] h-4 px-1.5 capitalize">{order.status}</Badge>
                        <span className="text-[10px] text-muted-foreground/40">·</span>
                        <span className="font-data text-[10px] text-muted-foreground">${order.total}</span>
                        <span className="text-[10px] text-muted-foreground/40">·</span>
                        <span className="text-[10px] text-muted-foreground">{timeAgo(order.createdAt)}</span>
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

  // Fallback to demo activity
  return (
    <Card className="border-border/50 py-0">
      <CardHeader className="pb-2 pt-4 px-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-display font-semibold">Recent Activity</CardTitle>
          <Badge variant="secondary" className="text-[10px] h-5">Demo</Badge>
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

function TopAccounts({ stats, customerMap, hasLiveData }: { stats: any; customerMap: Map<number, string>; hasLiveData: boolean }) {
  if (hasLiveData && stats?.topCustomers?.length > 0) {
    return (
      <Card className="border-border/50 py-0">
        <CardHeader className="pb-2 pt-4 px-5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-display font-semibold">Top Accounts</CardTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">By total revenue</p>
            </div>
            <Badge className="bg-green-600/80 text-white text-[10px] border-0 h-5">Live</Badge>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="space-y-0">
            {stats.topCustomers.map((tc: any, i: number) => {
              const name = customerMap.get(tc.customerId) || `Customer #${tc.customerId}`;
              return (
                <div key={tc.customerId}>
                  <div className="flex items-center justify-between py-2.5">
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{name}</p>
                      <p className="text-[10px] text-muted-foreground">{tc.orderCount} orders</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="font-data text-xs font-medium">{formatCurrency(tc.totalRevenue)}</p>
                    </div>
                  </div>
                  {i < stats.topCustomers.length - 1 && <Separator className="opacity-50" />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Fallback to demo
  const topAccounts = deals
    .filter((d) => d.stage === "signed")
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

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
