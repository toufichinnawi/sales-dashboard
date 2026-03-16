/**
 * Portal — My Orders
 * Mobile-first order history for wholesale customers
 */

import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShoppingBag, Package } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-orange-100 text-orange-800",
  delivered: "bg-green-100 text-green-800",
  paid: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

const productLabels: Record<string, string> = {
  plain: "Plain Bagel",
  sesame: "Sesame Bagel",
  everything: "Everything Bagel",
};

export default function PortalOrders() {
  const { data: orders, isLoading } = trpc.portal.myOrders.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-16">
        <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
        <h2 className="text-lg font-semibold mb-1">No Orders Yet</h2>
        <p className="text-sm text-muted-foreground">
          Place your first order using the Order tab below.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold font-display">My Orders</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {orders.length} order{orders.length !== 1 ? "s" : ""} total
        </p>
      </div>

      <div className="space-y-3">
        {orders.map((order) => (
          <Card key={order.id} className="border-border/50 py-0 overflow-hidden">
            <CardContent className="p-4">
              {/* Header row */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-data text-sm font-semibold">{order.orderNumber}</span>
                    <Badge className={`text-[10px] h-5 ${statusColors[order.status] ?? "bg-gray-100 text-gray-800"}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span className="font-data text-base font-bold text-primary">
                  ${Number(order.total).toFixed(2)}
                </span>
              </div>

              {/* Delivery info */}
              {order.deliveryDate && (
                <div className="text-xs text-muted-foreground mb-2">
                  Delivery: {new Date(order.deliveryDate).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              )}

              {/* Items */}
              <div className="space-y-1.5">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <Package className="h-3 w-3 text-muted-foreground" />
                      <span>{productLabels[item.product] ?? item.product}</span>
                    </div>
                    <div className="flex items-center gap-3 font-data">
                      <span className="text-muted-foreground">{Number(item.quantityDozens)} dz</span>
                      <span className="font-medium">${Number(item.lineTotal).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Discount */}
              {Number(order.discount) > 0 && (
                <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-border/40">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-green-600 font-data">-${Number(order.discount).toFixed(2)}</span>
                </div>
              )}

              {/* Notes */}
              {order.notes && (
                <p className="text-[11px] text-muted-foreground mt-2 italic">
                  {order.notes}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
