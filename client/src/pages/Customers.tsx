/**
 * Customers — Hinnawi Bros Bagels Wholesale
 * Full customer management: add, edit, view details, order history.
 * Includes suspect vs customer classification based on order history.
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
  Upload,
  Send,
  Copy,
  Check,
  FileSpreadsheet,
  Loader2,
  DollarSign,
  Package,
  UserX,
  UserCheck,
  TrendingUp,
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

type CsvRow = {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  segment: "cafe" | "restaurant" | "hotel" | "grocery" | "catering" | "university" | "other";
};

const QB_COLUMN_MAP: Record<string, keyof CsvRow> = {
  "customer": "businessName",
  "company": "businessName",
  "company name": "businessName",
  "display name": "businessName",
  "customer name": "businessName",
  "name": "contactName",
  "contact": "contactName",
  "contact name": "contactName",
  "first name": "contactName",
  "full name": "contactName",
  "email": "email",
  "email address": "email",
  "main email": "email",
  "phone": "phone",
  "phone number": "phone",
  "main phone": "phone",
  "mobile": "phone",
  "address": "address",
  "billing address": "address",
  "shipping address": "address",
  "street": "address",
};

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map((h) => h.replace(/^"|"$/g, "").trim());
  const rows = lines.slice(1).map((line) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });
  return { headers, rows };
}

function mapCsvToCustomers(headers: string[], rows: string[][]): CsvRow[] {
  const mapping: Record<number, keyof CsvRow> = {};
  headers.forEach((h, i) => {
    const key = h.toLowerCase().trim();
    if (QB_COLUMN_MAP[key]) mapping[i] = QB_COLUMN_MAP[key];
  });

  return rows
    .map((row) => {
      const obj: CsvRow = { businessName: "", contactName: "", email: "", phone: "", address: "", segment: "other" };
      Object.entries(mapping).forEach(([idx, field]) => {
        const val = row[Number(idx)] ?? "";
        if (val && !obj[field]) (obj as any)[field] = val;
      });
      // If no contact name, use business name
      if (!obj.contactName && obj.businessName) obj.contactName = obj.businessName;
      return obj;
    })
    .filter((r) => r.businessName || r.email);
}

function formatCurrency(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num) || num === 0) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export default function Customers() {
  const [search, setSearch] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "customer" | "suspect">("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [importOpen, setImportOpen] = useState(false);
  const [csvPreview, setCsvPreview] = useState<CsvRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteCustomerId, setInviteCustomerId] = useState<number | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  const { data: customers, isLoading, error } = trpc.customers.listWithStats.useQuery();
  const utils = trpc.useUtils();

  const createMut = trpc.customers.create.useMutation({
    onSuccess: () => {
      utils.customers.listWithStats.invalidate();
      utils.customers.list.invalidate();
      setAddOpen(false);
      setForm(emptyForm);
      toast.success("Customer added!");
    },
    onError: (err) => toast.error("Failed to add customer", { description: err.message }),
  });

  const updateMut = trpc.customers.update.useMutation({
    onSuccess: () => {
      utils.customers.listWithStats.invalidate();
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
      utils.customers.listWithStats.invalidate();
      utils.customers.list.invalidate();
      toast.success("Customer deleted");
    },
    onError: (err) => toast.error("Failed to delete", { description: err.message }),
  });

  const importMut = trpc.import.customers.useMutation({
    onSuccess: (data: { imported: number; skipped: number }) => {
      utils.customers.listWithStats.invalidate();
      utils.customers.list.invalidate();
      setImportResult({ imported: data.imported, skipped: data.skipped });
      toast.success(`Imported ${data.imported} customers`);
    },
    onError: (err: { message: string }) => toast.error("Import failed", { description: err.message }),
  });

  const createInviteMut = trpc.invites.create.useMutation({
    onSuccess: (data) => {
      setInviteLink(data.inviteUrl);
      toast.success("Invite link created!");
    },
    onError: (err) => toast.error("Failed to create invite", { description: err.message }),
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { headers, rows } = parseCsv(text);
      const mapped = mapCsvToCustomers(headers, rows);
      setCsvPreview(mapped);
      setImportResult(null);
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (csvPreview.length === 0) return;
    setImporting(true);
    importMut.mutate(
      { customers: csvPreview },
      { onSettled: () => setImporting(false) }
    );
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openInvite = (customer: any) => {
    setInviteCustomerId(customer.id);
    setInviteEmail(customer.email);
    setInviteLink("");
    setCopied(false);
    setInviteOpen(true);
  };

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

  const allCustomers = customers ?? [];

  const filtered = allCustomers.filter((c) => {
    const matchSearch =
      search === "" ||
      c.businessName.toLowerCase().includes(search.toLowerCase()) ||
      c.contactName.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchSegment = segmentFilter === "all" || c.segment === segmentFilter;
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    const matchType = typeFilter === "all" || c.classification === typeFilter;
    return matchSearch && matchSegment && matchStatus && matchType;
  });

  const segmentCounts = allCustomers.reduce(
    (acc, c) => {
      acc[c.segment] = (acc[c.segment] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const customerCount = allCustomers.filter(c => c.classification === "customer").length;
  const suspectCount = allCustomers.filter(c => c.classification === "suspect").length;
  const totalRevenue = allCustomers.reduce((sum, c) => sum + parseFloat(c.totalRevenue || "0"), 0);

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
            placeholder="e.g. Cafe du Plateau"
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
                Accounts
              </h1>
              <Badge variant="secondary" className="font-data text-xs">
                {allCustomers.length} total
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Manage wholesale accounts — suspects have no orders yet, customers have placed orders
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setImportOpen(true); setCsvPreview([]); setImportResult(null); }}
            >
              <Upload className="h-4 w-4 mr-1.5" />
              Import CSV
            </Button>
            <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) setForm(emptyForm); }}>
              <DialogTrigger asChild>
                <Button className="bg-amber-700 hover:bg-amber-800 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Account
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-display">Add New Account</DialogTitle>
                <DialogDescription>
                  Enter the business details for a new wholesale account.
                </DialogDescription>
              </DialogHeader>
              <CustomerForm
                onSubmit={handleCreate}
                submitLabel="Add Account"
                isPending={createMut.isPending}
              />
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 space-y-5 pb-6">
        {/* Classification summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card
            className={`border-border/50 py-0 cursor-pointer transition-colors hover:border-amber-300 ${
              typeFilter === "all" ? "border-amber-500 bg-amber-50/30" : ""
            }`}
            onClick={() => setTypeFilter("all")}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-100">
                  <Building2 className="h-4.5 w-4.5 text-stone-600" />
                </div>
                <div>
                  <div className="font-data text-lg font-semibold leading-none">{allCustomers.length}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">All Accounts</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`border-border/50 py-0 cursor-pointer transition-colors hover:border-emerald-300 ${
              typeFilter === "customer" ? "border-emerald-500 bg-emerald-50/30" : ""
            }`}
            onClick={() => setTypeFilter(typeFilter === "customer" ? "all" : "customer")}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                  <UserCheck className="h-4.5 w-4.5 text-emerald-700" />
                </div>
                <div>
                  <div className="font-data text-lg font-semibold leading-none text-emerald-700">{customerCount}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Customers</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`border-border/50 py-0 cursor-pointer transition-colors hover:border-orange-300 ${
              typeFilter === "suspect" ? "border-orange-500 bg-orange-50/30" : ""
            }`}
            onClick={() => setTypeFilter(typeFilter === "suspect" ? "all" : "suspect")}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-100">
                  <UserX className="h-4.5 w-4.5 text-orange-600" />
                </div>
                <div>
                  <div className="font-data text-lg font-semibold leading-none text-orange-600">{suspectCount}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Suspects</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 py-0">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                  <DollarSign className="h-4.5 w-4.5 text-amber-700" />
                </div>
                <div>
                  <div className="font-data text-lg font-semibold leading-none text-amber-700">{formatCurrency(totalRevenue)}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Total Revenue</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
              placeholder="Search accounts..."
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
                    {allCustomers.length === 0 ? "No accounts yet" : "No accounts match your filters"}
                  </EmptyTitle>
                  <EmptyDescription>
                    {allCustomers.length === 0
                      ? 'Click "Add Account" or convert a lead to create your first account.'
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
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider w-24">Type</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider w-44">Contact</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider w-28">Segment</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider w-20 text-right">Orders</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider w-28 text-right">Revenue</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider w-28">Last Order</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider w-24">Status</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((customer) => {
                    const seg = segmentConfig[customer.segment] || segmentConfig.other;
                    const SegIcon = seg.icon;
                    const isCustomer = customer.classification === "customer";
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
                          {isCustomer ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-medium gap-1">
                              <UserCheck className="h-3 w-3" />
                              Customer
                            </Badge>
                          ) : (
                            <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-[10px] font-medium gap-1">
                              <UserX className="h-3 w-3" />
                              Suspect
                            </Badge>
                          )}
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
                        <TableCell className="text-right">
                          <span className={`font-data text-sm font-medium ${isCustomer ? "text-foreground" : "text-muted-foreground"}`}>
                            {customer.orderCount}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-data text-sm font-medium ${isCustomer ? "text-emerald-700" : "text-muted-foreground"}`}>
                            {formatCurrency(customer.totalRevenue)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {customer.lastOrderDate ? (
                            <span className="text-xs text-muted-foreground">{formatDate(customer.lastOrderDate)}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground/50 italic">Never</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${statusColors[customer.status]} text-[10px] capitalize`}>
                            {customer.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 hover:text-blue-700"
                                  onClick={() => openInvite(customer)}
                                >
                                  <Send className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Invite to Portal</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => openEdit(customer)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit</TooltipContent>
                            </Tooltip>
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
                                  <AlertDialogTitle>Delete this account?</AlertDialogTitle>
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
            <DialogTitle className="font-display">Edit Account</DialogTitle>
            <DialogDescription>Update the account details.</DialogDescription>
          </DialogHeader>
          <CustomerForm
            onSubmit={handleUpdate}
            submitLabel="Save Changes"
            isPending={updateMut.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Import CSV Dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-amber-700" />
              Import from QuickBooks
            </DialogTitle>
            <DialogDescription>
              Export your Customer Contact List from QuickBooks as CSV, then upload it here.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-xs mb-1.5 block">Upload CSV File</Label>
              <Input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="h-10"
              />
            </div>

            {csvPreview.length > 0 && !importResult && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{csvPreview.length} customers found</p>
                  <Badge variant="secondary" className="text-xs">Preview</Badge>
                </div>
                <div className="max-h-64 overflow-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[11px]">Business Name</TableHead>
                        <TableHead className="text-[11px]">Contact</TableHead>
                        <TableHead className="text-[11px]">Email</TableHead>
                        <TableHead className="text-[11px]">Phone</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvPreview.slice(0, 20).map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs">{row.businessName}</TableCell>
                          <TableCell className="text-xs">{row.contactName}</TableCell>
                          <TableCell className="text-xs">{row.email}</TableCell>
                          <TableCell className="text-xs">{row.phone}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {csvPreview.length > 20 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      ...and {csvPreview.length - 20} more
                    </p>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setImportOpen(false)}>Cancel</Button>
                  <Button
                    className="bg-amber-700 hover:bg-amber-800 text-white"
                    onClick={handleImport}
                    disabled={importing}
                  >
                    {importing ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importing...</>
                    ) : (
                      <><Upload className="h-4 w-4 mr-2" />Import {csvPreview.length} Customers</>
                    )}
                  </Button>
                </DialogFooter>
              </div>
            )}

            {importResult && (
              <div className="text-center py-4">
                <Check className="h-10 w-10 mx-auto text-green-500 mb-2" />
                <p className="text-sm font-semibold">Import Complete</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {importResult.imported} imported, {importResult.skipped} skipped (duplicates)
                </p>
                <Button className="mt-3" onClick={() => setImportOpen(false)}>Done</Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite to Portal Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-600" />
              Invite to Customer Portal
            </DialogTitle>
            <DialogDescription>
              Generate an invite link for this customer to access the self-service portal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-xs mb-1.5 block">Customer Email</Label>
              <Input value={inviteEmail} readOnly className="h-10 bg-muted/30" />
            </div>

            {!inviteLink ? (
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {
                  if (inviteCustomerId) {
                    createInviteMut.mutate({
                      customerId: inviteCustomerId,
                      email: inviteEmail,
                      origin: window.location.origin,
                    });
                  }
                }}
                disabled={createInviteMut.isPending}
              >
                {createInviteMut.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
                ) : (
                  <><Send className="h-4 w-4 mr-2" />Generate Invite Link</>
                )}
              </Button>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs mb-1.5 block">Invite Link</Label>
                  <div className="flex gap-2">
                    <Input value={inviteLink} readOnly className="h-10 text-xs font-mono" />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 shrink-0"
                      onClick={handleCopyInvite}
                    >
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this link with your customer. They will sign in and their account will be linked automatically. The link expires in 7 days.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
