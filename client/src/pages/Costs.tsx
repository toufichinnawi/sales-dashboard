/**
 * Costs — Hinnawi Bros Bagels Wholesale
 * Canonical product catalog with case-insensitive substring matching to order
 * lines. A canonical product (e.g. "Sesame") matches any order line whose
 * product name CONTAINS that string (e.g. "Bagels:Half Dozen of Sesame").
 * Longest canonical name wins on multi-match; ties broken alphabetically.
 * Quantity is normalized to dozens (unit "each" → ÷12). Lines with no match
 * stay in uncostedRevenue — never assumed zero-cost.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
} from "@/components/ui/alert-dialog";
import { DollarSign, Plus, Pencil, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/data";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

type EditorState = {
  mode: "add" | "edit";
  productName: string;
  unitCost: string;
  unit: string;
};

export default function Costs() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const utils = trpc.useUtils();

  const { data: costs, isLoading: costsLoading } = trpc.accounting.listCosts.useQuery();
  const { data: summary } = trpc.accounting.profitSummary.useQuery();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const invalidateAll = () =>
    Promise.all([
      utils.accounting.listCosts.invalidate(),
      utils.accounting.profitByCustomer.invalidate(),
      utils.accounting.profitSummary.invalidate(),
    ]);

  const upsert = trpc.accounting.upsertCost.useMutation({
    onSuccess: async () => {
      await invalidateAll();
      toast.success("Product saved");
      setEditorOpen(false);
      setEditor(null);
    },
    onError: (err) => toast.error(err.message || "Failed to save"),
  });

  const remove = trpc.accounting.deleteCost.useMutation({
    onSuccess: async () => {
      await invalidateAll();
      toast.success("Product deleted");
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.message || "Failed to delete"),
  });

  const openAdd = () => {
    setEditor({ mode: "add", productName: "", unitCost: "", unit: "dozen" });
    setEditorOpen(true);
  };

  const openEdit = (productName: string) => {
    const existing = (costs ?? []).find((c) => c.productName === productName);
    if (!existing) return;
    setEditor({
      mode: "edit",
      productName: existing.productName,
      unitCost: String(Number(existing.unitCost)),
      unit: existing.unit,
    });
    setEditorOpen(true);
  };

  const handleSave = () => {
    if (!editor) return;
    const name = editor.productName.trim();
    if (!name) {
      toast.error("Product name is required");
      return;
    }
    const cost = Number(editor.unitCost);
    if (!Number.isFinite(cost) || cost < 0) {
      toast.error("Enter a valid unit cost");
      return;
    }
    upsert.mutate({
      productName: name,
      unitCost: cost,
      unit: editor.unit.trim() || "dozen",
    });
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) remove.mutate({ productName: deleteTarget });
  };

  return (
    <div className="space-y-6">
      <div className="px-4 md:px-6 pt-6 space-y-6 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-amber-700" />
              Product Costs
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Canonical products with a unit cost. Each canonical name matches order lines by
              case-insensitive substring (longest name wins on multi-match).
            </p>
          </div>
          {isAdmin && (
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4 mr-1" />
              Add Product
            </Button>
          )}
        </div>

        {/* Uncosted note (one line) */}
        {summary && summary.uncostedRevenue > 0 && (
          <p className="text-xs text-amber-800">
            {summary.uncostedRevenueShare}% of revenue ({formatCurrency(summary.uncostedRevenue)})
            not yet costed — add products to cover it.
          </p>
        )}

        {/* Summary tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryTile label="Revenue" value={summary ? formatCurrency(summary.revenue) : "—"} />
          <SummaryTile label="Cost (COGS)" value={summary ? formatCurrency(summary.cost) : "—"} />
          <SummaryTile
            label="Profit"
            value={summary ? formatCurrency(summary.profit) : "—"}
            emphasis={summary && summary.profit >= 0 ? "positive" : "negative"}
          />
          <SummaryTile
            label="Margin"
            value={summary && summary.marginPct !== null ? `${summary.marginPct}%` : "—"}
          />
        </div>

        {/* Canonical product catalog */}
        <Card className="border-border/50 py-0">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-display font-semibold">Canonical Products</CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {costsLoading
                ? "Loading…"
                : `${(costs ?? []).length} product${(costs ?? []).length === 1 ? "" : "s"} in catalog`}
            </p>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="text-left font-semibold text-[10px] uppercase tracking-wider text-muted-foreground px-5 py-2.5">
                      Product
                    </th>
                    <th className="text-right font-semibold text-[10px] uppercase tracking-wider text-muted-foreground px-3 py-2.5">
                      Unit Cost
                    </th>
                    <th className="text-left font-semibold text-[10px] uppercase tracking-wider text-muted-foreground px-3 py-2.5">
                      Unit
                    </th>
                    <th className="text-right font-semibold text-[10px] uppercase tracking-wider text-muted-foreground px-5 py-2.5">
                      {isAdmin ? "Actions" : ""}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {costsLoading && (
                    <tr>
                      <td colSpan={4} className="px-5 py-6">
                        <Skeleton className="h-4 w-40" />
                      </td>
                    </tr>
                  )}
                  {!costsLoading && (costs ?? []).length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">
                        No canonical products yet.{" "}
                        {isAdmin ? "Click \"Add Product\" to create one." : ""}
                      </td>
                    </tr>
                  )}
                  {!costsLoading &&
                    (costs ?? []).map((row) => (
                      <tr
                        key={row.productName}
                        className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-5 py-2.5 font-medium">{row.productName}</td>
                        <td className="px-3 py-2.5 text-right font-data">
                          {formatCurrency(Number(row.unitCost))}
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">{row.unit}</td>
                        <td className="px-5 py-2.5 text-right">
                          {isAdmin && (
                            <div className="inline-flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => openEdit(row.productName)}
                              >
                                <Pencil className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => setDeleteTarget(row.productName)}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Add/Edit dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editor?.mode === "edit" ? `Edit ${editor.productName}` : "Add Product"}
            </DialogTitle>
            <DialogDescription>
              Canonical product name. Any order line whose product CONTAINS this name (case-insensitive)
              will be costed using this unit cost.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="productName">Product name</Label>
              <Input
                id="productName"
                value={editor?.productName ?? ""}
                onChange={(e) =>
                  setEditor((prev) => (prev ? { ...prev, productName: e.target.value } : prev))
                }
                placeholder="e.g. Sesame, Everything, Plain"
                disabled={editor?.mode === "edit"}
              />
              {editor?.mode === "edit" && (
                <p className="text-[10px] text-muted-foreground">
                  Name is fixed once created (it's the substring matcher). Delete and re-add to rename.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unitCost">Unit cost ($)</Label>
              <Input
                id="unitCost"
                type="number"
                min="0"
                step="0.01"
                value={editor?.unitCost ?? ""}
                onChange={(e) =>
                  setEditor((prev) => (prev ? { ...prev, unitCost: e.target.value } : prev))
                }
                placeholder="e.g. 3.50"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={editor?.unit ?? "dozen"}
                onChange={(e) =>
                  setEditor((prev) => (prev ? { ...prev, unit: e.target.value } : prev))
                }
                placeholder="dozen"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditorOpen(false)}
              disabled={upsert.isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={upsert.isPending}>
              {upsert.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Order lines that were costed via this product will fall back to uncosted revenue
              until another canonical product matches them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={remove.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {remove.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: "positive" | "negative";
}) {
  const color =
    emphasis === "positive"
      ? "text-emerald-700"
      : emphasis === "negative"
        ? "text-red-600"
        : "text-foreground";
  return (
    <Card className="border-border/50 py-0">
      <CardContent className="p-3.5">
        <div className="text-[11px] text-muted-foreground mb-1">{label}</div>
        <div className={`font-data text-lg font-semibold ${color}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
