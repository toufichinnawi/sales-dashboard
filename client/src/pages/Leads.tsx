/**
 * Leads — Hinnawi Bros Bagels Wholesale
 * View and manage incoming leads from the wholesale landing page contact form.
 * Includes "Add Lead Manually" dialog and "Convert to Customer" workflow.
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
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
  Inbox,
  Mail,
  Phone,
  Building2,
  User,
  Clock,
  Search,
  Trash2,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  UserCheck,
  Sparkles,
  Plus,
  UserPlus,
  FileText,
  Send,
  ExternalLink,
  Copy,
  Eye,
  CalendarPlus,
  AlertTriangle,
  Upload,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { SendBrochureModal } from "@/components/SendBrochureModal";

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  new: {
    label: "New",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Sparkles,
  },
  contacted: {
    label: "Contacted",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    icon: Mail,
  },
  interested: {
    label: "Interested",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: CheckCircle2,
  },
  tasting_scheduled: {
    label: "Tasting Scheduled",
    color: "bg-violet-100 text-violet-800 border-violet-200",
    icon: UserCheck,
  },
  quote_sent: {
    label: "Quote Sent",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: FileText,
  },
  negotiation: {
    label: "Negotiation",
    color: "bg-cyan-100 text-cyan-800 border-cyan-200",
    icon: MessageSquare,
  },
  won: {
    label: "Won",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle2,
  },
  lost: {
    label: "Lost",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
  },
};

const emptyForm = {
  name: "",
  business: "",
  email: "",
  phone: "",
  message: "",
  source: "manual",
};

export default function Leads() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [convertLead, setConvertLead] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [convertForm, setConvertForm] = useState({
    segment: "cafe" as string,
    address: "",
    notes: "",
  });
  const [brochureOpen, setBrochureOpen] = useState(false);
  const [brochureLead, setBrochureLead] = useState<any>(null);
  const [sendingBrochure, setSendingBrochure] = useState(false);
  const [showBrochurePreview, setShowBrochurePreview] = useState(false);
  const [brochurePreviewData, setBrochurePreviewData] = useState<{
    subject: string;
    body: string;
    brochureUrl: string;
    gmailUrl: string;
    outlookUrl: string;
    toEmail: string;
  } | null>(null);
  const [brochurePreviewLeadId, setBrochurePreviewLeadId] = useState<number>(0);

  const { data: leads, isLoading, error } = trpc.leads.list.useQuery();
  const utils = trpc.useUtils();

  const updateStatus = trpc.leads.updateStatus.useMutation({
    onSuccess: () => {
      utils.leads.list.invalidate();
      toast.success("Lead status updated");
    },
    onError: (err) => {
      toast.error("Failed to update status", { description: err.message });
    },
  });

  const deleteLeadMut = trpc.leads.delete.useMutation({
    onSuccess: () => {
      utils.leads.list.invalidate();
      toast.success("Lead deleted");
    },
    onError: (err) => {
      toast.error("Failed to delete lead", { description: err.message });
    },
  });

  const composeBrochureMailtoMut = trpc.leads.composeBrochureMailto.useMutation();
  const recordBrochureActivityMut = trpc.leads.recordBrochureActivity.useMutation({
    onSuccess: () => {
      utils.leads.list.invalidate();
    },
  });

  const createLeadMut = trpc.leads.create.useMutation({
    onSuccess: () => {
      utils.leads.list.invalidate();
      setAddOpen(false);
      setForm(emptyForm);
      toast.success("Lead added successfully!");
    },
    onError: (err) => {
      toast.error("Failed to add lead", { description: err.message });
    },
  });

  const createCustomerMut = trpc.customers.create.useMutation({
    onSuccess: () => {
      if (convertLead) {
        updateStatus.mutate({ id: convertLead.id, status: "won" });
      }
      utils.customers.list.invalidate();
      setConvertOpen(false);
      setConvertLead(null);
      toast.success("Lead converted to customer!");
    },
    onError: (err) => {
      toast.error("Failed to convert lead", { description: err.message });
    },
  });

  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    createLeadMut.mutate({
      name: form.name,
      business: form.business,
      email: form.email,
      phone: form.phone || undefined,
      message: form.message || undefined,
      source: "manual",
    });
  };

  const handleConvert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertLead) return;
    createCustomerMut.mutate({
      businessName: convertLead.business,
      contactName: convertLead.name,
      email: convertLead.email,
      phone: convertLead.phone || undefined,
      address: convertForm.address || undefined,
      segment: convertForm.segment as any,
      notes: convertForm.notes || undefined,
      status: "active",
    });
  };

  const openConvertDialog = (lead: any) => {
    setConvertLead(lead);
    setConvertForm({ segment: "cafe", address: "", notes: "" });
    setConvertOpen(true);
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
          <p className="text-muted-foreground">
            Please log in to view leads.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {error.message}
          </p>
        </div>
      </div>
    );
  }

  const filteredLeads = (leads ?? []).filter((lead) => {
    const matchesSearch =
      search === "" ||
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.business.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = (leads ?? []).reduce(
    (acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-CA", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(date));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="px-4 md:px-6 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Inbox className="h-6 w-6 text-amber-700" />
              <h1 className="font-display text-xl font-bold tracking-tight">
                Incoming Leads
              </h1>
              <Badge variant="secondary" className="font-data text-xs">
                {leads?.length ?? 0} total
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Manage leads from the wholesale page, phone calls, and meetings
            </p>
          </div>

          <div className="flex items-center gap-2">
          {/* Import Leads */}
          <Button
            variant="outline"
            className="border-amber-200 text-amber-700 hover:bg-amber-50"
            onClick={() => navigate("/leads-import")}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Leads
          </Button>

          {/* Send Brochure to All New Leads */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="border-amber-200 text-amber-700 hover:bg-amber-50"
                onClick={() => {
                  const newLeads = (leads ?? []).filter(l => l.status === 'new' && l.email);
                  if (newLeads.length === 0) {
                    toast.info('No new leads with email addresses to send to');
                    return;
                  }
                  setBrochureLead(null);
                  setBrochureOpen(true);
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Send Brochure
              </Button>
            </TooltipTrigger>
            <TooltipContent>Send wholesale brochure to all new leads</TooltipContent>
          </Tooltip>

          {/* Add Lead Manually Button */}
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-700 hover:bg-amber-800 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Lead Manually
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display">
                  Add Lead Manually
                </DialogTitle>
                <DialogDescription>
                  Enter details from a phone call, meeting, or referral.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddLead} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Contact Name *</Label>
                    <Input
                      placeholder="e.g. Jean Tremblay"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Business Name *</Label>
                    <Input
                      placeholder="e.g. Café du Plateau"
                      value={form.business}
                      onChange={(e) =>
                        setForm({ ...form, business: e.target.value })
                      }
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
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Phone</Label>
                    <Input
                      placeholder="514-555-1234"
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Notes / Message</Label>
                  <Textarea
                    placeholder="How did you meet? What are they interested in?"
                    value={form.message}
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
                    rows={3}
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAddOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-amber-700 hover:bg-amber-800 text-white"
                    disabled={createLeadMut.isPending}
                  >
                    {createLeadMut.isPending ? (
                      <Spinner className="h-4 w-4 mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Add Lead
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 space-y-5 pb-6">
        {/* Status summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(statusConfig).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <Card
                key={key}
                className={`border-border/50 py-0 cursor-pointer transition-colors hover:border-amber-300 ${
                  statusFilter === key
                    ? "border-amber-500 bg-amber-50/30"
                    : ""
                }`}
                onClick={() =>
                  setStatusFilter(statusFilter === key ? "all" : key)
                }
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground capitalize">
                      {config.label}
                    </span>
                  </div>
                  <div className="font-data text-lg font-semibold">
                    {statusCounts[key] || 0}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Search and filter */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 h-9 text-sm">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(statusConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Leads table */}
        {filteredLeads.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="py-16">
              <Empty>
                <EmptyMedia variant="icon">
                  <Inbox className="h-6 w-6" />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>
                    {leads?.length === 0
                      ? "No leads yet"
                      : "No leads match your filters"}
                  </EmptyTitle>
                  <EmptyDescription>
                    {leads?.length === 0
                      ? 'Click "Add Lead Manually" to enter your first lead, or share your wholesale landing page to start receiving leads.'
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
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider w-48">
                      Contact
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider w-44">
                      Business
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider w-24">
                      Source
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider w-28">
                      Status
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider">
                      Message
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider w-36">
                      Received
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider w-32">
                      Follow-up
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider w-28 text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => {
                    const status = statusConfig[lead.status];
                    return (
                      <TableRow key={lead.id} className="group cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/leads/${lead.id}`)}>
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm font-medium">
                                {lead.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <a
                                href={`mailto:${lead.email}`}
                                className="text-xs text-amber-700 hover:underline"
                              >
                                {lead.email}
                              </a>
                            </div>
                            {lead.phone && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                <a
                                  href={`tel:${lead.phone}`}
                                  className="text-xs text-muted-foreground hover:underline"
                                >
                                  {lead.phone}
                                </a>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{lead.business}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="text-[10px] capitalize"
                          >
                            {lead.source || "website"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={lead.status}
                            onValueChange={(value) =>
                              updateStatus.mutate({
                                id: lead.id,
                                status: value as any,
                              })
                            }
                          >
                            <SelectTrigger className="h-7 w-28 text-xs border-0 p-0">
                              <Badge
                                variant="outline"
                                className={`${status.color} text-[10px] font-medium`}
                              >
                                {status.label}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(statusConfig).map(
                                ([key, config]) => (
                                  <SelectItem key={key} value={key}>
                                    {config.label}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {lead.message ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-start gap-1.5 max-w-xs">
                                  <MessageSquare className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                                  <span className="text-xs text-muted-foreground line-clamp-2">
                                    {lead.message}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent
                                side="bottom"
                                className="max-w-sm text-xs"
                              >
                                {lead.message}
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-xs text-muted-foreground/50 italic">
                              No message
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {formatDate(lead.createdAt)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {lead.nextFollowUpDate ? (() => {
                            const isOverdue = lead.followUpStatus !== "done" && new Date(lead.nextFollowUpDate) < new Date(new Date().toDateString());
                            const isDone = lead.followUpStatus === "done";
                            return (
                              <div className="flex items-center gap-1.5">
                                {isOverdue ? (
                                  <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
                                ) : isDone ? (
                                  <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                                ) : (
                                  <CalendarPlus className="h-3 w-3 text-blue-500 shrink-0" />
                                )}
                                <span className={`text-xs ${
                                  isOverdue ? "text-red-600 font-medium" :
                                  isDone ? "text-green-600 line-through" :
                                  "text-muted-foreground"
                                }`}>
                                  {new Date(lead.nextFollowUpDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </span>
                                {isOverdue && (
                                  <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 text-[9px] h-4 px-1 font-medium">
                                    Overdue
                                  </Badge>
                                )}
                              </div>
                            );
                          })() : (
                            <span className="text-xs text-muted-foreground/40">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            {/* View Profile */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-stone-500 hover:text-stone-700 hover:bg-stone-50"
                                  onClick={() => navigate(`/leads/${lead.id}`)}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View Profile</TooltipContent>
                            </Tooltip>
                            {/* Send Brochure */}
                            {lead.email && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                    onClick={() => {
                                      setBrochureLead(lead);
                                      setBrochureOpen(true);
                                    }}
                                  >
                                    <Send className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Send Wholesale Brochure
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {/* Convert to Customer */}
                            {lead.status !== "won" && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                    onClick={() => openConvertDialog(lead)}
                                  >
                                    <UserPlus className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Convert to Customer
                                </TooltipContent>
                              </Tooltip>
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
                                  <AlertDialogTitle>
                                    Delete this lead?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently remove {lead.name}{" "}
                                    from {lead.business} from your leads. This
                                    action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      deleteLeadMut.mutate({ id: lead.id })
                                    }
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

      {/* Send Brochure Dialog — select target then open preview modal */}
      <Dialog open={brochureOpen} onOpenChange={setBrochureOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-700" />
              Send Wholesale Brochure
            </DialogTitle>
            <DialogDescription>
              {brochureLead ? (
                <>Send the wholesale pricing brochure to <strong>{brochureLead.name}</strong> at <strong>{brochureLead.email}</strong>.</>
              ) : (
                <>Send the wholesale pricing brochure to all <strong>{(leads ?? []).filter(l => l.status === 'new' && l.email).length}</strong> new leads with email addresses.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 space-y-2">
            <p className="text-sm font-medium text-amber-900">Brochure includes:</p>
            <ul className="text-xs text-amber-800 space-y-1">
              <li>• Full product lineup with wholesale pricing</li>
              <li>• Signature flavors: Sesame, Plain, Everything, Multigrain</li>
              <li>• Pack sizes and shelf life details</li>
              <li>• Delivery coverage (Greater Montréal)</li>
              <li>• Contact info: Rosalyn Menneh / Hinnawi Bros. Bagel & Café</li>
            </ul>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setBrochureOpen(false)}>Cancel</Button>
            <Button
              variant="outline"
              className="border-amber-200 text-amber-700 hover:bg-amber-50"
              onClick={() => {
                const targets = brochureLead
                  ? [brochureLead]
                  : (leads ?? []).filter(l => l.status === 'new' && l.email);
                if (targets.length === 0) {
                  toast.info('No leads with email addresses to copy');
                  return;
                }
                const emails = targets.map(t => t.email).join(', ');
                navigator.clipboard.writeText(emails);
                toast.success(`Copied ${targets.length} email${targets.length > 1 ? 's' : ''} to clipboard`);
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Email{!brochureLead && (leads ?? []).filter(l => l.status === 'new' && l.email).length > 1 ? 's' : ''}
            </Button>
            <Button
              className="bg-amber-700 hover:bg-amber-800 text-white"
              disabled={sendingBrochure}
              onClick={async () => {
                setSendingBrochure(true);
                try {
                  const target = brochureLead
                    || (leads ?? []).filter(l => l.status === 'new' && l.email)[0];
                  if (!target) {
                    toast.info('No leads with email addresses');
                    return;
                  }

                  const result = await composeBrochureMailtoMut.mutateAsync({
                    leadId: target.id,
                    business: target.business || target.name || '',
                    email: target.email,
                  });

                  setBrochurePreviewData(result);
                  setBrochurePreviewLeadId(target.id);
                  setShowBrochurePreview(true);
                  setBrochureOpen(false);
                } catch (err) {
                  toast.error('Failed to compose brochure email. Please try again.');
                } finally {
                  setSendingBrochure(false);
                }
              }}
            >
              {sendingBrochure ? (
                <Spinner className="h-4 w-4 mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {brochureLead ? 'Compose Email' : 'Compose Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Brochure Preview Modal */}
      {brochurePreviewData && (
        <SendBrochureModal
          open={showBrochurePreview}
          onOpenChange={setShowBrochurePreview}
          toEmail={brochurePreviewData.toEmail}
          subject={brochurePreviewData.subject}
          body={brochurePreviewData.body}
          brochureUrl={brochurePreviewData.brochureUrl}
          gmailUrl={brochurePreviewData.gmailUrl}
          outlookUrl={brochurePreviewData.outlookUrl}
          onEmailOpened={() => {
            recordBrochureActivityMut.mutate({
              leadId: brochurePreviewLeadId,
              email: brochurePreviewData.toEmail,
            });
          }}
        />
      )}

      {/* Convert to Customer Dialog */}
      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-emerald-600" />
              Convert to Customer
            </DialogTitle>
            <DialogDescription>
              {convertLead && (
                <>
                  Convert <strong>{convertLead.name}</strong> from{" "}
                  <strong>{convertLead.business}</strong> into an active
                  customer.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleConvert} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Business Segment *</Label>
              <Select
                value={convertForm.segment}
                onValueChange={(v) =>
                  setConvertForm({ ...convertForm, segment: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cafe">Cafe</SelectItem>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="hotel">Hotel</SelectItem>
                  <SelectItem value="grocery">Grocery Store</SelectItem>
                  <SelectItem value="catering">Catering Company</SelectItem>
                  <SelectItem value="university">University</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Delivery Address</Label>
              <Input
                placeholder="123 Rue Saint-Laurent, Montreal"
                value={convertForm.address}
                onChange={(e) =>
                  setConvertForm({ ...convertForm, address: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Textarea
                placeholder="Delivery preferences, order frequency, etc."
                value={convertForm.notes}
                onChange={(e) =>
                  setConvertForm({ ...convertForm, notes: e.target.value })
                }
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setConvertOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={createCustomerMut.isPending}
              >
                {createCustomerMut.isPending ? (
                  <Spinner className="h-4 w-4 mr-2" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Convert to Customer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
