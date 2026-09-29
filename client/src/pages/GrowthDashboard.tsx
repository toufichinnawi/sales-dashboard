import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Area,
  Bar,
  BarChart,
  ComposedChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  DollarSign,
  PackageCheck,
  ShoppingBag,
  Truck,
  UserPlus,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Comparison = {
  current: number;
  previous: number;
  difference: number;
  percentChange: number | null;
};

const TZ = "America/Toronto";
const ORANGE = "#ff6847";
const GOLD = "#ff9f43";
const GREEN = "#35d39a";
const GRID = "rgba(255,255,255,0.07)";
const TEXT_DIM = "#6f6b68";

const money = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  currencyDisplay: "narrowSymbol",
  maximumFractionDigits: 0,
});
const number = new Intl.NumberFormat("en-CA", { maximumFractionDigits: 1 });

function formatMetric(value: number, kind: "currency" | "number" | "dozens") {
  if (kind === "currency") return money.format(value);
  if (kind === "dozens") return `${number.format(value)} dz`;
  return number.format(value);
}

function formatPercent(value: number | null) {
  if (value === null) return "no baseline";
  if (Math.abs(value) < 0.05) return "no change";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function KpiCard({
  label,
  comparison,
  kind,
  featured = false,
}: {
  label: string;
  comparison: Comparison;
  kind: "currency" | "number" | "dozens";
  featured?: boolean;
}) {
  const positive = comparison.difference > 0;
  const negative = comparison.difference < 0;
  const Arrow = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <article className={cn("tv-card relative flex min-w-0 flex-col justify-between overflow-hidden px-4 py-3", featured && "tv-card-featured")}>
      <div className="flex items-start justify-between gap-2">
        <p className="tv-eyebrow truncate">{label}</p>
        {comparison.percentChange !== null && comparison.difference !== 0 && (
          <span className={cn("flex shrink-0 items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold", positive ? "bg-emerald-400/10 text-emerald-400" : "bg-rose-400/10 text-rose-400")}>
            <Arrow className="h-3 w-3" />
            {formatPercent(comparison.percentChange)}
          </span>
        )}
      </div>
      <p className={cn("mt-1 font-mono text-[2rem] font-semibold leading-none tracking-[-0.05em] text-white", featured && "text-[#ff7658]")}>
        {formatMetric(comparison.current, kind)}
      </p>
      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-[#676361]">
        <span className={cn("rounded bg-white/[0.045] px-1.5 py-0.5 font-medium", positive && "text-emerald-400", negative && "text-rose-400")}>
          {formatPercent(comparison.percentChange)}
        </span>
        <span>vs {formatMetric(comparison.previous, kind)}</span>
      </div>
      <div className={cn("absolute inset-x-0 bottom-0 h-[2px]", positive ? "bg-emerald-400" : negative ? "bg-[#ff6847]" : "bg-white/10")} />
    </article>
  );
}

function Panel({
  title,
  meta,
  children,
  className,
}: {
  title: string;
  meta?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("tv-card flex min-h-0 flex-col px-4 pb-3 pt-3", className)}>
      <div className="mb-2 flex shrink-0 items-center justify-between gap-3">
        <h2 className="tv-eyebrow">{title}</h2>
        {meta && <span className="truncate text-[9px] text-[#595654]">{meta}</span>}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#3a332f] bg-[#151311]/95 px-3 py-2 shadow-2xl backdrop-blur">
      <p className="mb-1 text-[9px] uppercase tracking-[0.16em] text-[#817b77]">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.dataKey} className="font-mono text-[11px]" style={{ color: entry.color }}>
          {entry.name}: {entry.name.toLowerCase().includes("order") ? number.format(entry.value) : money.format(entry.value)}
        </p>
      ))}
    </div>
  );
}

function StatusTag({ status }: { status: string }) {
  return (
    <span className={cn(
      "rounded px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider",
      status === "paid" && "bg-emerald-400/10 text-emerald-400",
      status === "delivered" && "bg-sky-400/10 text-sky-300",
      ["pending", "confirmed", "preparing"].includes(status) && "bg-amber-400/10 text-amber-300"
    )}>
      {status}
    </span>
  );
}

