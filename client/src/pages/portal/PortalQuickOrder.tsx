/**
 * Portal — Quick Order
 * Mobile-friendly order form for wholesale customers
 */

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  PlusCircle,
  Minus,
  Plus,
  Trash2,
  CheckCircle2,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";

const PRODUCTS = [
  { id: "plain", name: "Plain Bagel", price: 8.0, emoji: "🥯" },
  { id: "sesame", name: "Sesame Bagel", price: 8.5, emoji: "🥯" },
  { id: "everything", name: "Everything Bagel", price: 9.0, emoji: "🥯" },
] as const;

type OrderItem = {
  product: "plain" | "sesame" | "everything";
  quantity: number;
  unitPrice: number;
};

export default function PortalQuickOrder() {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  const utils = trpc.useUtils();

  const quickOrder = trpc.portal.quickOrder.useMutation({
    onSuccess: (data) => {
      setSubmitted(true);
      setOrderNumber(data.order?.orderNumber ?? "");
      utils.portal.myOrders.invalidate();
      toast.success("Order placed successfully!");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to place order");
    },
  });

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [items]
  );

  const addProduct = (productId: "plain" | "sesame" | "everything") => {
    const existing = items.find((i) => i.product === productId);
    if (existing) {
      setItems(
        items.map((i) =>
          i.product === productId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      );
    } else {
      const product = PRODUCTS.find((p) => p.id === productId)!;
      setItems([...items, { product: productId, quantity: 1, unitPrice: product.price }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setItems(
      items
        .map((i) =>
          i.product === productId
            ? { ...i, quantity: Math.max(0, i.quantity + delta) }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const removeItem = (productId: string) => {
    setItems(items.filter((i) => i.product !== productId));
  };

  const handleSubmit = () => {
    if (items.length === 0) {
      toast.error("Add at least one product to your order");
      return;
    }
    if (!deliveryDate) {
      toast.error("Please select a delivery date");
      return;
    }

    quickOrder.mutate({
      deliveryDate,
      deliveryAddress: deliveryAddress || undefined,
      notes: notes || undefined,
      items: items.map((i) => ({
        product: i.product,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
    });
  };

  const resetForm = () => {
    setItems([]);
    setDeliveryDate("");
    setDeliveryAddress("");
    setNotes("");
    setSubmitted(false);
    setOrderNumber("");
  };

  // Success state
  if (submitted) {
    return (
      <div className="text-center py-16">
        <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Order Placed!</h2>
        <p className="text-sm text-muted-foreground mb-1">
          Order <span className="font-data font-semibold">{orderNumber}</span> has been submitted.
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Hinnawi Bros will confirm your order shortly.
        </p>
        <Button onClick={resetForm} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Place Another Order
        </Button>
      </div>
    );
  }

  // Get min delivery date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold font-display">Quick Order</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Select products and place your order
        </p>
      </div>

      {/* Product picker */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Products
        </Label>
        <div className="grid grid-cols-1 gap-2">
          {PRODUCTS.map((product) => {
            const inCart = items.find((i) => i.product === product.id);
            return (
              <Card
                key={product.id}
                className={`border-border/50 py-0 cursor-pointer transition-all ${
                  inCart ? "ring-2 ring-primary/30 border-primary/40" : "hover:border-border"
                }`}
                onClick={() => !inCart && addProduct(product.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{product.emoji}</span>
                      <div>
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground font-data">
                          ${product.price.toFixed(2)} / dozen
                        </p>
                      </div>
                    </div>

                    {inCart ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(product.id, -0.5);
                          }}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="font-data text-sm font-semibold w-8 text-center">
                          {inCart.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(product.id, 0.5);
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeItem(product.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" className="text-xs h-8">
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Delivery details */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Delivery Details
        </Label>

        <div>
          <Label htmlFor="deliveryDate" className="text-xs mb-1 block">
            Delivery Date *
          </Label>
          <Input
            id="deliveryDate"
            type="date"
            min={minDate}
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            className="h-10"
          />
        </div>

        <div>
          <Label htmlFor="deliveryAddress" className="text-xs mb-1 block">
            Delivery Address (optional)
          </Label>
          <Input
            id="deliveryAddress"
            placeholder="Leave blank to use default address"
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            className="h-10"
          />
        </div>

        <div>
          <Label htmlFor="notes" className="text-xs mb-1 block">
            Notes (optional)
          </Label>
          <Textarea
            id="notes"
            placeholder="Special instructions, delivery time preference..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>
      </div>

      {/* Order summary */}
      {items.length > 0 && (
        <Card className="border-primary/30 bg-primary/5 py-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">Order Summary</span>
              <span className="font-data text-lg font-bold text-primary">
                ${subtotal.toFixed(2)}
              </span>
            </div>
            <div className="space-y-1">
              {items.map((item) => {
                const product = PRODUCTS.find((p) => p.id === item.product)!;
                return (
                  <div key={item.product} className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {item.quantity} dz {product.name}
                    </span>
                    <span className="font-data">
                      ${(item.quantity * item.unitPrice).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      <Button
        className="w-full h-12 text-base gap-2"
        onClick={handleSubmit}
        disabled={items.length === 0 || !deliveryDate || quickOrder.isPending}
      >
        {quickOrder.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Placing Order...
          </>
        ) : (
          <>
            <ShoppingBag className="h-4 w-4" />
            Place Order {subtotal > 0 ? `— $${subtotal.toFixed(2)}` : ""}
          </>
        )}
      </Button>
    </div>
  );
}
