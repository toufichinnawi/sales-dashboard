/**
 * Team Page — "Ink & Data" Editorial Design
 * Sales rep leaderboard, performance cards, quota tracking
 */

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  Trophy,
  Target,
  TrendingUp,
  Award,
} from "lucide-react";
import {
  salesReps,
  formatCurrency,
  type SalesRep,
} from "@/lib/data";

const TEAL = "#0D7377";
const TEAL_LIGHT = "#14919B";
const AMBER = "#C4841D";
const SLATE = "#64748B";

const HERO_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663391168179/X4Qkp2kKx9JEdEZTkB9mBy/team-performance-abstract-9sRQxGAc5cs3Rqtk973GBz.webp";

export default function Team() {
  const sortedReps = useMemo(
    () => [...salesReps].sort((a, b) => b.closed - a.closed),
    []
  );

  const totalClosed = useMemo(
    () => salesReps.reduce((s, r) => s + r.closed, 0),
    []
  );

  const totalQuota = useMemo(
    () => salesReps.reduce((s, r) => s + r.quota, 0),
    []
  );

  const avgWinRate = useMemo(
    () => salesReps.reduce((s, r) => s + r.winRate, 0) / salesReps.length,
    []
  );

  // Chart data for rep comparison
  const chartData = useMemo(
    () =>
      sortedReps.map((rep) => ({
        name: rep.name.split(" ")[0],
        closed: rep.closed,
        quota: rep.quota,
        pipeline: rep.pipeline,
      })),
    [sortedReps]
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Hero banner */}
      <div className="relative rounded-lg overflow-hidden h-36 md:h-44">
        <img
          src={HERO_IMAGE}
          alt="Team performance"
          className="absolute inset-0 w-full h-full object-cover opacity-25"
        />
        <div className="relative z-10 h-full flex flex-col justify-end p-5">
          <h1 className="font-display text-xl md:text-2xl font-bold text-foreground">Team Performance</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {salesReps.length} reps · {formatCurrency(totalClosed)} closed · {((totalClosed / totalQuota) * 100).toFixed(1)}% of quota
          </p>
        </div>
      </div>

      {/* Team summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard
          icon={Trophy}
          label="Total Closed"
          value={formatCurrency(totalClosed)}
          sub={`${((totalClosed / totalQuota) * 100).toFixed(1)}% of quota`}
        />
        <SummaryCard
          icon={Target}
          label="Team Quota"
          value={formatCurrency(totalQuota)}
          sub={`${formatCurrency(totalQuota - totalClosed)} remaining`}
        />
        <SummaryCard
          icon={TrendingUp}
          label="Avg Win Rate"
          value={`${avgWinRate.toFixed(1)}%`}
          sub="Across all reps"
        />
        <SummaryCard
          icon={Award}
          label="Top Performer"
          value={sortedReps[0]?.name.split(" ")[0] || "—"}
          sub={formatCurrency(sortedReps[0]?.closed || 0)}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Closed vs Quota bar chart */}
        <Card className="border-border/50 py-0">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-display font-semibold">Closed vs Quota</CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">Individual rep performance</p>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                <XAxis
                  dataKey="name"
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
                    name === "closed" ? "Closed" : "Quota",
                  ]}
                />
                <Bar dataKey="quota" fill="#E5E5E5" radius={[3, 3, 0, 0]} barSize={14} name="Quota" />
                <Bar dataKey="closed" fill={TEAL} radius={[3, 3, 0, 0]} barSize={14} name="Closed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top performer radar */}
        <Card className="border-border/50 py-0">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-display font-semibold">Top 3 Rep Comparison</CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">Multi-dimensional performance</p>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart
                data={[
                  { metric: "Win Rate", r1: sortedReps[0]?.winRate || 0, r2: sortedReps[1]?.winRate || 0, r3: sortedReps[2]?.winRate || 0 },
                  { metric: "Deals", r1: sortedReps[0]?.deals || 0, r2: sortedReps[1]?.deals || 0, r3: sortedReps[2]?.deals || 0 },
                  { metric: "Avg Size", r1: (sortedReps[0]?.avgDealSize || 0) / 1000, r2: (sortedReps[1]?.avgDealSize || 0) / 1000, r3: (sortedReps[2]?.avgDealSize || 0) / 1000 },
                  { metric: "Quota %", r1: ((sortedReps[0]?.closed || 0) / (sortedReps[0]?.quota || 1)) * 100, r2: ((sortedReps[1]?.closed || 0) / (sortedReps[1]?.quota || 1)) * 100, r3: ((sortedReps[2]?.closed || 0) / (sortedReps[2]?.quota || 1)) * 100 },
                  { metric: "Pipeline", r1: (sortedReps[0]?.pipeline || 0) / 10000, r2: (sortedReps[1]?.pipeline || 0) / 10000, r3: (sortedReps[2]?.pipeline || 0) / 10000 },
                ]}
              >
                <PolarGrid stroke="#e5e5e5" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: SLATE }} />
                <PolarRadiusAxis tick={false} axisLine={false} />
                <Radar name={sortedReps[0]?.name.split(" ")[0]} dataKey="r1" stroke={TEAL} fill={TEAL} fillOpacity={0.15} strokeWidth={2} />
                <Radar name={sortedReps[1]?.name.split(" ")[0]} dataKey="r2" stroke={AMBER} fill={AMBER} fillOpacity={0.1} strokeWidth={1.5} />
                <Radar name={sortedReps[2]?.name.split(" ")[0]} dataKey="r3" stroke={SLATE} fill={SLATE} fillOpacity={0.05} strokeWidth={1} />
                <Tooltip
                  contentStyle={{
                    fontSize: 11,
                    fontFamily: "'IBM Plex Mono', monospace",
                    borderRadius: 6,
                    border: "1px solid #e5e5e5",
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-4 mt-1">
              <LegendDot color={TEAL} label={sortedReps[0]?.name.split(" ")[0] || ""} />
              <LegendDot color={AMBER} label={sortedReps[1]?.name.split(" ")[0] || ""} />
              <LegendDot color={SLATE} label={sortedReps[2]?.name.split(" ")[0] || ""} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rep cards */}
      <div>
        <h2 className="font-display text-sm font-semibold mb-3">Leaderboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sortedReps.map((rep, i) => (
            <RepCard key={rep.id} rep={rep} rank={i + 1} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card className="border-border/50 py-0">
      <CardContent className="p-3.5">
        <Icon className="h-4 w-4 text-muted-foreground mb-2" />
        <div className="font-data text-lg font-semibold tracking-tight leading-none mb-1">
          {value}
        </div>
        <div className="text-[11px] text-muted-foreground">{label}</div>
        <div className="text-[10px] text-muted-foreground/70 mt-0.5">{sub}</div>
      </CardContent>
    </Card>
  );
}

function RepCard({ rep, rank }: { rep: SalesRep; rank: number }) {
  const quotaPercent = (rep.closed / rep.quota) * 100;
  const isAboveQuota = quotaPercent >= 100;

  return (
    <Card className="border-border/50 hover:border-border transition-colors py-0">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Rank + Avatar */}
          <div className="flex items-center gap-2.5">
            <span className={`font-data text-sm font-bold w-5 text-center ${
              rank === 1 ? "text-amber-500" : rank === 2 ? "text-slate-400" : rank === 3 ? "text-amber-700" : "text-muted-foreground/50"
            }`}>
              {rank}
            </span>
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {rep.avatar}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{rep.name}</span>
              <Badge variant="secondary" className="text-[9px] h-4">{rep.role}</Badge>
              {isAboveQuota && (
                <Badge variant="secondary" className="text-[9px] h-4 bg-emerald-50 text-emerald-700">
                  Above Quota
                </Badge>
              )}
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px]">
              <div>
                <span className="text-muted-foreground">Closed: </span>
                <span className="font-data font-medium">{formatCurrency(rep.closed)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Pipeline: </span>
                <span className="font-data font-medium">{formatCurrency(rep.pipeline)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Win Rate: </span>
                <span className="font-data font-medium">{rep.winRate}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">Deals: </span>
                <span className="font-data font-medium">{rep.deals}</span>
              </div>
            </div>

            {/* Quota progress */}
            <div className="mt-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground">Quota Progress</span>
                <span className="font-data text-[10px] font-medium">{quotaPercent.toFixed(1)}%</span>
              </div>
              <Progress
                value={Math.min(quotaPercent, 100)}
                className="h-1.5"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}
