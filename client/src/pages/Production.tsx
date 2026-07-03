/**
 * Production — Hinnawi Bros Bagels Wholesale
 * Factory demand: how many dozens of each canonical product to make in the
 * current period. Aggregated read-only from order_items (cancelled excluded),
 * matched to the same canonical catalog as Costs/Profit. Lines that don't
 * match a canonical fall into a single "Uncategorized" bucket.
 */

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Factory, Package } from "lucide-react";
import { Link } from "wouter";
import { formatCurrency } from "@/lib/data";
import { trpc } from "@/lib/trpc";

type Period = "week" | "month";

function periodRange(period: Period): { from: string; to: string; label: string } {
  const now = new Date();
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let from: Date;
  let label: string;
  if (period === "week") {
    from = new Date(to);
    from.setDate(from.getDate() - 6);
    label = "This Week";
  } else {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
    label = "This Month";
  }
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
    label,
  };
}

function formatDozens(d: number): string {
  return `${d.toLocaleString(undefined, { maximumFractionDigits: 1 })} dz`;
}

export default function Production() {
  const [period, setPeriod] = useState<Period>("week");
  const range = useMemo(() => periodRange(period), [period]);

  const { data, isLoading } = trpc.production.demand.useQuery({
    from: range.from,
    to: range.to,
  });

  const rows = data?.rows ?? [];
  const totalDozens = data?.totalDozens ?? 0;
  const uncostedRows = rows.filter((r) => !r.isCanonical);
  const uncostedDozens = uncostedRows.reduce((sum, r) => sum + r.dozens, 0);
  const uncostedRevenue = uncostedRows.reduce((sum, r) => sum + r.revenue, 0);

  return (
    <div className="space-y-6">
      <div className="px-4 md:px-6 pt-6 space-y-6 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2">
              <Factory className="h-6 w-6 text-amber-700" />
              Production Demand
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              How many dozens of each product to make · {range.label} ({range.from} → {range.to})
            </p>
          </div>
          <div className="inline-flex rounded-md border border-border/60 p-0.5">
            <Button
              variant={period === "week" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setPeriod("week")}
            >
              This Week
            </Button>
            <Button
              variant={period === "month" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setPeriod("month")}
            >
              This Month
            </Button>
          </div>
        </div>

        {/* Total tile */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-border/50 py-0">
            <CardContent className="p-3.5">
              <div className="flex items-center justify-between mb-2">
                <Package className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="font-data text-lg font-semibold tracking-tight leading-none mb-1">
                {isLoading ? <Skeleton className="h-5 w-16" /> : formatDozens(totalDozens)}
              </div>
              <div className="text-[11px] text-muted-foreground">Total dozens</div>
            </CardContent>
          </Card>
        </div>

        {/* Demand table */}
        <Card className="border-border/50 py-0">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-display font-semibold">Demand by Product</CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Sorted by dozens needed — bake the top of the list first.
            </p>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="text-left font-semibold text-[10px] uppercase tracking-wider text-muted-foreground px-5 py-2.5">
                      Product
                    </th>
                    <th className="text-right font-semibold text-[10px] uppercase tracking-wider text-muted-foreground px-3 py-2.5">
                      Dozens
                    </th>
                    <th className="text-right font-semibold text-[10px] uppercase tracking-wider text-muted-foreground px-5 py-2.5">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && (
                    <tr>
                      <td colSpan={3} className="px-5 py-6">
                        <Skeleton className="h-4 w-40" />
                      </td>
                    </tr>
                  )}
                  {!isLoading && rows.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-5 py-8 text-center text-muted-foreground">
                        No orders in this period.
                      </td>
                    </tr>
                  )}
                  {!isLoading &&
                    rows.map((row) => (
                      <tr
                        key={row.product}
                        className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-5 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{row.product}</span>
                            {!row.isCanonical && (
                              <Badge className="bg-amber-100 text-amber-800 text-[10px]">
                                No cost data
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right font-data font-medium">
                          {formatDozens(row.dozens)}
                        </td>
                        <td className="px-5 py-2.5 text-right font-data text-muted-foreground">
                          {formatCurrency(row.revenue)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {uncostedRows.length > 0 && (
              <div className="px-5 py-3 border-t border-border/40 text-[11px] text-amber-800 bg-amber-50/60">
                {uncostedRows.length} product{uncostedRows.length === 1 ? "" : "s"} (
                {formatDozens(uncostedDozens)}, {formatCurrency(uncostedRevenue)}) have no cost data.{" "}
                <Link to="/costs" className="underline font-medium hover:text-amber-900">
                  Add them on /costs
                </Link>{" "}
                to track profit — they still count toward your bake totals above.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
