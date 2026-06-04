import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  ExternalLink,
  Loader2,
  RefreshCw,
  Store,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const BRANCH_MAPPINGS = [
  { branch: "PK", customer: "Hinnawi Bros Pk" },
  { branch: "MK", customer: "Hinnawi Bros Mk" },
  { branch: "TUN", customer: "Hinnawi Bros Tunnel" },
  { branch: "ONT", customer: "Hinnawi Bros Ontario" },
];

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function DailyOrdersSync() {
  const today = todayIsoDate();
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [pricePerDozen, setPricePerDozen] = useState("0.01");
  const [lastResult, setLastResult] = useState<{
    fromDate: string;
    toDate: string;
    sourceUrl: string;
    pricePerDozen: number;
    orders: {
      branch: string;
      customerName: string;
      customerId: number;
      orderNumber: string;
      orderId: number;
      action: "created" | "updated";
      itemCount: number;
      totalUnits: number;
      totalDozens: number;
      total: number;
    }[];
  } | null>(null);

  const syncMutation = trpc.dailyOrders.syncBagels.useMutation({
    onSuccess: (result) => {
      setLastResult(result);
      toast.success(`Synced ${result.orders.length} branch order${result.orders.length === 1 ? "" : "s"}`);
    },
    onError: (err) => {
      toast.error(`Daily orders sync failed: ${err.message}`);
    },
  });

  const sourceUrl = useMemo(
    () =>
      `https://operation.hjacobo.com/public/daily-orders-report-index/${fromDate}/${toDate}/%20/%20/bagel`,
    [fromDate, toDate]
  );

  const parsedPrice = Number(pricePerDozen);
  const validDateRange =
    /^\d{4}-\d{2}-\d{2}$/.test(fromDate) && /^\d{4}-\d{2}-\d{2}$/.test(toDate) && fromDate <= toDate;
  const canSync = validDateRange && parsedPrice > 0 && !syncMutation.isPending;

  function handleSync() {
    if (!canSync) return;
    syncMutation.mutate({
      fromDate,
      toDate,
      pricePerDozen: parsedPrice,
    });
  }

  const lastResultPeriod =
    lastResult && lastResult.fromDate === lastResult.toDate
      ? lastResult.fromDate
      : lastResult
        ? `${lastResult.fromDate} to ${lastResult.toDate}`
        : "";

  const totals = lastResult?.orders.reduce(
    (acc, order) => {
      acc.units += order.totalUnits;
      acc.dozens += order.totalDozens;
      acc.total += order.total;
      return acc;
    },
    { units: 0, dozens: 0, total: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="px-4 md:px-6 pt-4">
        <h1 className="font-display text-2xl font-bold tracking-tight">Daily Orders Sync</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Import daily bagel orders from operation.hjacobo.com into branch customer accounts.
        </p>
      </div>

      <div className="px-4 md:px-6 space-y-6 pb-6">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Bagel Report Import</CardTitle>
                  <CardDescription className="text-xs">
                    Creates or updates one order per branch for the selected report period.
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                Bagel
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="from-date">Start Date</Label>
                <Input
                  id="from-date"
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="to-date">End Date</Label>
                <Input
                  id="to-date"
                  type="date"
                  value={toDate}
                  min={fromDate}
                  onChange={(event) => setToDate(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="price-per-dozen">Price per Dozen</Label>
                <Input
                  id="price-per-dozen"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={pricePerDozen}
                  onChange={(event) => setPricePerDozen(event.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleSync} disabled={!canSync} className="gap-2 w-full md:w-auto">
                  {syncMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {syncMutation.isPending ? "Syncing..." : "Run Sync"}
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
                <ExternalLink className="h-3.5 w-3.5" />
                Source URL
              </div>
              <p className="text-xs font-mono break-all">{sourceUrl}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Branch Customer Mapping</CardTitle>
            <CardDescription className="text-xs">
              Quantities from each branch total are linked to these customer accounts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {BRANCH_MAPPINGS.map((mapping) => (
                <div key={mapping.branch} className="rounded-lg border border-border/50 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Store className="h-4 w-4 text-amber-700" />
                    <span className="text-sm font-semibold">{mapping.branch}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{mapping.customer}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {lastResult && (
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Last Sync Result
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {lastResultPeriod} · {formatCurrency(lastResult.pricePerDozen)} per dozen
                  </CardDescription>
                </div>
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                  {lastResult.orders.length} order{lastResult.orders.length === 1 ? "" : "s"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {totals && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-muted/40 p-3">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Units</p>
                    <p className="font-data text-lg font-semibold">{totals.units.toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Dozens</p>
                    <p className="font-data text-lg font-semibold">{totals.dozens.toFixed(2)}</p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Total</p>
                    <p className="font-data text-lg font-semibold">{formatCurrency(totals.total)}</p>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto rounded-lg border border-border/50">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-semibold">Branch</th>
                      <th className="text-left p-3 font-semibold">Customer</th>
                      <th className="text-left p-3 font-semibold">Order</th>
                      <th className="text-right p-3 font-semibold">Items</th>
                      <th className="text-right p-3 font-semibold">Units</th>
                      <th className="text-right p-3 font-semibold">Dozens</th>
                      <th className="text-right p-3 font-semibold">Total</th>
                      <th className="text-left p-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lastResult.orders.map((order) => (
                      <tr key={order.orderNumber} className="border-t border-border/40">
                        <td className="p-3 font-medium uppercase">{order.branch}</td>
                        <td className="p-3">{order.customerName}</td>
                        <td className="p-3 font-mono">{order.orderNumber}</td>
                        <td className="p-3 text-right font-data">{order.itemCount}</td>
                        <td className="p-3 text-right font-data">{order.totalUnits.toLocaleString()}</td>
                        <td className="p-3 text-right font-data">{order.totalDozens.toFixed(2)}</td>
                        <td className="p-3 text-right font-data">{formatCurrency(order.total)}</td>
                        <td className="p-3">
                          <Badge variant="secondary" className="text-[10px]">
                            {order.action}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4 flex gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-700 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800">
              Running sync again for the same period updates the same branch orders and replaces their line items.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
