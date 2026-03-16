/**
 * Leads — Hinnawi Bros Bagels Wholesale
 * View and manage incoming leads from the wholesale landing page contact form.
 * Requires authentication to access.
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
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from "@/components/ui/empty";
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
import { toast } from "sonner";

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  new: { label: "New", color: "bg-blue-100 text-blue-800 border-blue-200", icon: Sparkles },
  contacted: { label: "Contacted", color: "bg-amber-100 text-amber-800 border-amber-200", icon: Mail },
  qualified: { label: "Qualified", color: "bg-violet-100 text-violet-800 border-violet-200", icon: UserCheck },
  converted: { label: "Converted", color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle2 },
  lost: { label: "Lost", color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
};

export default function Leads() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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

  const deleteLead = trpc.leads.delete.useMutation({
    onSuccess: () => {
      utils.leads.list.invalidate();
      toast.success("Lead deleted");
    },
    onError: (err) => {
      toast.error("Failed to delete lead", { description: err.message });
    },
  });

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
          <p className="text-muted-foreground">Please log in to view leads.</p>
          <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
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
          Leads submitted through the wholesale landing page contact form
        </p>
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
                  statusFilter === key ? "border-amber-500 bg-amber-50/30" : ""
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
                      ? "Share your wholesale landing page to start receiving leads. When someone fills out the contact form, they'll appear here."
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
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider w-28">
                      Status
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider">
                      Message
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider w-40">
                      Received
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider w-24 text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => {
                    const status = statusConfig[lead.status];
                    return (
                      <TableRow key={lead.id} className="group">
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
                        <TableCell className="text-right">
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
                                  This will permanently remove {lead.name} from{" "}
                                  {lead.business} from your leads. This action
                                  cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    deleteLead.mutate({ id: lead.id })
                                  }
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
    </div>
  );
}
