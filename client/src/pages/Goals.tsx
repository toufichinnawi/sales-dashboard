/**
 * Goals — Hinnawi Bros Bagels Wholesale
 * Company-level monthly sales targets and progress vs actuals.
 */

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Target } from "lucide-react";
import { formatCurrency } from "@/lib/data";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const AMBER = "#B45309";
const SLATE = "#78716C";

function currentPeriodMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatPeriodLabel(periodMonth: string): string {
  const [yearStr, monthStr] = periodMonth.split("-");
  const d = new Date(Number(yearStr), Number(monthStr) - 1, 1);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function Goals() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const utils = trpc.useUtils();
  const thisMonth = currentPeriodMonth();

  const { data: progress, isLoading: progressLoading } = trpc.targets.progress.useQuery();
  const { data: thisMonthTarget, isLoading: targetLoading } = trpc.targets.get.useQuery({
    periodMonth: thisMonth,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [revenueInput, setRevenueInput] = useState("");
  const [dozensInput, setDozensInput] = useState("");

  const upsert = trpc.targets.upsert.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.targets.progress.invalidate(),
        utils.targets.get.invalidate({ periodMonth: thisMonth }),
        utils.targets.list.invalidate(),
      ]);
      toast.success("Target saved");
      setDialogOpen(false);
    },
    onError: (err) => toast.error(err.message || "Failed to save target"),
  });

  const openDialog = () => {
    setRevenueInput(thisMonthTarget ? String(Number(thisMonthTarget.targetRevenue)) : "");
    setDozensInput(
      thisMonthTarget?.targetDozens ? String(Number(thisMonthTarget.targetDozens)) : ""
    );
    setDialogOpen(true);
  };

  const handleSave = () => {
    const revenue = Number(revenueInput);
    if (!Number.isFinite(revenue) || revenue < 0) {
      toast.error("Enter a valid revenue target");
      return;
    }
    const dozens = dozensInput.trim() === "" ? null : Number(dozensInput);
    if (dozens !== null && (!Number.isFinite(dozens) || dozens < 0)) {
      toast.error("Enter a valid dozens target");
      return;
    }
    upsert.mutate({
      periodMonth: thisMonth,
      targetRevenue: revenue,
      targetDozens: dozens,
    });
  };

  const thisMonthRow = useMemo(
    () => progress?.find((p) => p.periodMonth === thisMonth) ?? null,
    [progress, thisMonth]
  );

  const actual = thisMonthRow?.actualRevenue ?? 0;
  const target = thisMonthRow?.targetRevenue ?? null;
  const pct = target && target > 0 ? Math.min(100, (actual / target) * 100) : 0;
  const remaining = target !== null ? Math.max(0, target - actual) : null;

  const chartData = useMemo(
    () =>
      (progress ?? []).map((row) => ({
        month: formatPeriodLabel(row.periodMonth),
        actual: row.actualRevenue,
        target: row.targetRevenue ?? 0,
        hasTarget: row.targetRevenue !== null,
      })),
    [progress]
  );

  return (
    <div className="space-y-6">
      <div className="px-4 md:px-6 pt-6 space-y-6 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2">
              <Target className="h-6 w-6 text-amber-700" />
              Sales Goals
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Company-level monthly revenue targets and progress
            </p>
          </div>
          {isAdmin && (
            <Button onClick={openDialog} variant="default">
              {thisMonthTarget ? "Edit Target" : "Set Target"}
            </Button>
          )}
        </div>

        {/* This-month progress card */}
        <Card className="border-border/50 py-0">
          <CardHeader className="pb-2 pt-4 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-display font-semibold">
                {formatPeriodLabel(thisMonth)} — Revenue Target
              </CardTitle>
              {!isAdmin && !thisMonthTarget && (
                <Badge variant="secondary" className="text-[10px]">
                  No target set
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {progressLoading || targetLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : target === null ? (
              <div className="text-sm text-muted-foreground">
                No target set for this month.{" "}
                {isAdmin ? (
                  <button
                    className="underline text-amber-800 hover:text-amber-900"
                    onClick={openDialog}
                  >
                    Set one now
                  </button>
                ) : (
                  "Ask an admin to set one."
                )}
                <div className="mt-3 text-xs">
                  Actual so far:{" "}
                  <span className="font-data font-medium">{formatCurrency(actual)}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="font-data text-2xl font-semibold">
                      {formatCurrency(actual)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      of {formatCurrency(target)} target
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-data text-xl font-semibold text-amber-800">
                      {pct.toFixed(1)}%
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {remaining! > 0
                        ? `${formatCurrency(remaining!)} to go`
                        : "Target met"}
                    </div>
                  </div>
                </div>
                <Progress value={pct} className="h-2" />
              </div>
            )}
            {thisMonthTarget?.targetDozens && (
              <div className="mt-3 text-xs text-muted-foreground">
                Dozens target:{" "}
                <span className="font-data font-medium">
                  {Number(thisMonthTarget.targetDozens).toLocaleString()} dz
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 6-month chart */}
        <Card className="border-border/50 py-0">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-display font-semibold">
              Actual vs Target — Last 6 Months
            </CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Delivered + paid revenue compared to monthly target
            </p>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            {progressLoading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: SLATE }}
                    tickLine={false}
                    axisLine={{ stroke: "#e5e5e5" }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: SLATE, fontFamily: "'IBM Plex Mono', monospace" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
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
                      name === "actual" ? "Actual" : "Target",
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="actual" fill={AMBER} radius={[4, 4, 0, 0]} barSize={20} name="Actual" />
                  <Bar dataKey="target" fill="#D4A574" radius={[4, 4, 0, 0]} barSize={20} name="Target" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* 6-month table */}
        <Card className="border-border/50 py-0">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-display font-semibold">Monthly Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="text-left font-semibold text-[10px] uppercase tracking-wider text-muted-foreground px-5 py-2.5">
                      Month
                    </th>
                    <th className="text-right font-semibold text-[10px] uppercase tracking-wider text-muted-foreground px-3 py-2.5">
                      Actual
                    </th>
                    <th className="text-right font-semibold text-[10px] uppercase tracking-wider text-muted-foreground px-3 py-2.5">
                      Target
                    </th>
                    <th className="text-right font-semibold text-[10px] uppercase tracking-wider text-muted-foreground px-5 py-2.5">
                      %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {progressLoading && (
                    <tr>
                      <td colSpan={4} className="px-5 py-6 text-center text-muted-foreground">
                        Loading…
                      </td>
                    </tr>
                  )}
                  {!progressLoading &&
                    [...(progress ?? [])].reverse().map((row) => {
                      const rowPct =
                        row.targetRevenue && row.targetRevenue > 0
                          ? (row.actualRevenue / row.targetRevenue) * 100
                          : null;
                      return (
                        <tr
                          key={row.periodMonth}
                          className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-5 py-2.5 font-medium">
                            {formatPeriodLabel(row.periodMonth)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-data">
                            {formatCurrency(row.actualRevenue)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-data">
                            {row.targetRevenue !== null ? (
                              formatCurrency(row.targetRevenue)
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-5 py-2.5 text-right font-data">
                            {rowPct !== null ? (
                              `${rowPct.toFixed(0)}%`
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Set/Edit target dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {thisMonthTarget ? "Edit" : "Set"} target — {formatPeriodLabel(thisMonth)}
            </DialogTitle>
            <DialogDescription>
              Company-level revenue target for the current month. Dozens is optional.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="targetRevenue">Revenue target ($)</Label>
              <Input
                id="targetRevenue"
                type="number"
                min="0"
                step="0.01"
                value={revenueInput}
                onChange={(e) => setRevenueInput(e.target.value)}
                placeholder="e.g. 25000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="targetDozens">Dozens target (optional)</Label>
              <Input
                id="targetDozens"
                type="number"
                min="0"
                step="1"
                value={dozensInput}
                onChange={(e) => setDozensInput(e.target.value)}
                placeholder="e.g. 1200"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={upsert.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={upsert.isPending}>
              {upsert.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
