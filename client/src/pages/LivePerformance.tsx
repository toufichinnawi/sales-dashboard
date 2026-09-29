import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  Clock3,
  DollarSign,
  Expand,
  Gauge,
  Loader2,
  Package,
  RefreshCw,
  ShoppingBag,
  Target,
  Users,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Comparison = {
  current: number;
  previous: number;
  difference: number;
  percentChange: number | null;
};

const TORONTO = "America/Toronto";
const numberFormatter = new Intl.NumberFormat("en-CA", { maximumFractionDigits: 0 });
const decimalFormatter = new Intl.NumberFormat("en-CA", { maximumFractionDigits: 1 });
const currencyFormatter = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  currencyDisplay: "narrowSymbol",
  maximumFractionDigits: 0,
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatSignedCurrency(value: number) {
  if (value === 0) return formatCurrency(value);
  return `${value > 0 ? "+" : "−"}${formatCurrency(Math.abs(value))}`;
}

function formatSignedNumber(value: number, suffix = "") {
  if (value === 0) return `${numberFormatter.format(value)}${suffix}`;
  return `${value > 0 ? "+" : "−"}${numberFormatter.format(Math.abs(value))}${suffix}`;
}

function formatQuantity(value: number) {
  return decimalFormatter.format(value);
}

function relativeTone(comparison: Comparison) {
  if (comparison.difference > 0) return "positive";
  if (comparison.difference < 0) return "negative";
  return "neutral";
}

function ComparisonPill({ comparison, inverse = false }: { comparison: Comparison; inverse?: boolean }) {
  const rawTone = relativeTone(comparison);
  const tone = inverse && rawTone !== "neutral"
    ? rawTone === "positive" ? "negative" : "positive"
    : rawTone;
  const Icon = comparison.difference > 0 ? ArrowUpRight : comparison.difference < 0 ? ArrowDownRight : null;

  if (comparison.percentChange === null) {
    return <span className="text-[11px] text-muted-foreground">No prior baseline</span>;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-data text-[10px] font-semibold",
        tone === "positive" && "bg-emerald-100 text-emerald-700",
        tone === "negative" && "bg-rose-100 text-rose-700",
        tone === "neutral" && "bg-muted text-muted-foreground"
      )}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {comparison.percentChange > 0 ? "+" : ""}{comparison.percentChange.toFixed(1)}%
    </span>
  );
}

function MetricCard({
  label,
  comparison,
  kind,
  icon: Icon,
  compact = false,
}: {
  label: string;
  comparison: Comparison;
  kind: "currency" | "number" | "dozens";
  icon: React.ElementType;
  compact?: boolean;
}) {
  const current = kind === "currency"
    ? formatCurrency(comparison.current)
    : kind === "dozens"
      ? `${formatQuantity(comparison.current)} dz`
      : numberFormatter.format(comparison.current);
  const previous = kind === "currency"
    ? formatCurrency(comparison.previous)
    : kind === "dozens"
      ? `${formatQuantity(comparison.previous)} dz`
      : numberFormatter.format(comparison.previous);
  const difference = kind === "currency"
    ? formatSignedCurrency(comparison.difference)
    : kind === "dozens"
      ? formatSignedNumber(comparison.difference, " dz")
      : formatSignedNumber(comparison.difference);
  const rawTone = relativeTone(comparison);

  return (
    <Card className={cn("border-border/60 py-0 shadow-sm", compact && "min-w-0")}>
      <CardContent className={cn("p-4", compact && "p-3")}> 
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
          </div>
          <ComparisonPill comparison={comparison} />
        </div>
        <p className={cn("font-data text-2xl font-semibold tracking-tight", compact && "text-xl")}>{current}</p>
        <div className="mt-2 flex items-center gap-1.5 text-[11px]">
          <span
            className={cn(
              "font-data font-semibold",
              rawTone === "positive" && "text-emerald-700",
              rawTone === "negative" && "text-rose-700",
              rawTone === "neutral" && "text-muted-foreground"
            )}
          >
            {difference}
          </span>
          <span className="text-muted-foreground">vs {previous}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionLabel({ children, detail }: { children: React.ReactNode; detail?: string }) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 className="font-display text-base font-bold tracking-tight">{children}</h2>
        {detail && <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>}
      </div>
    </div>
  );
}

