/**
 * Shopify Settings Page
 * Environment-based Shopify Admin API sync status, manual sync trigger, sync history
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  FileText,
  Info,
  Loader2,
  RefreshCw,
  ShoppingBag,
  Store,
  Users,
  XCircle,
} from "lucide-react";

export default function ShopifySettings() {
  const [isSyncing, setIsSyncing] = useState(false);

  const { data: shopifyStatus, isLoading: statusLoading, refetch: refetchStatus } =
    trpc.shopify.status.useQuery();
  const { data: syncLogs, isLoading: logsLoading, refetch: refetchLogs } =
    trpc.shopify.syncLogs.useQuery();

  const syncMutation = trpc.shopify.sync.useMutation({
    onSuccess: (result) => {
      toast.success(
        `Shopify sync complete: ${result.ordersCreated} created, ${result.ordersUpdated} updated`
      );
      setIsSyncing(false);
      refetchStatus();
      refetchLogs();
    },
    onError: (err) => {
      setIsSyncing(false);
      toast.error(`Shopify sync failed: ${err.message}`);
      refetchLogs();
    },
  });

  const connected = shopifyStatus?.connected ?? false;
  const connection = shopifyStatus?.connection;

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
    const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
  };

  const handleSync = () => {
    setIsSyncing(true);
    syncMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="px-4 md:px-6 pt-4">
        <h1 className="font-display text-2xl font-bold tracking-tight">Shopify Integration</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sync Shopify customers and recent orders into the wholesale dashboard.
        </p>
      </div>

      <div className="px-4 md:px-6 space-y-6 pb-6">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    connected ? "bg-green-50 text-green-600" : "bg-stone-100 text-stone-400"
                  }`}
                >
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">
                    {statusLoading ? "Checking..." : connected ? "Configured" : "Not Configured"}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {connected
                      ? `Linked to ${connection?.shopDomain || "Shopify"}`
                      : "Add Shopify Admin API credentials to the environment"}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Store className="h-3 w-3" />
                    Store
                  </div>
                  <p className="text-sm font-medium">{connection.shopDomain}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Database className="h-3 w-3" />
                    API Version
                  </div>
                  <p className="text-sm font-mono">{connection.apiVersion}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Last Sync
                  </div>
                  <p className="text-sm font-medium">{getTimeSince(connection.lastSyncAt)}</p>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button onClick={handleSync} disabled={!connected || isSyncing} className="gap-2 bg-[#008060] hover:bg-[#006e52] text-white">
            {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {isSyncing ? "Syncing..." : "Sync Shopify Orders"}
          </Button>
          <Button variant="outline" onClick={() => { refetchStatus(); refetchLogs(); }} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Status
          </Button>
        </div>

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
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                    1
                  </span>
                  <div>
                    <p className="font-medium text-foreground">Create or open a Shopify custom app</p>
                    <p className="text-xs mt-0.5">
                      The app needs Admin API access to read orders and customers.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                    2
                  </span>
                  <div>
                    <p className="font-medium text-foreground">Add environment variables</p>
                    <code className="mt-1 block rounded bg-muted px-2 py-1 text-xs font-mono break-all">
                      SHOPIFY_SHOP_DOMAIN=your-store.myshopify.com
                      <br />
                      SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_...
                      <br />
                      SHOPIFY_API_VERSION=2026-04
                    </code>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                    3
                  </span>
                  <div>
                    <p className="font-medium text-foreground">Restart the server and sync</p>
                    <p className="text-xs mt-0.5">
                      After the variables are loaded, click "Sync Shopify Orders".
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">What Gets Synced</CardTitle>
            <CardDescription className="text-xs">
              Data flows from Shopify into your dashboard
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
                    Customer name, email, phone, and address from Shopify orders.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-border/50 p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-green-50 text-green-600">
                  <ShoppingBag className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Orders</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Recent Shopify orders with totals, status, source ID, and addresses.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-border/50 p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-600">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Line Items</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Product names, SKUs, quantities, unit prices, and line totals.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Sync History
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Recent Shopify synchronization activity
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
                <p className="text-xs mt-1">Configure Shopify and run your first sync</p>
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
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium capitalize">{log.syncType} Sync</span>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${
                            log.status === "completed" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                          }`}
                        >
                          {log.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                        {log.customersCreated > 0 && <span>{log.customersCreated} customers created</span>}
                        {log.customersUpdated > 0 && <span>{log.customersUpdated} customers matched</span>}
                        {log.ordersCreated > 0 && <span>{log.ordersCreated} orders created</span>}
                        {log.ordersUpdated > 0 && <span>{log.ordersUpdated} orders updated</span>}
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

