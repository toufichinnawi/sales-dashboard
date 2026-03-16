/**
 * Customers — Hinnawi Bros Bagels Wholesale
 * Full customer management: add, edit, view details, order history.
 */

import { useState } from "react";
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
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Search,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  Store,
  Coffee,
  UtensilsCrossed,
  Hotel,
  ShoppingCart,
  GraduationCap,
  MoreHorizontal,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { toast } from "sonner";

const segmentConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  cafe: { label: "Cafe", icon: Coffee, color: "bg-amber-100 text-amber-800" },
  restaurant: { label: "Restaurant", icon: UtensilsCrossed, color: "bg-orange-100 text-orange-800" },
  hotel: { label: "Hotel", icon: Hotel, color: "bg-blue-100 text-blue-800" },
  grocery: { label: "Grocery", icon: ShoppingCart, color: "bg-green-100 text-green-800" },
  catering: { label: "Catering", icon: Store, color: "bg-violet-100 text-violet-800" },
  university: { label: "University", icon: GraduationCap, color: "bg-indigo-100 text-indigo-800" },
  other: { label: "Other", icon: MoreHorizontal, color: "bg-stone-100 text-stone-800" },
};

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  inactive: "bg-stone-100 text-stone-600 border-stone-200",
  prospect: "bg-blue-100 text-blue-800 border-blue-200",
};

const emptyForm = {
  businessName: "",
  contactName: "",
  email: "",
  phone: "",
  address: "",
  segment: "cafe" as string,
  notes: "",
  status: "active" as string,
};

