/**
 * Orders — Hinnawi Bros Bagels Wholesale
 * Full order management: create orders, track status, revenue calculations.
 * Products: Plain $8/dz, Sesame $8.50/dz, Everything $9/dz
 */

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ShoppingBag,
  Plus,
  Trash2,
  AlertCircle,
  Package,
  DollarSign,
  Truck,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Eye,
  Calendar,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// Product pricing
const PRODUCTS = [
  { id: "plain" as const, name: "Plain Bagel", nameFr: "Nature", price: 8.0 },
  { id: "sesame" as const, name: "Sesame Bagel", nameFr: "Sésame", price: 8.5 },
  { id: "everything" as const, name: "Everything Bagel", nameFr: "Tout garni", price: 9.0 },
];

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ElementType; next?: string }
> = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
    next: "confirmed",
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: CheckCircle2,
    next: "preparing",
  },
  preparing: {
    label: "Preparing",
    color: "bg-violet-100 text-violet-800 border-violet-200",
    icon: Package,
    next: "delivered",
  },
  delivered: {
    label: "Delivered",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: Truck,
    next: "paid",
  },
  paid: {
    label: "Paid",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: DollarSign,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
  },
};

type OrderItem = {
  product: "plain" | "sesame" | "everything";
  quantityDozens: number;
  pricePerDozen: number;
};

const emptyItem: OrderItem = { product: "plain", quantityDozens: 1, pricePerDozen: 8.0 };

