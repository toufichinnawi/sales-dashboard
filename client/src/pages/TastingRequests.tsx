/**
 * Tasting Requests — Hinnawi Bros Bagels Wholesale
 * View and manage incoming tasting requests from the public form.
 */

import { useState } from "react";
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
  Cookie,
  Mail,
  Phone,
  Building2,
  User,
  Clock,
  Search,
  AlertCircle,
  CalendarDays,
  MapPin,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Timer,
  Sparkles,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  pending: {
    label: "Pending",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Sparkles,
  },
  scheduled: {
    label: "Scheduled",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    icon: Timer,
  },
  completed: {
    label: "Completed",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
  },
};

export default function TastingRequests() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const { data: requests, isLoading, error } = trpc.tastings.list.useQuery();
  const utils = trpc.useUtils();

  const updateStatus = trpc.tastings.updateStatus.useMutation({
    onSuccess: () => {
      utils.tastings.list.invalidate();
      toast.success("Tasting request status updated");
    },
    onError: (err) => {
      toast.error("Failed to update status", { description: err.message });
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
          <p className="text-muted-foreground">
            Please log in to view tasting requests.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {error.message}
          </p>
        </div>
      </div>
    );
  }

  const filteredRequests = (requests ?? []).filter((req) => {
    const matchesSearch =
      search === "" ||
      req.name.toLowerCase().includes(search.toLowerCase()) ||
      req.business.toLowerCase().includes(search.toLowerCase()) ||
      req.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = (requests ?? []).reduce(
    (acc, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
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

  const openDetail = (req: any) => {
    setSelectedRequest(req);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="px-4 md:px-6 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Cookie className="h-6 w-6 text-amber-700" />
              <h1 className="font-display text-xl font-bold tracking-tight">
                Tasting Requests
              </h1>
              <Badge variant="secondary" className="font-data text-xs">
                {requests?.length ?? 0} total
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Manage free tasting requests from potential wholesale partners
            </p>
          </div>
        </div>
      </div>

      {/* Status Summary Cards */}
      <div className="px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card
            className={`cursor-pointer transition-all hover:shadow-md py-0 ${
              statusFilter === "all"
                ? "ring-2 ring-amber-500 border-amber-300"
                : "border-border/50"
            }`}
            onClick={() => setStatusFilter("all")}
          >
            <CardContent className="p-3.5">
              <div className="font-data text-lg font-semibold">
                {requests?.length ?? 0}
              </div>
              <div className="text-[11px] text-muted-foreground">
                All Requests
              </div>
            </CardContent>
          </Card>
          {Object.entries(statusConfig).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <Card
                key={key}
                className={`cursor-pointer transition-all hover:shadow-md py-0 ${
                  statusFilter === key
                    ? "ring-2 ring-amber-500 border-amber-300"
                    : "border-border/50"
                }`}
                onClick={() =>
                  setStatusFilter(statusFilter === key ? "all" : key)
                }
              >
                <CardContent className="p-3.5">
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <div className="font-data text-lg font-semibold">
                      {statusCounts[key] || 0}
                    </div>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {config.label}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="px-4 md:px-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, business, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="px-4 md:px-6 pb-6">
        {filteredRequests.length === 0 ? (
          <Empty>
            <EmptyMedia>
              <Cookie className="h-10 w-10 text-muted-foreground/50" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No tasting requests found</EmptyTitle>
              <EmptyDescription>
                {search || statusFilter !== "all"
                  ? "Try adjusting your search or filter."
                  : "Tasting requests from the public form will appear here."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Card className="border-border/50 py-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider w-[180px]">
                      Contact
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider w-[160px]">
                      Business
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider w-[140px]">
                      Preferred Date
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider w-[180px]">
                      Bagel Preferences
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider w-[120px]">
                      Status
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider w-[140px]">
                      Submitted
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider w-[80px] text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((req) => {
                    const statusInfo = statusConfig[req.status] || statusConfig.pending;
                    const StatusIcon = statusInfo.icon;
                    return (
                      <TableRow
                        key={req.id}
                        className="group cursor-pointer"
                        onClick={() => openDetail(req)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700">
                              <User className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <div className="text-sm font-medium leading-tight">
                                {req.name}
                              </div>
                              <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {req.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">{req.business}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">
                              {req.preferredDate || "Flexible"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground line-clamp-1">
                            {req.bagelPreferences || "All varieties"}
                          </span>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={req.status}
                            onValueChange={(value) =>
                              updateStatus.mutate({
                                id: req.id,
                                status: value as any,
                              })
                            }
                          >
                            <SelectTrigger className="h-7 w-[120px] text-xs border-0 bg-transparent hover:bg-muted/50 p-0 pl-1">
                              <Badge
                                variant="outline"
                                className={`${statusInfo.color} text-[10px] font-medium`}
                              >
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusInfo.label}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(statusConfig).map(
                                ([key, config]) => (
                                  <SelectItem key={key} value={key}>
                                    <div className="flex items-center gap-2">
                                      <config.icon className="h-3.5 w-3.5" />
                                      {config.label}
                                    </div>
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span className="text-[11px]">
                              {formatDate(req.createdAt)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDetail(req);
                                }}
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View details</TooltipContent>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Cookie className="h-5 w-5 text-amber-700" />
              Tasting Request Details
            </DialogTitle>
            <DialogDescription>
              Review the request and update its status.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              {/* Contact Info */}
              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="text-sm font-semibold text-amber-800">
                  Contact Information
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase">
                        Name
                      </div>
                      <div className="text-sm font-medium">
                        {selectedRequest.name}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase">
                        Business
                      </div>
                      <div className="text-sm font-medium">
                        {selectedRequest.business}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase">
                        Email
                      </div>
                      <div className="text-sm">{selectedRequest.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase">
                        Phone
                      </div>
                      <div className="text-sm">
                        {selectedRequest.phone || "Not provided"}
                      </div>
                    </div>
                  </div>
                </div>
                {selectedRequest.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase">
                        Address
                      </div>
                      <div className="text-sm">{selectedRequest.address}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tasting Details */}
              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="text-sm font-semibold text-amber-800">
                  Tasting Details
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase">
                        Preferred Date
                      </div>
                      <div className="text-sm">
                        {selectedRequest.preferredDate || "Flexible"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Cookie className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase">
                        Bagel Preferences
                      </div>
                      <div className="text-sm">
                        {selectedRequest.bagelPreferences || "All varieties"}
                      </div>
                    </div>
                  </div>
                </div>
                {selectedRequest.message && (
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase">
                        Message
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {selectedRequest.message}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Update */}
              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="text-sm font-semibold text-amber-800">
                  Update Status
                </h4>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(statusConfig).map(([key, config]) => {
                    const Icon = config.icon;
                    const isActive = selectedRequest.status === key;
                    return (
                      <Button
                        key={key}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        className={
                          isActive
                            ? "bg-amber-700 hover:bg-amber-800 text-white"
                            : ""
                        }
                        onClick={() => {
                          updateStatus.mutate({
                            id: selectedRequest.id,
                            status: key as any,
                          });
                          setSelectedRequest({
                            ...selectedRequest,
                            status: key,
                          });
                        }}
                      >
                        <Icon className="h-3.5 w-3.5 mr-1.5" />
                        {config.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Timestamps */}
              <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
                <span>
                  Submitted: {formatDate(selectedRequest.createdAt)}
                </span>
                <span>
                  Updated: {formatDate(selectedRequest.updatedAt)}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