export default function Customers() {
  const [search, setSearch] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: customers, isLoading, error } = trpc.customers.list.useQuery();
  const utils = trpc.useUtils();

  const createMut = trpc.customers.create.useMutation({
    onSuccess: () => {
      utils.customers.list.invalidate();
      setAddOpen(false);
      setForm(emptyForm);
      toast.success("Customer added!");
    },
    onError: (err) => toast.error("Failed to add customer", { description: err.message }),
  });

  const updateMut = trpc.customers.update.useMutation({
    onSuccess: () => {
      utils.customers.list.invalidate();
      setEditOpen(false);
      setEditId(null);
      setForm(emptyForm);
      toast.success("Customer updated!");
    },
    onError: (err) => toast.error("Failed to update", { description: err.message }),
  });

  const deleteMut = trpc.customers.delete.useMutation({
    onSuccess: () => {
      utils.customers.list.invalidate();
      toast.success("Customer deleted");
    },
    onError: (err) => toast.error("Failed to delete", { description: err.message }),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate({
      businessName: form.businessName,
      contactName: form.contactName,
      email: form.email,
      phone: form.phone || undefined,
      address: form.address || undefined,
      segment: form.segment as any,
      notes: form.notes || undefined,
      status: form.status as any,
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    updateMut.mutate({
      id: editId,
      businessName: form.businessName,
      contactName: form.contactName,
      email: form.email,
      phone: form.phone || null,
      address: form.address || null,
      segment: form.segment as any,
      notes: form.notes || null,
      status: form.status as any,
    });
  };

  const openEdit = (customer: any) => {
    setEditId(customer.id);
    setForm({
      businessName: customer.businessName,
      contactName: customer.contactName,
      email: customer.email,
      phone: customer.phone || "",
      address: customer.address || "",
      segment: customer.segment,
      notes: customer.notes || "",
      status: customer.status,
    });
    setEditOpen(true);
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
          <p className="text-muted-foreground">Please log in to view customers.</p>
        </div>
      </div>
    );
  }

  const filtered = (customers ?? []).filter((c) => {
    const matchSearch =
      search === "" ||
      c.businessName.toLowerCase().includes(search.toLowerCase()) ||
      c.contactName.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchSegment = segmentFilter === "all" || c.segment === segmentFilter;
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchSegment && matchStatus;
  });

  const segmentCounts = (customers ?? []).reduce(
    (acc, c) => {
      acc[c.segment] = (acc[c.segment] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));

  const CustomerForm = ({
    onSubmit,
    submitLabel,
    isPending,
  }: {
    onSubmit: (e: React.FormEvent) => void;
    submitLabel: string;
    isPending: boolean;
  }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Business Name *</Label>
          <Input
            placeholder="e.g. Café du Plateau"
            value={form.businessName}
            onChange={(e) => setForm({ ...form, businessName: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Contact Name *</Label>
          <Input
            placeholder="e.g. Jean Tremblay"
            value={form.contactName}
            onChange={(e) => setForm({ ...form, contactName: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Email *</Label>
          <Input
            type="email"
            placeholder="jean@cafe.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Phone</Label>
          <Input
            placeholder="514-555-1234"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Delivery Address</Label>
        <Input
          placeholder="123 Rue Saint-Laurent, Montreal, QC"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Segment *</Label>
          <Select
            value={form.segment}
            onValueChange={(v) => setForm({ ...form, segment: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(segmentConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Status</Label>
          <Select
            value={form.status}
            onValueChange={(v) => setForm({ ...form, status: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="prospect">Prospect</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Notes</Label>
        <Textarea
          placeholder="Delivery preferences, order frequency, special requests..."
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={3}
        />
      </div>
      <DialogFooter>
        <Button type="submit" className="bg-amber-700 hover:bg-amber-800 text-white" disabled={isPending}>
          {isPending && <Spinner className="h-4 w-4 mr-2" />}
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="px-4 md:px-6 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Building2 className="h-6 w-6 text-amber-700" />
              <h1 className="font-display text-xl font-bold tracking-tight">
                Customers
              </h1>
              <Badge variant="secondary" className="font-data text-xs">
                {customers?.length ?? 0} total
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Your wholesale customer accounts
            </p>
          </div>

          <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) setForm(emptyForm); }}>
            <DialogTrigger asChild>
              <Button className="bg-amber-700 hover:bg-amber-800 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-display">Add New Customer</DialogTitle>
                <DialogDescription>
                  Enter the business details for a new wholesale customer.
                </DialogDescription>
              </DialogHeader>
              <CustomerForm
                onSubmit={handleCreate}
                submitLabel="Add Customer"
                isPending={createMut.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="px-4 md:px-6 space-y-5 pb-6">
        {/* Segment summary */}
        <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
          {Object.entries(segmentConfig).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <Card
                key={key}
                className={`border-border/50 py-0 cursor-pointer transition-colors hover:border-amber-300 ${
                  segmentFilter === key ? "border-amber-500 bg-amber-50/30" : ""
                }`}
                onClick={() => setSegmentFilter(segmentFilter === key ? "all" : key)}
              >
                <CardContent className="p-2.5 text-center">
                  <Icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <div className="font-data text-sm font-semibold">{segmentCounts[key] || 0}</div>
                  <div className="text-[10px] text-muted-foreground">{config.label}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Search and filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-9 text-sm">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="prospect">Prospect</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Customers table */}
        {filtered.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="py-16">
              <Empty>
                <EmptyMedia variant="icon">
                  <Building2 className="h-6 w-6" />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>
                    {(customers?.length ?? 0) === 0 ? "No customers yet" : "No customers match your filters"}
                  </EmptyTitle>
                  <EmptyDescription>
                    {(customers?.length ?? 0) === 0
                      ? 'Click "Add Customer" or convert a lead to create your first customer.'
                      : "Try adjusting your search or filters."}
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
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider w-52">Business</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider w-44">Contact</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider w-28">Segment</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider w-24">Status</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Address</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider w-32">Added</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((customer) => {
                    const seg = segmentConfig[customer.segment] || segmentConfig.other;
                    const SegIcon = seg.icon;
                    return (
                      <TableRow key={customer.id} className="group">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${seg.color}`}>
                              <SegIcon className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-sm font-medium">{customer.businessName}</div>
                              {customer.notes && (
                                <div className="text-[10px] text-muted-foreground line-clamp-1 max-w-[180px]">
                                  {customer.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{customer.contactName}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <a href={`mailto:${customer.email}`} className="text-xs text-amber-700 hover:underline">
                                {customer.email}
                              </a>
                            </div>
                            {customer.phone && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">{customer.phone}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${seg.color} text-[10px]`}>
                            {seg.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${statusColors[customer.status]} text-[10px] capitalize`}>
                            {customer.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {customer.address ? (
                            <div className="flex items-start gap-1.5 max-w-xs">
                              <MapPin className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                              <span className="text-xs text-muted-foreground line-clamp-2">{customer.address}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground/50 italic">No address</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">{formatDate(customer.createdAt)}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => openEdit(customer)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
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
                                  <AlertDialogTitle>Delete this customer?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently remove {customer.businessName}. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteMut.mutate({ id: customer.id })}
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

      {/* Edit Customer Dialog */}
      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) { setEditId(null); setForm(emptyForm); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Customer</DialogTitle>
            <DialogDescription>Update the customer details.</DialogDescription>
          </DialogHeader>
          <CustomerForm
            onSubmit={handleUpdate}
            submitLabel="Save Changes"
            isPending={updateMut.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