export default function Orders() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewOrderId, setViewOrderId] = useState<number | null>(null);

  // Create order form state
  const [customerId, setCustomerId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [discount, setDiscount] = useState(0);
  const [items, setItems] = useState<OrderItem[]>([{ ...emptyItem }]);

  const { data: orders, isLoading, error } = trpc.orders.list.useQuery();
  const { data: customers } = trpc.customers.list.useQuery();
  const { data: orderDetail } = trpc.orders.getById.useQuery(
    { id: viewOrderId! },
    { enabled: viewOrderId !== null }
  );
  const utils = trpc.useUtils();

  const createMut = trpc.orders.create.useMutation({
    onSuccess: (data) => {
      utils.orders.list.invalidate();
      setCreateOpen(false);
      resetForm();
      toast.success(`Order ${data.order?.orderNumber} created!`);
    },
    onError: (err) => toast.error("Failed to create order", { description: err.message }),
  });

  const updateStatusMut = trpc.orders.updateStatus.useMutation({
    onSuccess: () => {
      utils.orders.list.invalidate();
      if (viewOrderId) utils.orders.getById.invalidate({ id: viewOrderId });
      toast.success("Order status updated");
    },
    onError: (err) => toast.error("Failed to update status", { description: err.message }),
  });

  const deleteMut = trpc.orders.delete.useMutation({
    onSuccess: () => {
      utils.orders.list.invalidate();
      toast.success("Order deleted");
    },
    onError: (err) => toast.error("Failed to delete", { description: err.message }),
  });

  const resetForm = () => {
    setCustomerId("");
    setDeliveryDate("");
    setDeliveryAddress("");
    setOrderNotes("");
    setDiscount(0);
    setItems([{ ...emptyItem }]);
  };

  const addItem = () => {
    setItems([...items, { ...emptyItem }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    // Auto-update price when product changes
    if (field === "product") {
      const product = PRODUCTS.find((p) => p.id === value);
      if (product) newItems[index].pricePerDozen = product.price;
    }
    setItems(newItems);
  };

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.quantityDozens * item.pricePerDozen, 0),
    [items]
  );
  const total = useMemo(() => Math.max(0, subtotal - discount), [subtotal, discount]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      toast.error("Please select a customer");
      return;
    }
    if (!deliveryDate) {
      toast.error("Please select a delivery date");
      return;
    }
    createMut.mutate({
      customerId: Number(customerId),
      deliveryDate,
      deliveryAddress: deliveryAddress || undefined,
      notes: orderNotes || undefined,
      discount,
      items: items.map((item) => ({
        product: item.product,
        quantityDozens: item.quantityDozens,
        pricePerDozen: item.pricePerDozen,
      })),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner className="h-8 w-8 text-amber-700" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
          <p className="text-muted-foreground">Please log in to view orders.</p>
        </div>
      </div>
    );
  }

  const filtered = (orders ?? []).filter((o) => {
    const matchSearch =
      search === "" ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusCounts = (orders ?? []).reduce(
    (acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const totalRevenue = (orders ?? [])
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + Number(o.total), 0);

  const paidRevenue = (orders ?? [])
    .filter((o) => o.status === "paid")
    .reduce((sum, o) => sum + Number(o.total), 0);

  const pendingRevenue = (orders ?? [])
    .filter((o) => !["paid", "cancelled"].includes(o.status))
    .reduce((sum, o) => sum + Number(o.total), 0);

  const totalDozens = (orders ?? [])
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => {
      // We don't have items in list view, estimate from total/avg price
      return sum;
    }, 0);

  const formatDate = (date: Date | string) =>
    new Intl.DateTimeFormat("en-CA", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));

  const formatCurrency = (amount: number | string) =>
    `$${Number(amount).toFixed(2)}`;

  // Find customer name by ID
  const getCustomerName = (id: number) => {
    const customer = (customers ?? []).find((c) => c.id === id);
    return customer?.businessName || `Customer #${id}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="px-4 md:px-6 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <ShoppingBag className="h-6 w-6 text-amber-700" />
              <h1 className="font-display text-xl font-bold tracking-tight">
                Orders
              </h1>
              <Badge variant="secondary" className="font-data text-xs">
                {orders?.length ?? 0} total
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Manage wholesale orders, track deliveries, and collect payments
            </p>
          </div>

          <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-amber-700 hover:bg-amber-800 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Order
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display">Create New Order</DialogTitle>
                <DialogDescription>
                  Select a customer, add products, and set the delivery date.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-5">
                {/* Customer selection */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Customer *</Label>
                  {(customers?.length ?? 0) === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No customers yet. Add a customer first from the Customers page.
                    </p>
                  ) : (
                    <Select value={customerId} onValueChange={setCustomerId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(customers ?? []).map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.businessName} — {c.contactName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Delivery info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Delivery Date *</Label>
                    <Input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Delivery Address</Label>
                    <Input
                      placeholder="Leave blank to use customer address"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                    />
                  </div>
                </div>

                {/* Order items */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Products *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={addItem}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Product
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-3 rounded-lg border border-border/50 bg-muted/30"
                      >
                        <div className="flex-1">
                          <Select
                            value={item.product}
                            onValueChange={(v) => updateItem(index, "product", v)}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PRODUCTS.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name} — ${p.price.toFixed(2)}/dz
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-24">
                          <Input
                            type="number"
                            min="0.5"
                            step="0.5"
                            value={item.quantityDozens}
                            onChange={(e) =>
                              updateItem(index, "quantityDozens", Number(e.target.value))
                            }
                            className="h-8 text-sm text-center"
                            placeholder="Dozens"
                          />
                        </div>
                        <div className="text-xs text-muted-foreground w-8 text-center">dz</div>
                        <div className="w-20 text-right">
                          <span className="font-data text-sm font-medium">
                            {formatCurrency(item.quantityDozens * item.pricePerDozen)}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
                          onClick={() => removeItem(index)}
                          disabled={items.length <= 1}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Discount */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Discount ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount || ""}
                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-32"
                  />
                </div>

                {/* Order summary */}
                <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-data font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="font-data font-medium text-red-600">
                        -{formatCurrency(discount)}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-base font-semibold">
                    <span>Total</span>
                    <span className="font-data text-amber-800">{formatCurrency(total)}</span>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Order Notes</Label>
                  <Textarea
                    placeholder="Special instructions, delivery notes..."
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    rows={2}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-amber-700 hover:bg-amber-800 text-white"
                    disabled={createMut.isPending || !customerId || !deliveryDate}
                  >
                    {createMut.isPending ? (
                      <Spinner className="h-4 w-4 mr-2" />
                    ) : (
                      <ShoppingBag className="h-4 w-4 mr-2" />
                    )}
                    Create Order
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="px-4 md:px-6 space-y-5 pb-6">
        {/* Revenue KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-border/50 py-0">
            <CardContent className="p-3.5">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">Total Revenue</span>
              </div>
              <div className="font-data text-lg font-semibold text-amber-800">
                {formatCurrency(totalRevenue)}
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 py-0">
            <CardContent className="p-3.5">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-[11px] text-muted-foreground">Paid</span>
              </div>
              <div className="font-data text-lg font-semibold text-emerald-700">
                {formatCurrency(paidRevenue)}
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 py-0">
            <CardContent className="p-3.5">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-3.5 w-3.5 text-yellow-600" />
                <span className="text-[11px] text-muted-foreground">Outstanding</span>
              </div>
              <div className="font-data text-lg font-semibold text-yellow-700">
                {formatCurrency(pendingRevenue)}
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 py-0">
            <CardContent className="p-3.5">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">Active Orders</span>
              </div>
              <div className="font-data text-lg font-semibold">
                {(orders ?? []).filter((o) => !["paid", "cancelled"].includes(o.status)).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status filter chips */}
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={statusFilter === "all" ? "default" : "outline"}
            className={`cursor-pointer text-xs ${statusFilter === "all" ? "bg-amber-700" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            All ({orders?.length ?? 0})
          </Badge>
          {Object.entries(statusConfig).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <Badge
                key={key}
                variant="outline"
                className={`cursor-pointer text-xs ${
                  statusFilter === key ? config.color + " font-semibold" : ""
                }`}
                onClick={() => setStatusFilter(statusFilter === key ? "all" : key)}
              >
                <Icon className="h-3 w-3 mr-1" />
                {config.label} ({statusCounts[key] || 0})
              </Badge>
            );
          })}
        </div>

        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by order number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>

        {/* Orders table */}
        {filtered.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="py-16">
              <Empty>
                <EmptyMedia variant="icon">
                  <ShoppingBag className="h-6 w-6" />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>
                    {(orders?.length ?? 0) === 0 ? "No orders yet" : "No orders match your filters"}
                  </EmptyTitle>
                  <EmptyDescription>
                    {(orders?.length ?? 0) === 0
                      ? 'Click "Create Order" to place your first wholesale order.'
                      : "Try adjusting your search or status filter."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/50 py-0">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider w-28">Order #</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider w-44">Customer</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider w-28">Status</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider w-32">Delivery</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider w-24 text-right">Total</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider w-32">Created</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider w-28 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((order) => {
                    const status = statusConfig[order.status];
                    const StatusIcon = status.icon;
                    return (
                      <TableRow key={order.id} className="group">
                        <TableCell>
                          <span className="font-data text-sm font-semibold text-amber-800">
                            {order.orderNumber}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{getCustomerName(order.customerId)}</span>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={order.status}
                            onValueChange={(value) =>
                              updateStatusMut.mutate({
                                id: order.id,
                                status: value as any,
                              })
                            }
                          >
                            <SelectTrigger className="h-7 w-28 text-xs border-0 p-0">
                              <Badge
                                variant="outline"
                                className={`${status.color} text-[10px] font-medium`}
                              >
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {status.label}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(statusConfig).map(([key, config]) => (
                                <SelectItem key={key} value={key}>
                                  {config.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">{formatDate(order.deliveryDate)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-data text-sm font-semibold">
                            {formatCurrency(order.total)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(order.createdAt)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* View details */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                setViewOrderId(order.id);
                                setViewOpen(true);
                              }}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            {/* Advance status */}
                            {status.next && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity text-amber-700 hover:text-amber-800 hover:bg-amber-50"
                                onClick={() =>
                                  updateStatusMut.mutate({
                                    id: order.id,
                                    status: status.next as any,
                                  })
                                }
                              >
                                {statusConfig[status.next].label} &rarr;
                              </Button>
                            )}
                            {/* Delete */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-600"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete order {order.orderNumber}?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently remove this order and all its items. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteMut.mutate({ id: order.id })}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* View Order Detail Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-amber-700" />
              Order {orderDetail?.order?.orderNumber}
            </DialogTitle>
          </DialogHeader>
          {orderDetail ? (
            <div className="space-y-4">
              {/* Order info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">Customer</span>
                  <span className="font-medium">{getCustomerName(orderDetail.order.customerId)}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Status</span>
                  <Badge
                    variant="outline"
                    className={`${statusConfig[orderDetail.order.status]?.color} text-xs mt-0.5`}
                  >
                    {statusConfig[orderDetail.order.status]?.label}
                  </Badge>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Delivery Date</span>
                  <span>{formatDate(orderDetail.order.deliveryDate)}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Created</span>
                  <span>{formatDate(orderDetail.order.createdAt)}</span>
                </div>
                {orderDetail.order.deliveryAddress && (
                  <div className="col-span-2">
                    <span className="text-xs text-muted-foreground block">Delivery Address</span>
                    <span>{orderDetail.order.deliveryAddress}</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Items */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Order Items
                </h4>
                <div className="space-y-2">
                  {orderDetail.items.map((item, i) => {
                    const product = PRODUCTS.find((p) => p.id === item.product);
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 rounded-md bg-muted/50"
                      >
                        <div>
                          <span className="text-sm font-medium">
                            {product?.name || item.product}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {item.quantityDozens} dz @ ${Number(item.pricePerDozen).toFixed(2)}/dz
                          </span>
                        </div>
                        <span className="font-data text-sm font-medium">
                          {formatCurrency(item.lineTotal)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-data">{formatCurrency(orderDetail.order.subtotal)}</span>
                </div>
                {Number(orderDetail.order.discount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-data text-red-600">
                      -{formatCurrency(orderDetail.order.discount)}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span className="font-data text-amber-800">
                    {formatCurrency(orderDetail.order.total)}
                  </span>
                </div>
              </div>

              {orderDetail.order.notes && (
                <>
                  <Separator />
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Notes</span>
                    <p className="text-sm">{orderDetail.order.notes}</p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-6 w-6 text-amber-700" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
