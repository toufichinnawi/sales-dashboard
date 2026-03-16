/**
 * Recurring Orders — Standing order management for weekly/biweekly/monthly deliveries
 */

import { useState, useMemo } from "react";
import {
  Repeat,
  Plus,
  Pause,
  Play,
  Trash2,
  Calendar,
  Package,
  DollarSign,
  Search,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const PRODUCTS = [
  { value: "plain", label: "Plain Bagels", price: 8.0 },
  { value: "sesame", label: "Sesame Bagels", price: 8.5 },
  { value: "everything", label: "Everything Bagels", price: 9.0 },
] as const;

const DAYS = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
] as const;

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  paused: "bg-amber-100 text-amber-800",
  cancelled: "bg-red-100 text-red-800",
};

type OrderItem = {
  product: "plain" | "sesame" | "everything";
  quantityDozens: number;
  pricePerDozen: number;
};

export default function RecurringOrders() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: recurringList, isLoading } = trpc.recurring.list.useQuery();
  const { data: customerList } = trpc.customers.list.useQuery();

  const customerMap = useMemo(() => {
    const map = new Map<number, string>();
    if (customerList) {
      for (const c of customerList) {
        map.set(c.id, c.businessName);
      }
    }
    return map;
  }, [customerList]);

  const toggleStatus = trpc.recurring.updateStatus.useMutation({
    onSuccess: () => {
      utils.recurring.list.invalidate();
      toast.success("Standing order updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteRecurring = trpc.recurring.delete.useMutation({
    onSuccess: () => {
      utils.recurring.list.invalidate();
      toast.success("Standing order deleted");
      setDeleteId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const filtered = useMemo(() => {
    if (!recurringList) return [];
    return recurringList.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (search) {
        const name = customerMap.get(r.customerId) || "";
        if (!name.toLowerCase().includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [recurringList, search, statusFilter, customerMap]);

  // Summary stats
  const activeCount = recurringList?.filter((r) => r.status === "active").length ?? 0;
  const weeklyRevenue = recurringList
    ?.filter((r) => r.status === "active")
    .reduce((sum, r) => {
      const total = Number(r.total);
      if (r.frequency === "weekly") return sum + total;
      if (r.frequency === "biweekly") return sum + total / 2;
      if (r.frequency === "monthly") return sum + total / 4.33;
      return sum;
    }, 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Standing Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Recurring weekly deliveries for your wholesale accounts
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-amber-700 hover:bg-amber-800">
          <Plus className="h-4 w-4 mr-2" />
          New Standing Order
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/50 py-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50">
                <Repeat className="h-4 w-4 text-green-700" />
              </div>
              <div>
                <p className="font-data text-xl font-semibold">{activeCount}</p>
                <p className="text-[11px] text-muted-foreground">Active Standing Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 py-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
                <DollarSign className="h-4 w-4 text-amber-700" />
              </div>
              <div>
                <p className="font-data text-xl font-semibold">${weeklyRevenue.toFixed(2)}</p>
                <p className="text-[11px] text-muted-foreground">Est. Weekly Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 py-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                <Calendar className="h-4 w-4 text-blue-700" />
              </div>
              <div>
                <p className="font-data text-xl font-semibold">${(weeklyRevenue * 4.33).toFixed(2)}</p>
                <p className="text-[11px] text-muted-foreground">Est. Monthly Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-border/50 py-0">
              <CardContent className="p-4">
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-border/50 py-0">
          <CardContent className="py-12 text-center">
            <Repeat className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {recurringList?.length === 0
                ? "No standing orders yet. Create one to automate weekly deliveries."
                : "No standing orders match your filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((ro) => {
            const customerName = customerMap.get(ro.customerId) || `Customer #${ro.customerId}`;
            return (
              <Card key={ro.id} className="border-border/50 py-0 hover:border-border transition-colors">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold truncate">{customerName}</h3>
                        <Badge className={`text-[10px] h-5 ${statusColors[ro.status]}`}>
                          {ro.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Every {ro.frequency === "weekly" ? "" : ro.frequency === "biweekly" ? "other " : "month on "}{ro.dayOfWeek}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ${Number(ro.total).toFixed(2)} per delivery
                        </span>
                        {ro.nextDelivery && (
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            Next: {new Date(ro.nextDelivery).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {ro.status === "active" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleStatus.mutate({ id: ro.id, status: "paused" })}
                          disabled={toggleStatus.isPending}
                        >
                          <Pause className="h-3.5 w-3.5 mr-1" />
                          Pause
                        </Button>
                      )}
                      {ro.status === "paused" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleStatus.mutate({ id: ro.id, status: "active" })}
                          disabled={toggleStatus.isPending}
                        >
                          <Play className="h-3.5 w-3.5 mr-1" />
                          Resume
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setDeleteId(ro.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <CreateStandingOrderDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        customers={customerList ?? []}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Standing Order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this recurring order. Future deliveries will not be generated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteId && deleteRecurring.mutate({ id: deleteId })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Create Standing Order Dialog ────────────────────────────────────────────

function CreateStandingOrderDialog({
  open,
  onOpenChange,
  customers,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: Array<{ id: number; businessName: string; address: string | null }>;
}) {
  const utils = trpc.useUtils();
  const [customerId, setCustomerId] = useState<string>("");
  const [dayOfWeek, setDayOfWeek] = useState<string>("tuesday");
  const [frequency, setFrequency] = useState<string>("weekly");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [discount, setDiscount] = useState(0);
  const [items, setItems] = useState<OrderItem[]>([
    { product: "plain", quantityDozens: 5, pricePerDozen: 8.0 },
  ]);

  const createMutation = trpc.recurring.create.useMutation({
    onSuccess: () => {
      utils.recurring.list.invalidate();
      toast.success("Standing order created!");
      onOpenChange(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  function resetForm() {
    setCustomerId("");
    setDayOfWeek("tuesday");
    setFrequency("weekly");
    setDeliveryAddress("");
    setNotes("");
    setDiscount(0);
    setItems([{ product: "plain", quantityDozens: 5, pricePerDozen: 8.0 }]);
  }

  function addItem() {
    setItems([...items, { product: "plain", quantityDozens: 1, pricePerDozen: 8.0 }]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof OrderItem, value: any) {
    const updated = [...items];
    if (field === "product") {
      const prod = PRODUCTS.find((p) => p.value === value);
      updated[index] = { ...updated[index], product: value, pricePerDozen: prod?.price ?? 8.0 };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setItems(updated);
  }

  const subtotal = items.reduce((sum, item) => sum + item.quantityDozens * item.pricePerDozen, 0);
  const total = Math.max(0, subtotal - discount);

  function handleSubmit() {
    if (!customerId) {
      toast.error("Please select a customer");
      return;
    }
    if (items.length === 0) {
      toast.error("Add at least one product");
      return;
    }
    createMutation.mutate({
      customerId: Number(customerId),
      dayOfWeek: dayOfWeek as any,
      frequency: frequency as any,
      deliveryAddress: deliveryAddress || undefined,
      notes: notes || undefined,
      discount,
      items: items.map((i) => ({
        product: i.product,
        quantityDozens: i.quantityDozens,
        pricePerDozen: i.pricePerDozen,
      })),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">New Standing Order</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Customer */}
          <div>
            <Label className="text-xs mb-1.5">Customer</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select customer..." />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.businessName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1.5">Delivery Day</Label>
              <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1.5">Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Biweekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Delivery Address */}
          <div>
            <Label className="text-xs mb-1.5">Delivery Address (optional)</Label>
            <Input
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Leave blank to use customer's default address"
            />
          </div>

          {/* Products */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs">Products</Label>
              <Button variant="ghost" size="sm" onClick={addItem} className="h-7 text-xs">
                <Plus className="h-3 w-3 mr-1" />
                Add Product
              </Button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Select
                    value={item.product}
                    onValueChange={(v) => updateItem(i, "product", v)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCTS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={item.quantityDozens}
                    onChange={(e) => updateItem(i, "quantityDozens", Number(e.target.value))}
                    className="w-20 text-center"
                    placeholder="Dz"
                  />
                  <span className="text-xs text-muted-foreground w-16 text-right">
                    ${(item.quantityDozens * item.pricePerDozen).toFixed(2)}
                  </span>
                  {items.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(i)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Discount */}
          <div>
            <Label className="text-xs mb-1.5">Discount ($)</Label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              className="w-32"
            />
          </div>

          {/* Notes */}
          <div>
            <Label className="text-xs mb-1.5">Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Special instructions..."
              rows={2}
            />
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-data">${subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Discount</span>
                <span className="font-data text-red-600">-${discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-semibold pt-1 border-t">
              <span>Per Delivery Total</span>
              <span className="font-data">${total.toFixed(2)}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Est. {frequency === "weekly" ? "weekly" : frequency === "biweekly" ? "biweekly" : "monthly"} on {dayOfWeek}s
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="bg-amber-700 hover:bg-amber-800"
          >
            {createMutation.isPending ? "Creating..." : "Create Standing Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
