/**
 * Portal — My Standing Orders
 * View and manage recurring weekly orders
 */

import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Repeat, Package, Pause, Play } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  paused: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-red-100 text-red-800",
};

const dayLabels: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
};

const productLabels: Record<string, string> = {
  plain: "Plain Bagel",
  sesame: "Sesame Bagel",
  everything: "Everything Bagel",
};

export default function PortalStandingOrders() {
  const { data: standingOrders, isLoading } = trpc.portal.myStandingOrders.useQuery();
  const utils = trpc.useUtils();

  const updateStatus = trpc.recurring.updateStatus.useMutation({
    onSuccess: () => {
      utils.portal.myStandingOrders.invalidate();
      toast.success("Standing order updated");
    },
    onError: () => {
      toast.error("Failed to update standing order");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!standingOrders || standingOrders.length === 0) {
    return (
      <div className="text-center py-16">
        <Repeat className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
        <h2 className="text-lg font-semibold mb-1">No Standing Orders</h2>
        <p className="text-sm text-muted-foreground">
          Contact Hinnawi Bros to set up a recurring weekly order.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold font-display">Standing Orders</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Your recurring delivery schedule
        </p>
      </div>

      <div className="space-y-3">
        {standingOrders.map((so) => (
          <Card key={so.id} className="border-border/50 py-0 overflow-hidden">
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      Every {dayLabels[so.dayOfWeek] ?? so.dayOfWeek}
                    </span>
                    <Badge className={`text-[10px] h-5 ${statusColors[so.status] ?? "bg-gray-100 text-gray-800"}`}>
                      {so.status.charAt(0).toUpperCase() + so.status.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {so.frequency.charAt(0).toUpperCase() + so.frequency.slice(1)} delivery
                  </p>
                </div>
                <span className="font-data text-base font-bold text-primary">
                  ${Number(so.total).toFixed(2)}
                </span>
              </div>

              {/* Next delivery */}
              {so.nextDelivery && (
                <div className="text-xs text-muted-foreground mb-2">
                  Next delivery: {new Date(so.nextDelivery).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              )}

              {/* Items */}
              <div className="space-y-1.5 mb-3">
                {so.items.map((item, i) => (
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

              {/* Delivery address */}
              {so.deliveryAddress && (
                <p className="text-[11px] text-muted-foreground mb-3">
                  Deliver to: {so.deliveryAddress}
                </p>
              )}

              {/* Pause/Resume toggle */}
              {so.status !== "cancelled" && (
                <div className="flex gap-2">
                  {so.status === "active" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 flex-1"
                      onClick={() => updateStatus.mutate({ id: so.id, status: "paused" })}
                      disabled={updateStatus.isPending}
                    >
                      <Pause className="h-3 w-3 mr-1" />
                      Pause Deliveries
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 flex-1 border-green-200 text-green-700 hover:bg-green-50"
                      onClick={() => updateStatus.mutate({ id: so.id, status: "active" })}
                      disabled={updateStatus.isPending}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Resume Deliveries
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
