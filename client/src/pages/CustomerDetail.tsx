/**
 * CustomerDetail — Hinnawi Bros Bagels Wholesale
 * Minimal account detail with a "What they order" section sourced from
 * production.customerMix (Phase C). Period toggle mirrors /production.
 */

import { useMemo, useState } from "react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Building2, Mail, Phone, User } from "lucide-react";
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

export default function CustomerDetail() {
  const params = useParams<{ id: string }>();
  const customerId = Number(params.id);
  const [period, setPeriod] = useState<Period>("week");
  const range = useMemo(() => periodRange(period), [period]);

  const { data: customer, isLoading: customerLoading } = trpc.customers.getById.useQuery(
    { id: customerId },
    { enabled: Number.isFinite(customerId) && customerId > 0 }
  );

  const { data: mix, isLoading: mixLoading } = trpc.production.customerMix.useQuery(
    { customerId, from: range.from, to: range.to },
    { enabled: Number.isFinite(customerId) && customerId > 0 }
  );

  if (!Number.isFinite(customerId) || customerId <= 0) {
    return (
      <div className="px-4 md:px-6 pt-6">
        <p className="text-sm text-muted-foreground">Invalid customer id.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="px-4 md:px-6 pt-6 space-y-6 pb-6">
        {/* Back nav */}
        <div>
          <Link
            to="/customers"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Accounts
          </Link>
        </div>

        {/* Header */}
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-amber-700" />
            {customerLoading ? <Skeleton className="h-7 w-48" /> : customer?.businessName ?? "Unknown"}
          </h1>
          {!customerLoading && customer && (
            <div className="mt-2 flex items-center flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <User className="h-3 w-3" />
                {customer.contactName}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3 w-3" />
                <a href={`mailto:${customer.email}`} className="text-amber-700 hover:underline">
                  {customer.email}
                </a>
              </span>
              {customer.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3 w-3" />
                  {customer.phone}
                </span>
              )}
              <Badge variant="outline" className="text-[10px] capitalize">
                {customer.segment}
              </Badge>
              <Badge variant="outline" className="text-[10px] capitalize">
                {customer.status}
              </Badge>
            </div>
          )}
        </div>

        {/* What they order */}
        <Card className="border-border/50 py-0">
          <CardHeader className="pb-2 pt-4 px-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-sm font-display font-semibold">What they order</CardTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {range.label} ({range.from} → {range.to})
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
                    <th className="text-right font-semibold text-[10px] uppercase tracking-wider text-muted-foreground px-3 py-2.5">
                      Revenue
                    </th>
                    <th className="text-right font-semibold text-[10px] uppercase tracking-wider text-muted-foreground px-5 py-2.5">
                      Orders
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mixLoading && (
                    <tr>
                      <td colSpan={4} className="px-5 py-6">
                        <Skeleton className="h-4 w-40" />
                      </td>
                    </tr>
                  )}
                  {!mixLoading && (mix ?? []).length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">
                        No orders in this period.
                      </td>
                    </tr>
                  )}
                  {!mixLoading &&
                    (mix ?? []).map((row) => (
                      <tr
                        key={row.product}
                        className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-5 py-2.5 font-medium break-all">{row.product}</td>
                        <td className="px-3 py-2.5 text-right font-data font-medium">
                          {formatDozens(row.dozens)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-data text-muted-foreground">
                          {formatCurrency(row.revenue)}
                        </td>
                        <td className="px-5 py-2.5 text-right font-data text-muted-foreground">
                          {row.orderCount}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