function Quantity({ values }: { values: Array<{ unit: string; quantity: number }> }) {
  if (!values.length) return <span>—</span>;
  return (
    <span>
      {values.map((item, index) => (
        <span key={`${item.unit}-${index}`}>
          {index > 0 ? " · " : ""}{number.format(item.quantity)} {item.unit.toLowerCase() === "dozen" ? "dz" : item.unit}
        </span>
      ))}
    </span>
  );
}

function LoadingScreen() {
  return (
    <div className="flex h-screen w-screen items-center justify-center overflow-hidden bg-[#0d0c0b] text-white">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[#ff6847]" />
        <p className="tv-eyebrow">Connecting to wholesale data</p>
      </div>
    </div>
  );
}

function DataUnavailable({ retry, message }: { retry: () => void; message?: string }) {
  return (
    <div className="flex h-screen w-screen items-center justify-center overflow-hidden bg-[#0d0c0b] text-white">
      <div className="max-w-md rounded-2xl border border-rose-500/20 bg-[#151311] p-8 text-center">
        <WifiOff className="mx-auto mb-3 h-8 w-8 text-rose-400" />
        <p className="text-lg font-semibold">Live data unavailable</p>
        <p className="mt-2 text-sm text-[#77716d]">{message || "The dashboard could not load a production snapshot."}</p>
        <button onClick={retry} className="mt-5 rounded-lg bg-[#ff6847] px-4 py-2 text-sm font-semibold text-white">Retry</button>
      </div>
    </div>
  );
}

export default function GrowthDashboard() {
  const [clock, setClock] = useState(() => new Date());
  const query = trpc.livePerformance.snapshot.useQuery(undefined, {
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
    retry: 4,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 15_000),
  });

  useEffect(() => {
    const interval = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const dateLabel = useMemo(() => new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(clock), [clock]);
  const timeLabel = useMemo(() => new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(clock), [clock]);
  const updatedLabel = useMemo(() => query.dataUpdatedAt
    ? new Intl.DateTimeFormat("en-CA", { timeZone: TZ, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date(query.dataUpdatedAt))
    : "—", [query.dataUpdatedAt]);

  if (query.isLoading && !query.data) return <LoadingScreen />;
  if (!query.data) return <DataUnavailable retry={() => void query.refetch()} message={query.error?.message} />;

  const data = query.data;
  const target = data.month.target;
  const targetProgress = target.revenueProgress ?? 0;
  const month = data.month.comparedWithPreviousFullMonth;
  const mtd = data.month.monthToDate;
  const recentOrders = data.recentOrders.slice(0, 5);
  const maxCustomerRevenue = Math.max(1, ...data.topCustomers.map((customer) => customer.revenue));
  const stale = query.isError;

  return (
    <div className="h-screen min-h-[620px] w-screen min-w-[1000px] overflow-hidden bg-[#0d0c0b] font-sans text-[#f5f3f2]">
      <div className="relative grid h-full grid-rows-[62px_128px_minmax(0,1.12fr)_minmax(0,0.82fr)] gap-3 overflow-hidden p-4">
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_15%_0%,rgba(255,104,71,0.12),transparent_28%),radial-gradient(circle_at_90%_15%,rgba(255,159,67,0.06),transparent_26%)]" />

        <header className="relative z-10 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff7658] to-[#f04d2e] shadow-[0_0_24px_rgba(255,104,71,0.22)]">
              <PackageCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-[22px] font-bold leading-none tracking-tight text-white">Hinnawi Wholesale</h1>
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.28em] text-[#ff7658]">Live Performance Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px]">
            <div className="rounded-full border border-white/[0.08] bg-white/[0.035] px-4 py-2 text-[#a29d99]">
              <span className="font-medium text-[#ddd9d6]">{dateLabel}</span>
              <span className="ml-3 font-mono text-sm font-semibold text-white">{timeLabel}</span>
            </div>
            <div className={cn("flex items-center gap-2 rounded-full border px-3 py-2", stale ? "border-rose-500/20 bg-rose-500/[0.07] text-rose-300" : "border-white/[0.08] bg-white/[0.035] text-[#a29d99]")}>
              <span className={cn("h-1.5 w-1.5 rounded-full", stale ? "bg-rose-400" : "bg-[#ff6847]")} />
              {stale ? "Connection lost · retrying" : `Updated ${updatedLabel}`}
            </div>
            <div className="flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-2 text-emerald-400">
              {stale ? <WifiOff className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
              {stale ? "Stale data" : "Systems live"}
            </div>
          </div>
        </header>

        <section className="relative z-10 grid grid-cols-6 gap-3">
          <KpiCard featured label="Today's revenue" comparison={data.today.revenue} kind="currency" />
          <KpiCard label="Today's orders" comparison={data.today.orders} kind="number" />
          <KpiCard label="Today's dozens" comparison={data.today.dozens} kind="dozens" />
          <KpiCard label="Monthly revenue" comparison={month.revenue} kind="currency" />
          <KpiCard label="Monthly orders" comparison={month.orders} kind="number" />
          <KpiCard label="Monthly dozens" comparison={month.dozens} kind="dozens" />
        </section>

        <section className="relative z-10 grid min-h-0 grid-cols-[1.42fr_1fr_0.78fr] gap-3">
          <Panel title="Revenue progression" meta="current month · recognized revenue">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.charts.dailyRevenue} margin={{ top: 12, right: 10, bottom: 2, left: -12 }}>
                <defs>
                  <linearGradient id="currentRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ORANGE} stopOpacity={0.34} />
                    <stop offset="100%" stopColor={ORANGE} stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: TEXT_DIM, fontSize: 9 }} interval="preserveStartEnd" />
                <YAxis tickFormatter={(value) => `$${Math.round(value / 1000)}k`} axisLine={false} tickLine={false} tick={{ fill: TEXT_DIM, fontSize: 9 }} width={42} />
                <Tooltip content={<ChartTooltip />} />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: 9, color: "#8a8582", paddingBottom: 8 }} />
                <Area isAnimationActive={false} type="monotone" dataKey="cumulativeRevenue" name="This month" stroke={ORANGE} fill="url(#currentRevenue)" strokeWidth={2.5} dot={false} />
                <Line isAnimationActive={false} type="monotone" dataKey="previousMonthCumulativeRevenue" name="Last month" stroke="#77716d" strokeWidth={1.6} strokeDasharray="5 4" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Order performance" meta="daily order volume">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.charts.dailyRevenue} margin={{ top: 12, right: 5, bottom: 2, left: -24 }} barGap={0}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: TEXT_DIM, fontSize: 8 }} interval="preserveStartEnd" />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: TEXT_DIM, fontSize: 9 }} width={30} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: 9, color: "#8a8582", paddingBottom: 8 }} />
                <Bar isAnimationActive={false} dataKey="orders" name="This month orders" fill={GOLD} radius={[2, 2, 0, 0]} maxBarSize={10} />
                <Bar isAnimationActive={false} dataKey="previousMonthOrders" name="Last month orders" fill="#3f3b38" radius={[2, 2, 0, 0]} maxBarSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Monthly performance" meta="live month-to-date">
            <div className="grid h-full grid-rows-[1fr_auto] gap-3">
              <div className="flex min-h-0 items-center gap-4">
                <div
                  className="relative flex aspect-square h-[104px] shrink-0 items-center justify-center rounded-full"
                  style={{ background: `conic-gradient(${ORANGE} ${Math.min(targetProgress, 100)}%, #24211f 0)` }}
                >
                  <div className="absolute inset-[10px] rounded-full bg-[#11100f]" />
                  <div className="relative text-center">
                    <p className="font-mono text-2xl font-semibold text-white">{target.revenueProgress === null ? "—" : `${targetProgress.toFixed(1)}%`}</p>
                    <p className="mt-0.5 text-[7px] uppercase tracking-[0.18em] text-[#77716d]">to target</p>
                  </div>
                </div>
                <div className="min-w-0 flex-1 space-y-3">
                  <div>
                    <p className="tv-mini-label">Revenue target</p>
                    <p className="mt-1 truncate font-mono text-lg font-semibold text-white">{target.targetRevenue === null ? "Not set" : money.format(target.targetRevenue)}</p>
                    <p className="text-[9px] text-[#65615e]">Current {money.format(mtd.revenue.current)}</p>
                  </div>
                  <div className="h-px bg-white/[0.06]" />
                  <div>
                    <p className="tv-mini-label">MTD growth</p>
                    <p className={cn("mt-1 font-mono text-lg font-semibold", mtd.revenue.difference >= 0 ? "text-emerald-400" : "text-rose-400")}>{formatPercent(mtd.revenue.percentChange)}</p>
                    <p className="text-[9px] text-[#65615e]">vs equivalent period</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-white/[0.055] bg-white/[0.025] px-3 py-2">
                  <p className="tv-mini-label">Average order</p>
                  <p className="mt-1 font-mono text-base font-semibold text-white">{money.format(mtd.averageOrderValue.current)}</p>
                </div>
                <div className="rounded-lg border border-white/[0.055] bg-white/[0.025] px-3 py-2">
                  <p className="tv-mini-label">Recognized orders</p>
                  <p className="mt-1 font-mono text-base font-semibold text-white">{number.format(data.operationalSummary.recognizedOrdersThisMonth)}</p>
                </div>
              </div>
            </div>
          </Panel>
        </section>

        <section className="relative z-10 grid min-h-0 grid-cols-[1.2fr_1.12fr_0.88fr] gap-3">
          <Panel title="Recent orders" meta="latest 5 wholesale orders">
            <div className="grid h-full grid-rows-5 divide-y divide-white/[0.055]">
              {recentOrders.map((order) => (
                <div key={order.id} className="grid min-h-0 grid-cols-[74px_minmax(0,1fr)_92px_72px] items-center gap-2 py-1.5 text-[9px]">
                  <span className="font-mono font-semibold text-[#ff8066]">{order.orderNumber}</span>
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-medium text-[#dfdcda]">{order.customerName}</p>
                    <p className="truncate text-[8px] text-[#5f5b58]"><Quantity values={order.quantityByUnit} /></p>
                  </div>
                  <StatusTag status={order.status} />
                  <span className="text-right font-mono text-[10px] font-semibold text-white">{money.format(order.total)}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Top customers" meta="recognized revenue this month">
            <div className="grid h-full grid-rows-5 gap-1">
              {data.topCustomers.map((customer, index) => (
                <div key={customer.customerId} className="grid min-h-0 grid-cols-[18px_minmax(0,1fr)_72px] items-center gap-2">
                  <span className="font-mono text-[9px] text-[#5f5b58]">{String(index + 1).padStart(2, "0")}</span>
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[10px] font-medium text-[#dfdcda]">{customer.customerName}</p>
                      <span className="shrink-0 text-[8px] text-[#65615e]">{customer.orders} orders</span>
                    </div>
                    <div className="mt-1 h-[3px] overflow-hidden rounded-full bg-white/[0.05]">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#ff6847] to-[#ff9f43]" style={{ width: `${(customer.revenue / maxCustomerRevenue) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-right font-mono text-[10px] font-semibold text-white">{money.format(customer.revenue)}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Operational summary" meta="current business activity">
            <div className="grid h-full grid-cols-2 grid-rows-3 gap-2">
              <SummaryItem icon={Users} label="Ordering customers" value={number.format(data.operationalSummary.activeOrderingCustomers)} />
              <SummaryItem icon={UserPlus} label="New customers" value={number.format(data.operationalSummary.newCustomers)} />
              <SummaryItem icon={Clock3} label="Awaiting fulfillment" value={number.format(data.operationalSummary.awaitingFulfillment)} tone={data.operationalSummary.awaitingFulfillment > 0 ? "amber" : "neutral"} />
              <SummaryItem icon={DollarSign} label="Open order value" value={money.format(data.operationalSummary.awaitingFulfillmentValue)} />
              <SummaryItem icon={Truck} label="Delivered today" value={number.format(data.operationalSummary.deliveredToday)} tone="green" />
              <SummaryItem icon={CheckCircle2} label="Paid today" value={number.format(data.operationalSummary.paidToday)} tone="green" />
            </div>
          </Panel>
        </section>
      </div>
    </div>
  );
}

function SummaryItem({
  icon: Icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  tone?: "neutral" | "amber" | "green";
}) {
  return (
    <div className="flex min-h-0 flex-col justify-between rounded-lg border border-white/[0.055] bg-white/[0.025] p-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="tv-mini-label truncate">{label}</p>
        <Icon className={cn("h-3.5 w-3.5 shrink-0 text-[#625e5a]", tone === "amber" && "text-amber-400", tone === "green" && "text-emerald-400")} />
      </div>
      <p className="font-mono text-xl font-semibold leading-none text-white">{value}</p>
    </div>
  );
}