function chartCurrency(value: number) {
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
  return `$${Math.round(value)}`;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    confirmed: "bg-blue-100 text-blue-700 border-blue-200",
    preparing: "bg-violet-100 text-violet-700 border-violet-200",
    delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
    paid: "bg-green-100 text-green-700 border-green-200",
  };
  return (
    <Badge variant="outline" className={cn("h-5 capitalize text-[10px]", styles[status] ?? "bg-muted text-muted-foreground")}>
      {status}
    </Badge>
  );
}

function quantityLabel(items: Array<{ unit: string; quantity: number }>) {
  if (items.length === 0) return "—";
  return items.map((item) => {
    const unit = item.unit.toLowerCase() === "dozen" ? "dz" : item.unit;
    return `${formatQuantity(item.quantity)} ${unit}`;
  }).join(" · ");
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2 shadow-lg">
      <p className="mb-1 text-[10px] font-medium text-muted-foreground">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.dataKey} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: <span className="font-data font-semibold">{formatCurrency(entry.value)}</span>
        </p>
      ))}
    </div>
  );
}

function LivePerformanceContent({ tvMode, onToggleTv }: { tvMode: boolean; onToggleTv: () => void }) {
  const query = trpc.livePerformance.snapshot.useQuery(undefined, {
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 15_000),
  });
  const { data, isLoading, isFetching, isError, error, refetch, dataUpdatedAt } = query;
  const [manualRefreshing, setManualRefreshing] = useState(false);

  const lastUpdated = useMemo(() => {
    if (!dataUpdatedAt) return null;
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: TORONTO,
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(dataUpdatedAt));
  }, [dataUpdatedAt]);

  const refresh = async () => {
    setManualRefreshing(true);
    try {
      await refetch();
    } finally {
      setManualRefreshing(false);
    }
  };

  if (isLoading && !data) {
    return <LivePerformanceSkeleton tvMode={tvMode} />;
  }

  if (!data) {
    return (
      <div className={cn("flex min-h-[calc(100vh-3rem)] items-center justify-center p-6", tvMode && "min-h-screen bg-[#071324]")}> 
        <Card className="max-w-md border-rose-200">
          <CardContent className="p-7 text-center">
            <WifiOff className="mx-auto mb-3 h-9 w-9 text-rose-500" />
            <h1 className="font-display text-lg font-bold">Live data unavailable</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error?.message ?? "The performance service did not return a snapshot."}</p>
            <Button onClick={refresh} className="mt-5 bg-[#1B2A4A] hover:bg-[#2D4470]">
              <RefreshCw className="mr-2 h-4 w-4" /> Retry connection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const monthMtd = data.month.monthToDate;
  const fullMonth = data.month.comparedWithPreviousFullMonth;
  const target = data.month.target;
  const maxCustomerRevenue = Math.max(...data.topCustomers.map((customer: any) => customer.revenue), 1);

  return (
    <main className={cn(
      "min-h-[calc(100vh-3rem)] bg-[#F8F8F6] px-4 py-5 md:px-6 lg:px-8",
      tvMode && "min-h-screen overflow-auto bg-[#071324] px-6 py-6 text-slate-100 lg:px-10"
    )}>
      <div className={cn("mx-auto max-w-[1600px]", tvMode && "max-w-none")}>
        <header className={cn("mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between", tvMode && "mb-6")}>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg bg-[#1B2A4A] text-white", tvMode && "bg-emerald-500/15 text-emerald-300")}> 
                <Gauge className="h-5 w-5" />
              </div>
              <h1 className={cn("font-display text-2xl font-bold tracking-tight", tvMode && "text-3xl text-white")}>Live Performance</h1>
              <Badge className="border-0 bg-emerald-600 px-2 py-0.5 text-[10px] text-white">
                <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-200 animate-pulse" />
                LIVE
              </Badge>
            </div>
            <p className={cn("mt-2 text-sm text-muted-foreground", tvMode && "text-slate-400")}>
              Toronto time · Recognized revenue = delivered and paid orders · Refreshes every 30 seconds
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className={cn("flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5 text-[11px] text-muted-foreground", tvMode && "border-slate-700 bg-slate-900 text-slate-400")}> 
              {isError ? <WifiOff className="h-3.5 w-3.5 text-rose-500" /> : <Wifi className="h-3.5 w-3.5 text-emerald-500" />}
              {isError ? "Recovering connection…" : lastUpdated ? `Updated ${lastUpdated}` : "Connecting…"}
            </div>
            <Button variant="outline" size="sm" onClick={refresh} disabled={manualRefreshing} className={cn("h-8 text-xs", tvMode && "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800 hover:text-white")}> 
              <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", (manualRefreshing || isFetching) && "animate-spin")} />
              Refresh
            </Button>
            <Button size="sm" onClick={onToggleTv} className={cn("h-8 bg-[#1B2A4A] text-xs hover:bg-[#2D4470]", tvMode && "bg-emerald-500 text-slate-950 hover:bg-emerald-400")}> 
              {tvMode ? <X className="mr-1.5 h-3.5 w-3.5" /> : <Expand className="mr-1.5 h-3.5 w-3.5" />}
              {tvMode ? "Exit TV mode" : "TV mode"}
            </Button>
          </div>
        </header>

        {isError && (
          <div className={cn("mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800", tvMode && "border-amber-400/30 bg-amber-400/10 text-amber-200")}>
            <WifiOff className="h-3.5 w-3.5" />
            Showing the last successful snapshot. Automatic retry is active. {error?.message ? `(${error.message})` : ""}
          </div>
        )}

        <section className="mb-7">
          <SectionLabel detail="Today through the current Toronto time, compared with the same elapsed time yesterday.">Today's performance</SectionLabel>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Recognized revenue" comparison={data.today.revenue} kind="currency" icon={DollarSign} />
            <MetricCard label="Operational orders" comparison={data.today.orders} kind="number" icon={ShoppingBag} />
            <MetricCard label="Verified dozens" comparison={data.today.dozens} kind="dozens" icon={Package} />
            <MetricCard label="Average order value" comparison={data.today.averageOrderValue} kind="currency" icon={Gauge} />
          </div>
        </section>

        <section className="mb-7">
          <SectionLabel detail="Month-to-date compares the same elapsed time in the previous month.">Monthly performance</SectionLabel>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Revenue (MTD)" comparison={monthMtd.revenue} kind="currency" icon={DollarSign} compact />
            <MetricCard label="Orders (MTD)" comparison={monthMtd.orders} kind="number" icon={ShoppingBag} compact />
            <MetricCard label="Verified dozens (MTD)" comparison={monthMtd.dozens} kind="dozens" icon={Package} compact />
            <MetricCard label="Average order value" comparison={monthMtd.averageOrderValue} kind="currency" icon={Gauge} compact />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
            <Card className="border-border/60 py-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground"><Users className="h-3.5 w-3.5" /> Ordering customers</p>
                    <p className="mt-2 font-data text-2xl font-semibold">{numberFormatter.format(data.month.uniqueOrderingCustomers.current)}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{formatSignedNumber(data.month.uniqueOrderingCustomers.difference)} vs {numberFormatter.format(data.month.uniqueOrderingCustomers.previous)} prior MTD</p>
                  </div>
                  <ComparisonPill comparison={data.month.uniqueOrderingCustomers} />
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/60 py-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground"><Users className="h-3.5 w-3.5" /> New customers</p>
                    <p className="mt-2 font-data text-2xl font-semibold">{numberFormatter.format(data.month.newCustomers.current)}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{formatSignedNumber(data.month.newCustomers.difference)} vs {numberFormatter.format(data.month.newCustomers.previous)} prior MTD</p>
                  </div>
                  <ComparisonPill comparison={data.month.newCustomers} />
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/60 py-0">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground"><Target className="h-3.5 w-3.5" /> Revenue target</p>
                  {target.revenueProgress === null ? <span className="text-[11px] text-muted-foreground">Not set</span> : <span className="font-data text-sm font-semibold text-[#1B2A4A]">{target.revenueProgress}%</span>}
                </div>
                {target.revenueProgress === null ? (
                  <p className="mt-3 text-sm text-muted-foreground">No target configured for {data.period.currentMonth}.</p>
                ) : (
                  <>
                    <Progress value={Math.min(target.revenueProgress, 100)} className="h-2.5" />
                    <p className="mt-2 text-[11px] text-muted-foreground">{formatCurrency(monthMtd.revenue.current)} of {formatCurrency(target.targetRevenue!)}</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
          <p className={cn("mt-2 text-[11px] text-muted-foreground", tvMode && "text-slate-500")}>
            Full prior calendar month: {formatCurrency(fullMonth.revenue.previous)} · Current MTD: {formatCurrency(fullMonth.revenue.current)}
          </p>
        </section>

        <section className="mb-7">
          <SectionLabel detail="Revenue uses delivered and paid orders only. Charts compare equivalent business periods.">Visual analytics</SectionLabel>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card className="border-border/60 py-0">
              <CardHeader className="px-5 pb-2 pt-4">
                <CardTitle className="text-sm font-semibold">Today vs yesterday revenue progression</CardTitle>
                <p className="text-[11px] text-muted-foreground">Hourly recognized revenue through the current time</p>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={data.charts.todayProgression} margin={{ top: 10, right: 18, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#64748B" }} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={chartCurrency} tick={{ fontSize: 10, fill: "#64748B" }} tickLine={false} axisLine={false} width={45} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <Line isAnimationActive={false} type="monotone" dataKey="todayRevenue" name="Today" stroke="#1B2A4A" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                    <Line isAnimationActive={false} type="monotone" dataKey="yesterdayRevenue" name="Yesterday" stroke="#94A3B8" strokeWidth={2} strokeDasharray="5 4" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="border-border/60 py-0">
              <CardHeader className="px-5 pb-2 pt-4">
                <CardTitle className="text-sm font-semibold">Daily revenue and orders</CardTitle>
                <p className="text-[11px] text-muted-foreground">Current month recognized revenue by Toronto business day</p>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.charts.dailyRevenue} margin={{ top: 10, right: 18, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748B" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis yAxisId="revenue" tickFormatter={chartCurrency} tick={{ fontSize: 10, fill: "#64748B" }} tickLine={false} axisLine={false} width={45} />
                    <YAxis yAxisId="orders" orientation="right" tick={{ fontSize: 10, fill: "#64748B" }} tickLine={false} axisLine={false} width={28} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <Bar isAnimationActive={false} yAxisId="revenue" dataKey="revenue" name="Revenue" fill="#E5A100" radius={[3, 3, 0, 0]} maxBarSize={24} />
                    <Line isAnimationActive={false} yAxisId="orders" type="monotone" dataKey="orders" name="Orders" stroke="#1B2A4A" strokeWidth={2} dot={false} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="border-border/60 py-0 xl:col-span-2">
              <CardHeader className="px-5 pb-2 pt-4">
                <CardTitle className="text-sm font-semibold">Month-to-date cumulative revenue</CardTitle>
                <p className="text-[11px] text-muted-foreground">Current month against the equivalent dates in the previous month</p>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                <ResponsiveContainer width="100%" height={270}>
                  <AreaChart data={data.charts.dailyRevenue} margin={{ top: 10, right: 18, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="liveRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1B2A4A" stopOpacity={0.22} />
                        <stop offset="95%" stopColor="#1B2A4A" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748B" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tickFormatter={chartCurrency} tick={{ fontSize: 10, fill: "#64748B" }} tickLine={false} axisLine={false} width={45} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <Area isAnimationActive={false} type="monotone" dataKey="cumulativeRevenue" name="Current month" stroke="#1B2A4A" fill="url(#liveRevenueGradient)" strokeWidth={2.5} />
                    <Line isAnimationActive={false} type="monotone" dataKey="previousMonthCumulativeRevenue" name="Previous month" stroke="#94A3B8" strokeDasharray="5 4" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mb-7 grid grid-cols-1 gap-4 xl:grid-cols-5">
          <Card className="border-border/60 py-0 xl:col-span-2">
            <CardHeader className="px-5 pb-2 pt-4">
              <CardTitle className="text-sm font-semibold">Customer performance</CardTitle>
              <p className="text-[11px] text-muted-foreground">Top five customers by recognized revenue this month</p>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              {data.topCustomers.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">No recognized customer revenue this month yet.</p>
              ) : (
                <div className="space-y-4">
                  {data.topCustomers.map((customer: any, index: number) => (
                    <div key={customer.customerId}>
                      <div className="mb-1.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium"><span className="mr-2 font-data text-xs text-muted-foreground">{index + 1}</span>{customer.customerName}</p>
                          <p className="text-[10px] text-muted-foreground">{customer.orders} {customer.orders === 1 ? "order" : "orders"} · {formatSignedCurrency(customer.revenueChange.difference)} vs prior month</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <ComparisonPill comparison={customer.revenueChange} />
                          <p className="font-data text-sm font-semibold">{formatCurrency(customer.revenue)}</p>
                        </div>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-[#E5A100]" style={{ width: `${(customer.revenue / maxCustomerRevenue) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="border-border/60 py-0 xl:col-span-3">
            <CardHeader className="px-5 pb-2 pt-4">
              <CardTitle className="text-sm font-semibold">Recent orders</CardTitle>
              <p className="text-[11px] text-muted-foreground">Live operational feed · cancelled orders excluded</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[380px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-card">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-5 text-[10px] uppercase tracking-wide">Order</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wide">Customer</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wide">Quantity</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wide">Status</TableHead>
                      <TableHead className="text-right text-[10px] uppercase tracking-wide">Amount</TableHead>
                      <TableHead className="pr-5 text-right text-[10px] uppercase tracking-wide">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentOrders.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">No operational orders in the current reporting window.</TableCell></TableRow>
                    ) : data.recentOrders.map((order: any) => (
                      <TableRow key={order.id}>
                        <TableCell className="pl-5 font-data text-xs font-semibold text-[#1B2A4A]">{order.orderNumber}</TableCell>
                        <TableCell className="max-w-[160px] truncate text-xs font-medium">{order.customerName}</TableCell>
                        <TableCell className="font-data text-[11px] text-muted-foreground">{quantityLabel(order.quantityByUnit)}</TableCell>
                        <TableCell><StatusBadge status={order.status} /></TableCell>
                        <TableCell className="text-right font-data text-xs font-semibold">{formatCurrency(order.total)}</TableCell>
                        <TableCell className="pr-5 text-right text-[11px] text-muted-foreground">
                          {new Intl.DateTimeFormat("en-CA", { timeZone: TORONTO, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(order.createdAt))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>

        <footer className={cn("flex flex-wrap gap-x-4 gap-y-1 border-t border-border/60 pt-3 text-[10px] text-muted-foreground", tvMode && "border-slate-800 text-slate-500")}>
          <span>{data.dataQuality.revenueDefinition}</span>
          <span>{data.dataQuality.dozenDefinition}</span>
          <span>{data.dataQuality.verifiedDozenLineItems} verified dozen line items in the reporting window</span>
        </footer>
      </div>
    </main>
  );
}

function LivePerformanceSkeleton({ tvMode }: { tvMode: boolean }) {
  return (
    <div className={cn("min-h-[calc(100vh-3rem)] bg-[#F8F8F6] px-4 py-5 md:px-6 lg:px-8", tvMode && "min-h-screen bg-[#071324]")}>
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div className="flex justify-between"><div className="space-y-2"><Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-96" /></div><Skeleton className="h-8 w-40" /></div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-36" />)}</div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2"><Skeleton className="h-80" /><Skeleton className="h-80" /></div>
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}

export default function LivePerformance() {
  const [tvMode, setTvMode] = useState(
    () => new URLSearchParams(window.location.search).get("tv") === "1"
  );

  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) setTvMode(false);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleTvMode = async () => {
    if (tvMode) {
      setTvMode(false);
      if (document.fullscreenElement) await document.exitFullscreen();
      return;
    }
    setTvMode(true);
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // The TV layout remains available even if the browser blocks fullscreen.
    }
  };

  if (tvMode) {
    return (
      <div className="fixed inset-0 z-[100] overflow-auto bg-[#071324]">
        <LivePerformanceContent tvMode onToggleTv={toggleTvMode} />
      </div>
    );
  }

  return <LivePerformanceContent tvMode={false} onToggleTv={toggleTvMode} />;
}
