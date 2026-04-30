/**
 * Lead Profile — Hinnawi Bros Bagels Wholesale
 * Detailed view and edit page for a single lead.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Save,
  X,
  Edit3,
  CheckCircle2,
  XCircle,
  PhoneCall,
  CalendarPlus,
  Trophy,
  Ban,
  Package,
  Tag,
  MessageSquare,
  TrendingUp,
  UserCheck,
  AlertTriangle,
  Plus,
  FileText,
  Send,
  UtensilsCrossed,
  DollarSign,
  Activity,
  History,
  Flame,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "new", label: "New", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "contacted", label: "Contacted", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "interested", label: "Interested", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "tasting_scheduled", label: "Tasting Scheduled", color: "bg-violet-100 text-violet-700 border-violet-200" },
  { value: "quote_sent", label: "Quote Sent", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { value: "negotiation", label: "Negotiation", color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  { value: "won", label: "Won", color: "bg-green-100 text-green-700 border-green-200" },
  { value: "lost", label: "Lost", color: "bg-red-100 text-red-700 border-red-200" },
] as const;

const BUSINESS_TYPE_OPTIONS = [
  { value: "cafe", label: "Cafe" },
  { value: "restaurant", label: "Restaurant" },
  { value: "grocery", label: "Grocery" },
  { value: "hotel", label: "Hotel" },
  { value: "caterer", label: "Caterer" },
  { value: "other", label: "Other" },
] as const;

const LEAD_SOURCE_OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "referral", label: "Referral" },
  { value: "website", label: "Website" },
  { value: "walk_in", label: "Walk-in" },
  { value: "cold_call", label: "Cold Call" },
  { value: "other", label: "Other" },
] as const;

const POTENTIAL_OPTIONS = [
  { value: "low", label: "Low", color: "bg-stone-100 text-stone-600 border-stone-200" },
  { value: "medium", label: "Medium", color: "bg-amber-100 text-amber-600 border-amber-200" },
  { value: "high", label: "High", color: "bg-emerald-100 text-emerald-600 border-emerald-200" },
] as const;

const LOST_REASON_OPTIONS = [
  { value: "price_too_high", label: "Price Too High" },
  { value: "no_response", label: "No Response" },
  { value: "not_interested", label: "Not Interested" },
  { value: "already_has_supplier", label: "Already Has Supplier" },
  { value: "location_issue", label: "Location Issue" },
  { value: "product_mismatch", label: "Product Mismatch" },
  { value: "other", label: "Other" },
] as const;

const FOLLOW_UP_PRIORITY_OPTIONS = [
  { value: "low", label: "Low", color: "bg-stone-100 text-stone-600 border-stone-200" },
  { value: "normal", label: "Normal", color: "bg-blue-100 text-blue-600 border-blue-200" },
  { value: "high", label: "High", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-700 border-red-200" },
] as const;

function getFollowUpComputedStatus(lead: { nextFollowUpDate: Date | string | null; followUpStatus: string | null }) {
  if (!lead.nextFollowUpDate) return null;
  if (lead.followUpStatus === "done") return "done";
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const followDate = new Date(lead.nextFollowUpDate);
  followDate.setHours(0, 0, 0, 0);
  if (followDate < now) return "overdue";
  return "pending";
}

function getFollowUpStatusBadge(computedStatus: string | null) {
  if (!computedStatus) return null;
  switch (computedStatus) {
    case "done":
      return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 text-xs">Done</Badge>;
    case "overdue":
      return <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 text-xs animate-pulse">Overdue</Badge>;
    case "pending":
      return <Badge variant="outline" className="bg-blue-100 text-blue-600 border-blue-200 text-xs">Pending</Badge>;
    default:
      return null;
  }
}

const ACTIVITY_TYPE_OPTIONS = [
  { value: "phone_call", label: "Phone Call" },
  { value: "email_sent", label: "Email Sent" },
  { value: "note_added", label: "Note Added" },
  { value: "follow_up_scheduled", label: "Follow-up Scheduled" },
  { value: "tasting_scheduled", label: "Tasting Scheduled" },
  { value: "quote_sent", label: "Quote Sent" },
] as const;

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  lead_created: Building2,
  status_changed: Activity,
  note_added: FileText,
  phone_call: PhoneCall,
  email_sent: Send,
  follow_up_scheduled: CalendarPlus,
  tasting_scheduled: UtensilsCrossed,
  quote_sent: DollarSign,
  marked_won: Trophy,
  marked_lost: Ban,
};

const ACTIVITY_COLORS: Record<string, string> = {
  lead_created: "bg-blue-50 text-blue-600",
  status_changed: "bg-amber-50 text-amber-600",
  note_added: "bg-stone-50 text-stone-600",
  phone_call: "bg-sky-50 text-sky-600",
  email_sent: "bg-violet-50 text-violet-600",
  follow_up_scheduled: "bg-indigo-50 text-indigo-600",
  tasting_scheduled: "bg-orange-50 text-orange-600",
  quote_sent: "bg-emerald-50 text-emerald-600",
  marked_won: "bg-green-50 text-green-700",
  marked_lost: "bg-red-50 text-red-600",
};

const ACTIVITY_LABELS: Record<string, string> = {
  lead_created: "Lead Created",
  status_changed: "Status Changed",
  note_added: "Note Added",
  phone_call: "Phone Call",
  email_sent: "Email Sent",
  follow_up_scheduled: "Follow-up Scheduled",
  tasting_scheduled: "Tasting Scheduled",
  quote_sent: "Quote Sent",
  marked_won: "Marked Won",
  marked_lost: "Marked Lost",
};

type FormData = {
  name: string;
  business: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  businessType: string;
  leadSource: string;
  potentialValue: string;
  estimatedWeeklyOrder: string;
  productsInterested: string;
  assignedTo: string;
  lastContactDate: string;
  nextFollowUpDate: string;
  notes: string;
  lostReason: string;
};

function formatDateForInput(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

function formatDisplayDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getStatusBadge(status: string) {
  const opt = STATUS_OPTIONS.find((s) => s.value === status);
  return opt ? (
    <Badge variant="outline" className={`${opt.color} border text-xs font-medium`}>
      {opt.label}
    </Badge>
  ) : (
    <Badge variant="outline" className="text-xs">{status}</Badge>
  );
}

function getPotentialBadge(value: string | null | undefined) {
  if (!value) return null;
  const opt = POTENTIAL_OPTIONS.find((p) => p.value === value);
  return opt ? (
    <Badge variant="outline" className={`${opt.color} border text-xs font-medium`}>
      {opt.label} Potential
    </Badge>
  ) : null;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function LeadProfile() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const leadId = Number(params.id);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormData>({
    name: "",
    business: "",
    email: "",
    phone: "",
    address: "",
    status: "new",
    businessType: "",
    leadSource: "",
    potentialValue: "",
    estimatedWeeklyOrder: "",
    productsInterested: "",
    assignedTo: "",
    lastContactDate: "",
    nextFollowUpDate: "",
    notes: "",
    lostReason: "",
  });

  const utils = trpc.useUtils();
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [activityType, setActivityType] = useState("");
  const [activityNote, setActivityNote] = useState("");
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [reschedulePriority, setReschedulePriority] = useState("normal");
  const [rescheduleNote, setRescheduleNote] = useState("");

  const { data: lead, isLoading, error } = trpc.leads.getById.useQuery(
    { id: leadId },
    { enabled: !isNaN(leadId) && leadId > 0 }
  );

  const { data: activities, isLoading: activitiesLoading } = trpc.leads.getActivities.useQuery(
    { leadId },
    { enabled: !isNaN(leadId) && leadId > 0 }
  );

  const addActivityMut = trpc.leads.addActivity.useMutation({
    onSuccess: () => {
      toast.success("Activity added");
      utils.leads.getActivities.invalidate({ leadId });
      setActivityDialogOpen(false);
      setActivityType("");
      setActivityNote("");
    },
    onError: (err) => {
      toast.error("Failed to add activity", { description: err.message });
    },
  });

  const handleAddActivity = useCallback(() => {
    if (!activityType) {
      toast.error("Please select an activity type");
      return;
    }
    addActivityMut.mutate({
      leadId,
      activityType: activityType as any,
      note: activityNote || null,
    });
  }, [leadId, activityType, activityNote, addActivityMut]);

  const updateMut = trpc.leads.update.useMutation({
    onSuccess: () => {
      toast.success("Lead updated successfully");
      utils.leads.getById.invalidate({ id: leadId });
      utils.leads.getActivities.invalidate({ leadId });
      utils.leads.list.invalidate();
      setEditing(false);
    },
    onError: (err) => {
      toast.error("Failed to update lead", { description: err.message });
    },
  });

  const composeBrochureMailtoMut = trpc.leads.composeBrochureMailto.useMutation({
    onSuccess: (data) => {
      window.open(data.mailtoUrl, "_blank");
      toast.success("Opening your email client...", {
        description: "The brochure email has been composed. Send it from your email client.",
      });
      utils.leads.getActivities.invalidate({ leadId });
    },
    onError: (err) => {
      toast.error("Failed to compose brochure email", { description: err.message });
    },
  });

  // Populate form when lead data loads
  useEffect(() => {
    if (lead) {
      setForm({
        name: lead.name || "",
        business: lead.business || "",
        email: lead.email || "",
        phone: lead.phone || "",
        address: lead.address || "",
        status: lead.status || "new",
        businessType: lead.businessType || "",
        leadSource: lead.leadSource || "",
        potentialValue: lead.potentialValue || "",
        estimatedWeeklyOrder: lead.estimatedWeeklyOrder || "",
        productsInterested: lead.productsInterested || "",
        assignedTo: lead.assignedTo || "",
        lastContactDate: formatDateForInput(lead.lastContactDate),
        nextFollowUpDate: formatDateForInput(lead.nextFollowUpDate),
        notes: lead.notes || "",
        lostReason: lead.lostReason || "",
      });
    }
  }, [lead]);

  const handleSave = () => {
    const payload: Record<string, unknown> = { id: leadId };

    // Only send changed fields
    if (form.name !== (lead?.name || "")) payload.name = form.name;
    if (form.business !== (lead?.business || "")) payload.business = form.business;
    if (form.email !== (lead?.email || "")) payload.email = form.email;
    if (form.phone !== (lead?.phone || "")) payload.phone = form.phone || null;
    if (form.address !== (lead?.address || "")) payload.address = form.address || null;
    if (form.status !== (lead?.status || "new")) payload.status = form.status;
    if (form.businessType !== (lead?.businessType || "")) payload.businessType = form.businessType || null;
    if (form.leadSource !== (lead?.leadSource || "")) payload.leadSource = form.leadSource || null;
    if (form.potentialValue !== (lead?.potentialValue || "")) payload.potentialValue = form.potentialValue || null;
    if (form.estimatedWeeklyOrder !== (lead?.estimatedWeeklyOrder || "")) payload.estimatedWeeklyOrder = form.estimatedWeeklyOrder || null;
    if (form.productsInterested !== (lead?.productsInterested || "")) payload.productsInterested = form.productsInterested || null;
    if (form.assignedTo !== (lead?.assignedTo || "")) payload.assignedTo = form.assignedTo || null;
    if (form.notes !== (lead?.notes || "")) payload.notes = form.notes || null;
    if (form.lostReason !== (lead?.lostReason || "")) payload.lostReason = form.lostReason || null;

    const lastContactOld = formatDateForInput(lead?.lastContactDate);
    const nextFollowOld = formatDateForInput(lead?.nextFollowUpDate);
    if (form.lastContactDate !== lastContactOld) {
      payload.lastContactDate = form.lastContactDate ? new Date(form.lastContactDate) : null;
    }
    if (form.nextFollowUpDate !== nextFollowOld) {
      payload.nextFollowUpDate = form.nextFollowUpDate ? new Date(form.nextFollowUpDate) : null;
    }

    updateMut.mutate(payload as any);
  };

  const handleCancel = () => {
    setEditing(false);
    if (lead) {
      setForm({
        name: lead.name || "",
        business: lead.business || "",
        email: lead.email || "",
        phone: lead.phone || "",
        address: lead.address || "",
        status: lead.status || "new",
        businessType: lead.businessType || "",
        leadSource: lead.leadSource || "",
        potentialValue: lead.potentialValue || "",
        estimatedWeeklyOrder: lead.estimatedWeeklyOrder || "",
        productsInterested: lead.productsInterested || "",
        assignedTo: lead.assignedTo || "",
        lastContactDate: formatDateForInput(lead.lastContactDate),
        nextFollowUpDate: formatDateForInput(lead.nextFollowUpDate),
        notes: lead.notes || "",
        lostReason: lead.lostReason || "",
      });
    }
  };

  // Quick actions
  const handleQuickAction = (status: string, lostReason?: string) => {
    const payload: Record<string, unknown> = {
      id: leadId,
      status,
      lastContactDate: new Date(),
    };
    if (lostReason) payload.lostReason = lostReason;
    updateMut.mutate(payload as any);
  };

  // Follow-up quick actions
  const handleMarkFollowUpDone = () => {
    updateMut.mutate({ id: leadId, followUpStatus: "done", lastContactDate: new Date() } as any);
  };

  const handleClearFollowUp = () => {
    updateMut.mutate({ id: leadId, nextFollowUpDate: null, followUpPriority: null, followUpNote: null, followUpStatus: null } as any);
  };

  const handleRescheduleFollowUp = () => {
    if (!rescheduleDate) {
      toast.error("Please select a date");
      return;
    }
    updateMut.mutate({
      id: leadId,
      nextFollowUpDate: new Date(rescheduleDate),
      followUpPriority: reschedulePriority || "normal",
      followUpNote: rescheduleNote || null,
      followUpStatus: "pending",
    } as any, {
      onSuccess: () => {
        setRescheduleDialogOpen(false);
        setRescheduleDate("");
        setReschedulePriority("normal");
        setRescheduleNote("");
      },
    });
  };

  const followUpComputedStatus = lead ? getFollowUpComputedStatus(lead) : null;

  // ─── Loading / Error states ────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8 text-amber-600" />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="p-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/leads")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Leads
        </Button>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-700 font-medium">Lead not found</p>
            <p className="text-red-500 text-sm mt-1">This lead may have been deleted.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/leads")}
            className="mt-0.5 h-8 w-8 p-0 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-display text-xl font-bold tracking-tight">
                {lead.business}
              </h1>
              {getStatusBadge(lead.status)}
              {getPotentialBadge(lead.potentialValue)}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {lead.name} · Added {formatDisplayDate(lead.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {editing ? (
            <>
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={updateMut.isPending}>
                <X className="h-3.5 w-3.5 mr-1.5" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={updateMut.isPending} className="bg-amber-600 hover:bg-amber-700 text-white">
                {updateMut.isPending ? <Spinner className="h-3.5 w-3.5 mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                Save Changes
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Edit3 className="h-3.5 w-3.5 mr-1.5" /> Edit
            </Button>
          )}
        </div>
      </div>

      {/* Overdue Follow-up Warning */}
      {followUpComputedStatus === "overdue" && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 shrink-0">
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Follow-up is overdue</p>
            <p className="text-xs text-red-600">
              Scheduled for {formatDisplayDate(lead.nextFollowUpDate)}
              {lead.followUpPriority && lead.followUpPriority !== "normal" && (
                <> · <span className="font-medium capitalize">{lead.followUpPriority}</span> priority</>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs border-red-200 text-red-700 hover:bg-red-100"
              onClick={() => {
                setRescheduleDate("");
                setReschedulePriority(lead.followUpPriority || "normal");
                setRescheduleNote(lead.followUpNote || "");
                setRescheduleDialogOpen(true);
              }}
              disabled={updateMut.isPending}
            >
              <RotateCcw className="h-3 w-3 mr-1" /> Reschedule
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white"
              onClick={handleMarkFollowUpDone}
              disabled={updateMut.isPending}
            >
              <CheckCircle2 className="h-3 w-3 mr-1" /> Mark Done
            </Button>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Main Details (2/3) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Business Information */}
          <Card className="border-border/50 py-0">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-display font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-amber-600" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FieldRow label="Business Name" icon={Building2} editing={editing}>
                  {editing ? (
                    <Input value={form.business} onChange={(e) => setForm({ ...form, business: e.target.value })} className="h-9" />
                  ) : (
                    <span className="text-sm font-medium">{lead.business}</span>
                  )}
                </FieldRow>

                <FieldRow label="Contact Person" icon={User} editing={editing}>
                  {editing ? (
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9" />
                  ) : (
                    <span className="text-sm">{lead.name}</span>
                  )}
                </FieldRow>

                <FieldRow label="Business Type" icon={Tag} editing={editing}>
                  {editing ? (
                    <Select value={form.businessType || "none"} onValueChange={(v) => setForm({ ...form, businessType: v === "none" ? "" : v })}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not set</SelectItem>
                        {BUSINESS_TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-sm">{BUSINESS_TYPE_OPTIONS.find((o) => o.value === lead.businessType)?.label || "—"}</span>
                  )}
                </FieldRow>

                <FieldRow label="Lead Source" icon={TrendingUp} editing={editing}>
                  {editing ? (
                    <Select value={form.leadSource || "none"} onValueChange={(v) => setForm({ ...form, leadSource: v === "none" ? "" : v })}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Select source" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not set</SelectItem>
                        {LEAD_SOURCE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-sm">{LEAD_SOURCE_OPTIONS.find((o) => o.value === lead.leadSource)?.label || lead.source || "—"}</span>
                  )}
                </FieldRow>

                <div className="md:col-span-2">
                  <FieldRow label="Address" icon={MapPin} editing={editing}>
                    {editing ? (
                      <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="h-9" placeholder="Business address" />
                    ) : (
                      <span className="text-sm">{lead.address || "—"}</span>
                    )}
                  </FieldRow>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sales Details */}
          <Card className="border-border/50 py-0">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-display font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-600" />
                Sales Details
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FieldRow label="Status" icon={CheckCircle2} editing={editing}>
                  {editing ? (
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    getStatusBadge(lead.status)
                  )}
                </FieldRow>

                <FieldRow label="Potential Value" icon={TrendingUp} editing={editing}>
                  {editing ? (
                    <Select value={form.potentialValue || "none"} onValueChange={(v) => setForm({ ...form, potentialValue: v === "none" ? "" : v })}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Select potential" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not set</SelectItem>
                        {POTENTIAL_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    getPotentialBadge(lead.potentialValue) || <span className="text-sm text-muted-foreground">—</span>
                  )}
                </FieldRow>

                <FieldRow label="Est. Weekly Order" icon={Package} editing={editing}>
                  {editing ? (
                    <Input value={form.estimatedWeeklyOrder} onChange={(e) => setForm({ ...form, estimatedWeeklyOrder: e.target.value })} className="h-9" placeholder="e.g. 10 dozen" />
                  ) : (
                    <span className="text-sm">{lead.estimatedWeeklyOrder || "—"}</span>
                  )}
                </FieldRow>

                <FieldRow label="Products Interested" icon={Package} editing={editing}>
                  {editing ? (
                    <Input value={form.productsInterested} onChange={(e) => setForm({ ...form, productsInterested: e.target.value })} className="h-9" placeholder="e.g. Plain, Sesame, Everything" />
                  ) : (
                    <span className="text-sm">{lead.productsInterested || "—"}</span>
                  )}
                </FieldRow>

                {/* Lost Reason - only show when status is Lost */}
                {(form.status === "lost" || lead.status === "lost") && (
                  <div className="md:col-span-2">
                    <FieldRow label="Lost Reason" icon={AlertTriangle} editing={editing}>
                      {editing ? (
                        <Select value={form.lostReason || "none"} onValueChange={(v) => setForm({ ...form, lostReason: v === "none" ? "" : v })}>
                          <SelectTrigger className="h-9"><SelectValue placeholder="Select reason" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Not set</SelectItem>
                            {LOST_REASON_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-sm text-red-600 font-medium">
                          {LOST_REASON_OPTIONS.find((o) => o.value === lead.lostReason)?.label || "—"}
                        </span>
                      )}
                    </FieldRow>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes & Message */}
          <Card className="border-border/50 py-0">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-display font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-amber-600" />
                Notes & Messages
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-4">
              {lead.message && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Original Message</Label>
                  <div className="bg-muted/50 rounded-md p-3 text-sm">{lead.message}</div>
                </div>
              )}
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Notes</Label>
                {editing ? (
                  <Textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={4}
                    placeholder="Add notes about this lead..."
                    className="resize-none"
                  />
                ) : (
                  <div className="bg-muted/30 rounded-md p-3 text-sm min-h-[60px]">
                    {lead.notes || <span className="text-muted-foreground italic">No notes yet</span>}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar (1/3) */}
        <div className="space-y-5">
          {/* Contact Info */}
          <Card className="border-border/50 py-0">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-display font-semibold">Contact</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-50 text-amber-600 shrink-0">
                  <Mail className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Email</p>
                  {editing ? (
                    <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-7 text-xs mt-0.5" />
                  ) : (
                    <a href={`mailto:${lead.email}`} className="text-sm text-amber-700 hover:underline truncate block">{lead.email}</a>
                  )}
                </div>
              </div>
              <Separator className="opacity-50" />
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-stone-50 text-stone-600 shrink-0">
                  <Phone className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Phone</p>
                  {editing ? (
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-7 text-xs mt-0.5" />
                  ) : (
                    <p className="text-sm">{lead.phone || "—"}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignment & Dates */}
          <Card className="border-border/50 py-0">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-display font-semibold">Assignment & Dates</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-violet-50 text-violet-600 shrink-0">
                  <UserCheck className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Assigned To</p>
                  {editing ? (
                    <Input value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} className="h-7 text-xs mt-0.5" placeholder="Team member name" />
                  ) : (
                    <p className="text-sm">{lead.assignedTo || "Unassigned"}</p>
                  )}
                </div>
              </div>
              <Separator className="opacity-50" />
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sky-50 text-sky-600 shrink-0">
                  <Calendar className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Last Contact</p>
                  {editing ? (
                    <Input type="date" value={form.lastContactDate} onChange={(e) => setForm({ ...form, lastContactDate: e.target.value })} className="h-7 text-xs mt-0.5" />
                  ) : (
                    <p className="text-sm">{formatDisplayDate(lead.lastContactDate)}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Follow-up Control */}
          <Card className={`py-0 ${
            followUpComputedStatus === "overdue" ? "border-red-300 bg-red-50/30" :
            followUpComputedStatus === "pending" ? "border-blue-200" : "border-border/50"
          }`}>
            <CardHeader className="pb-2 pt-4 px-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-display font-semibold flex items-center gap-2">
                  <CalendarPlus className={`h-4 w-4 ${
                    followUpComputedStatus === "overdue" ? "text-red-600" : "text-amber-600"
                  }`} />
                  Follow-up
                </CardTitle>
                {getFollowUpStatusBadge(followUpComputedStatus)}
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-3">
              {lead.nextFollowUpDate ? (
                <>
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-md shrink-0 ${
                      followUpComputedStatus === "overdue" ? "bg-red-100 text-red-600" :
                      followUpComputedStatus === "done" ? "bg-green-50 text-green-600" :
                      "bg-orange-50 text-orange-600"
                    }`}>
                      <Calendar className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Date</p>
                      <p className={`text-sm font-medium ${
                        followUpComputedStatus === "overdue" ? "text-red-700" : ""
                      }`}>{formatDisplayDate(lead.nextFollowUpDate)}</p>
                    </div>
                  </div>
                  <Separator className="opacity-50" />
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-50 text-amber-600 shrink-0">
                      <Flame className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Priority</p>
                      {(() => {
                        const pOpt = FOLLOW_UP_PRIORITY_OPTIONS.find(p => p.value === (lead.followUpPriority || "normal"));
                        return pOpt ? (
                          <Badge variant="outline" className={`${pOpt.color} border text-xs font-medium mt-0.5`}>{pOpt.label}</Badge>
                        ) : <span className="text-sm">Normal</span>;
                      })()}
                    </div>
                  </div>
                  {lead.followUpNote && (
                    <>
                      <Separator className="opacity-50" />
                      <div className="flex items-start gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-stone-50 text-stone-600 shrink-0">
                          <MessageSquare className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Note</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{lead.followUpNote}</p>
                        </div>
                      </div>
                    </>
                  )}
                  <Separator className="opacity-50" />
                  <div className="flex gap-2">
                    {followUpComputedStatus !== "done" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-7 text-xs text-green-700 hover:bg-green-50 border-green-200"
                        onClick={handleMarkFollowUpDone}
                        disabled={updateMut.isPending}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Done
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-7 text-xs text-blue-700 hover:bg-blue-50 border-blue-200"
                      onClick={() => {
                        setRescheduleDate("");
                        setReschedulePriority(lead.followUpPriority || "normal");
                        setRescheduleNote(lead.followUpNote || "");
                        setRescheduleDialogOpen(true);
                      }}
                      disabled={updateMut.isPending}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" /> Reschedule
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs text-stone-500 hover:bg-stone-50 border-stone-200 px-2"
                      onClick={handleClearFollowUp}
                      disabled={updateMut.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-3">
                  <Clock className="h-6 w-6 text-muted-foreground/30 mx-auto mb-1.5" />
                  <p className="text-xs text-muted-foreground mb-2">No follow-up scheduled</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs text-amber-700 hover:bg-amber-50 border-amber-200"
                    onClick={() => {
                      setRescheduleDate(new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0]);
                      setReschedulePriority("normal");
                      setRescheduleNote("");
                      setRescheduleDialogOpen(true);
                    }}
                  >
                    <CalendarPlus className="h-3 w-3 mr-1" /> Schedule Follow-up
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-border/50 py-0">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-display font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-2">
              {lead.status !== "contacted" && lead.status !== "won" && lead.status !== "lost" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-amber-700 hover:bg-amber-50 hover:text-amber-800 border-amber-200"
                  onClick={() => handleQuickAction("contacted")}
                  disabled={updateMut.isPending}
                >
                  <PhoneCall className="h-3.5 w-3.5 mr-2" />
                  Mark as Contacted
                </Button>
              )}
              {lead.email && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-blue-700 hover:bg-blue-50 hover:text-blue-800 border-blue-200"
                  onClick={() => {
                    composeBrochureMailtoMut.mutate({
                      leadId,
                      business: lead.business || lead.name || "",
                      email: lead.email!,
                    });
                  }}
                  disabled={composeBrochureMailtoMut.isPending}
                >
                  <Send className="h-3.5 w-3.5 mr-2" />
                  {composeBrochureMailtoMut.isPending ? "Preparing..." : "Send Brochure"}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-violet-700 hover:bg-violet-50 hover:text-violet-800 border-violet-200"
                onClick={() => {
                  setEditing(true);
                  setForm((f) => ({
                    ...f,
                    status: "tasting_scheduled",
                    nextFollowUpDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
                  }));
                  toast.info("Set the follow-up date and save to schedule tasting");
                }}
                disabled={updateMut.isPending}
              >
                <CalendarPlus className="h-3.5 w-3.5 mr-2" />
                Schedule Follow-up
              </Button>
              {lead.status !== "won" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-green-700 hover:bg-green-50 hover:text-green-800 border-green-200"
                  onClick={() => handleQuickAction("won")}
                  disabled={updateMut.isPending}
                >
                  <Trophy className="h-3.5 w-3.5 mr-2" />
                  Mark as Won
                </Button>
              )}
              {lead.status !== "lost" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                  onClick={() => handleQuickAction("lost")}
                  disabled={updateMut.isPending}
                >
                  <Ban className="h-3.5 w-3.5 mr-2" />
                  Mark as Lost
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="border-border/50 py-0">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-display font-semibold">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="space-y-3">
                <TimelineItem
                  label="Created"
                  date={formatDisplayDate(lead.createdAt)}
                  icon={<Building2 className="h-3 w-3" />}
                  color="bg-blue-50 text-blue-600"
                />
                {lead.lastContactDate && (
                  <TimelineItem
                    label="Last Contact"
                    date={formatDisplayDate(lead.lastContactDate)}
                    icon={<PhoneCall className="h-3 w-3" />}
                    color="bg-amber-50 text-amber-600"
                  />
                )}
                {lead.nextFollowUpDate && (
                  <TimelineItem
                    label="Next Follow-up"
                    date={formatDisplayDate(lead.nextFollowUpDate)}
                    icon={<CalendarPlus className="h-3 w-3" />}
                    color="bg-violet-50 text-violet-600"
                  />
                )}
                <TimelineItem
                  label="Last Updated"
                  date={formatDisplayDate(lead.updatedAt)}
                  icon={<Clock className="h-3 w-3" />}
                  color="bg-stone-50 text-stone-500"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── Activity Timeline ─────────────────────────────────────────────── */}
      <Card className="border-border/50 py-0">
        <CardHeader className="pb-2 pt-4 px-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-display font-semibold flex items-center gap-2">
              <History className="h-4 w-4 text-amber-600" />
              Activity Timeline
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActivityDialogOpen(true)}
              className="h-7 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" /> Add Activity
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {activitiesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-5 w-5 text-amber-600" />
            </div>
          ) : !activities || activities.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No activity yet</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">Activities will appear here as you interact with this lead.</p>
            </div>
          ) : (
            <div className="space-y-0">
              {activities.map((act, i) => {
                const Icon = ACTIVITY_ICONS[act.activityType] || Activity;
                const colorClass = ACTIVITY_COLORS[act.activityType] || "bg-stone-50 text-stone-500";
                const label = ACTIVITY_LABELS[act.activityType] || act.activityType;
                const time = new Date(act.createdAt);
                const timeStr = time.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }) + " at " + time.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                });

                return (
                  <div key={act.id}>
                    <div className="flex gap-3 py-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{label}</span>
                          {act.userName && (
                            <span className="text-xs text-muted-foreground">by {act.userName}</span>
                          )}
                        </div>
                        {act.note && (
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{act.note}</p>
                        )}
                        <p className="text-[11px] text-muted-foreground/60 mt-1 font-data">{timeStr}</p>
                      </div>
                    </div>
                    {i < activities.length - 1 && <Separator className="opacity-40" />}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Add Activity Dialog ───────────────────────────────────────────── */}
      <Dialog open={activityDialogOpen} onOpenChange={setActivityDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Add Activity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Activity Type</Label>
              <Select value={activityType || "none"} onValueChange={(v) => setActivityType(v === "none" ? "" : v)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select activity type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" disabled>Select activity type</SelectItem>
                  {ACTIVITY_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Note (optional)</Label>
              <Textarea
                value={activityNote}
                onChange={(e) => setActivityNote(e.target.value)}
                placeholder="Add details about this activity..."
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setActivityDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAddActivity}
              disabled={!activityType || addActivityMut.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {addActivityMut.isPending ? <Spinner className="h-3.5 w-3.5 mr-1.5" /> : <Plus className="h-3.5 w-3.5 mr-1.5" />}
              Add Activity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Reschedule Follow-up Dialog ──────────────────────────────────── */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Schedule Follow-up</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Follow-up Date</Label>
              <Input
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="h-9"
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Priority</Label>
              <Select value={reschedulePriority} onValueChange={setReschedulePriority}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {FOLLOW_UP_PRIORITY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Note (optional)</Label>
              <Textarea
                value={rescheduleNote}
                onChange={(e) => setRescheduleNote(e.target.value)}
                placeholder="Add a note about this follow-up..."
                rows={2}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRescheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleRescheduleFollowUp}
              disabled={!rescheduleDate || updateMut.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {updateMut.isPending ? <Spinner className="h-3.5 w-3.5 mr-1.5" /> : <CalendarPlus className="h-3.5 w-3.5 mr-1.5" />}
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function FieldRow({
  label,
  icon: Icon,
  editing,
  children,
}: {
  label: string;
  icon: React.ElementType;
  editing: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-[11px] text-muted-foreground flex items-center gap-1 mb-1.5">
        <Icon className="h-3 w-3" />
        {label}
      </Label>
      {children}
    </div>
  );
}

function TimelineItem({
  label,
  date,
  icon,
  color,
}: {
  label: string;
  date: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`flex h-6 w-6 items-center justify-center rounded-full ${color} shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-data">{date}</span>
      </div>
    </div>
  );
}
