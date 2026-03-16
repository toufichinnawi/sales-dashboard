/**
 * QuickBooks Settings Page
 * Connect/disconnect, sync status, manual sync trigger, sync history
 */

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import {
  Link2,
  Unlink,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Calendar,
  Shield,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Database,
  Users,
  FileText,
  CreditCard,
  Activity,
  Info,
} from "lucide-react";

export default function QuickBooksSettings() {
  const [isSyncing, setIsSyncing] = useState(false);

  const { data: qbStatus, isLoading: statusLoading, refetch: refetchStatus } =
    trpc.quickbooks.status.useQuery();

  const { data: syncLogs, isLoading: logsLoading, refetch: refetchLogs } =
    trpc.quickbooks.syncLogs.useQuery();

  const disconnectMutation = trpc.quickbooks.disconnect.useMutation({
    onSuccess: () => {
      toast.success("QuickBooks disconnected successfully");
      refetchStatus();
    },
    onError: (err) => {
      toast.error(`Failed to disconnect: ${err.message}`);
    },
  });

  const syncMutation = trpc.quickbooks.sync.useMutation({
    onSuccess: (result) => {
      setIsSyncing(false);
      if (result.success) {
        toast.success(
          `Sync complete: ${result.customers.created + result.customers.updated} customers, ${result.invoices.created + result.invoices.updated} invoices, ${result.payments.processed} payments`
        );
      } else {
        toast.error("Sync completed with errors. Check sync logs for details.");
      }
      refetchStatus();
      refetchLogs();
    },
    onError: (err) => {
      setIsSyncing(false);
      toast.error(`Sync failed: ${err.message}`);
    },
  });

  // Check for QB connection status from URL params (after OAuth callback)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("qb_connected") === "true") {
      toast.success("QuickBooks connected successfully! You can now sync your data.");
      refetchStatus();
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (params.get("qb_error")) {
      toast.error(`QuickBooks connection error: ${params.get("qb_error")}`);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleConnect = () => {
    const origin = window.location.origin;
    window.location.href = `/api/qb/connect?origin=${encodeURIComponent(origin)}`;
  };

  const handleSync = () => {
    setIsSyncing(true);
    syncMutation.mutate();
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate();
  };

  const connected = qbStatus?.connected ?? false;
  const connection = qbStatus?.connection;

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "Never";
    const d = new Date(date);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getTimeSince = (date: Date | string | null | undefined) => {
    if (!date) return "Never";
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    return `${diffDays}d ago`;
  };

  const isTokenExpiringSoon = () => {
    if (!connection?.refreshTokenExpiresAt) return false;
    const expiry = new Date(connection.refreshTokenExpiresAt);
    const daysLeft = (expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysLeft < 14;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="px-4 md:px-6 pt-4">
        <h1 className="font-display text-2xl font-bold tracking-tight">QuickBooks Integration</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connect your QuickBooks Online account to automatically sync customers, invoices, and payments.
        </p>
      </div>

      <div className="px-4 md:px-6 space-y-6 pb-6">
        {/* Connection Status Card */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    connected ? "bg-green-50 text-green-600" : "bg-stone-100 text-stone-400"
                  }`}
                >
                  {connected ? <Link2 className="h-5 w-5" /> : <Unlink className="h-5 w-5" />}
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">
                    {statusLoading ? "Checking..." : connected ? "Connected" : "Not Connected"}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {connected
                      ? `Linked to ${connection?.companyName || connection?.realmId || "QuickBooks"}`
                      : "Connect your QuickBooks Online account to get started"}
                  </CardDescription>
                </div>
              </div>
              <Badge
                variant={connected ? "default" : "secondary"}
                className={`text-xs ${connected ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}`}
              >
                {connected ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardHeader>

          {connected && connection && (
            <CardContent className="pt-0">
              <Separator className="mb-4" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Building2 className="h-3 w-3" />
                    Company
                  </div>
                  <p className="text-sm font-medium">{connection.companyName || "—"}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Database className="h-3 w-3" />
                    Realm ID
                  </div>
                  <p className="text-sm font-mono">{connection.realmId}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Last Sync
                  </div>
                  <p className="text-sm font-medium">
                    {getTimeSince(connection.lastSyncAt)}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Shield className="h-3 w-3" />
                    Token Expires
                  </div>
                  <p className={`text-sm font-medium ${isTokenExpiringSoon() ? "text-amber-600" : ""}`}>
                    {formatDate(connection.refreshTokenExpiresAt)}
                  </p>
                </div>
              </div>

              {isTokenExpiringSoon() && (
                <div className="mt-4 flex items-center gap-2 rounded-md bg-amber-50 p-3 text-xs text-amber-700">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>
                    Your refresh token expires soon. Re-connect to QuickBooks to renew it.
                  </span>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {!connected ? (
            <Button onClick={handleConnect} className="gap-2 bg-[#2CA01C] hover:bg-[#248a17] text-white">
              <Link2 className="h-4 w-4" />
              Connect to QuickBooks
            </Button>
          ) : (
            <>
              <Button
                onClick={handleSync}
                disabled={isSyncing}
                className="gap-2"
              >
                {isSyncing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {isSyncing ? "Syncing..." : "Sync Now"}
              </Button>

              <Button
                onClick={handleConnect}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Re-authorize
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Unlink className="h-4 w-4" />
                    Disconnect
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Disconnect QuickBooks?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will stop syncing data from QuickBooks. Your existing data in the
                      dashboard will be preserved. You can reconnect at any time.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDisconnect}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Disconnect
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>

        {/* Setup Instructions (when not connected) */}
        {!connected && !statusLoading && (
          <Card className="border-border/50 border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-500" />
                Setup Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                    1
                  </span>
                  <div>
                    <p className="font-medium text-foreground">Add the Redirect URI</p>
                    <p className="text-xs mt-0.5">
                      In your Intuit Developer app settings, add this redirect URI:
                    </p>
                    <code className="mt-1 block rounded bg-muted px-2 py-1 text-xs font-mono break-all">
                      {window.location.origin}/api/qb/callback
                    </code>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                    2
                  </span>
                  <div>
                    <p className="font-medium text-foreground">Click "Connect to QuickBooks"</p>
                    <p className="text-xs mt-0.5">
                      You'll be redirected to Intuit to authorize the connection.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                    3
                  </span>
                  <div>
                    <p className="font-medium text-foreground">Sync your data</p>
                    <p className="text-xs mt-0.5">
                      After connecting, click "Sync Now" to import customers, invoices, and payments.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* What Gets Synced */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">What Gets Synced</CardTitle>
            <CardDescription className="text-xs">
              Data flows from QuickBooks Online into your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3 rounded-lg border border-border/50 p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Customers</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Names, emails, phones, addresses. Auto-detects business segment.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-border/50 p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-600">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Invoices</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    All invoices with line items, amounts, and customer matching.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-border/50 p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-green-50 text-green-600">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Payments</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Payment records update invoice status to "Paid" automatically.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sync History */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Sync History
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Recent synchronization activity
                </CardDescription>
              </div>
              {syncLogs && syncLogs.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => refetchLogs()} className="text-xs">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading sync history...
              </div>
            ) : !syncLogs || syncLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">No sync history yet</p>
                <p className="text-xs mt-1">Connect QuickBooks and run your first sync</p>
              </div>
            ) : (
              <div className="space-y-2">
                {syncLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center gap-3 rounded-lg border border-border/40 p-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="shrink-0">
                      {log.status === "completed" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : log.status === "failed" ? (
                        <XCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium capitalize">
                          {log.syncType} Sync
                        </span>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${
                            log.status === "completed"
                              ? "bg-green-50 text-green-700"
                              : log.status === "failed"
                              ? "bg-red-50 text-red-700"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {log.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                        {(log.customersCreated ?? 0) > 0 && (
                          <span>{log.customersCreated} customers created</span>
                        )}
                        {(log.customersUpdated ?? 0) > 0 && (
                          <span>{log.customersUpdated} customers updated</span>
                        )}
                        {(log.ordersCreated ?? 0) > 0 && (
                          <span>{log.ordersCreated} invoices created</span>
                        )}
                        {(log.ordersUpdated ?? 0) > 0 && (
                          <span>{log.ordersUpdated} invoices updated</span>
                        )}
                        {(log.paymentsProcessed ?? 0) > 0 && (
                          <span>{log.paymentsProcessed} payments</span>
                        )}
                        {log.errorMessage && (
                          <span className="text-red-500 truncate max-w-[300px]">
                            {log.errorMessage.split("\n")[0]}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0">
                      {formatDate(log.startedAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
