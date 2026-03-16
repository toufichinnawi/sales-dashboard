/**
 * Deals Page — "Ink & Data" Editorial Design
 * Full deals table with search, filter, and stage breakdown
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
  Calendar,
  Building2,
  User,
} from "lucide-react";
import {
  deals,
  formatCurrency,
  getStageColor,
  getStageLabel,
  type Deal,
} from "@/lib/data";

type SortField = "value" | "company" | "expectedClose" | "probability";
type SortDir = "asc" | "desc";

export default function Deals() {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("value");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const filteredDeals = useMemo(() => {
    let result = [...deals];

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.company.toLowerCase().includes(q) ||
          d.contact.toLowerCase().includes(q) ||
          d.id.toLowerCase().includes(q) ||
          d.owner.toLowerCase().includes(q)
      );
    }

    // Stage filter
    if (stageFilter !== "all") {
      result = result.filter((d) => d.stage === stageFilter);
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "value":
          cmp = a.value - b.value;
          break;
        case "company":
          cmp = a.company.localeCompare(b.company);
          break;
        case "expectedClose":
          cmp = new Date(a.expectedClose).getTime() - new Date(b.expectedClose).getTime();
          break;
        case "probability":
          cmp = a.probability - b.probability;
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });

    return result;
  }, [search, stageFilter, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  // Stage counts
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    deals.forEach((d) => {
      counts[d.stage] = (counts[d.stage] || 0) + 1;
    });
    return counts;
  }, []);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-xl font-bold">Deal Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {deals.length} total deals · {formatCurrency(deals.reduce((s, d) => s + d.value, 0))} total value
        </p>
      </div>

      {/* Stage quick filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={stageFilter === "all" ? "default" : "outline"}
          size="sm"
          className="h-7 text-xs"
          onClick={() => setStageFilter("all")}
        >
          All ({deals.length})
        </Button>
        {(["lead", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"] as const).map(
          (stage) => (
            <Button
              key={stage}
              variant={stageFilter === stage ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setStageFilter(stage)}
            >
              {getStageLabel(stage)} ({stageCounts[stage] || 0})
            </Button>
          )
        )}
      </div>

      {/* Search and sort controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by company, contact, ID, or owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>
        <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
          <SelectTrigger className="w-40 h-9 text-xs">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="value">Deal Value</SelectItem>
            <SelectItem value="company">Company</SelectItem>
            <SelectItem value="expectedClose">Close Date</SelectItem>
            <SelectItem value="probability">Probability</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          className="h-9 text-xs"
          onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
        >
          <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
          {sortDir === "desc" ? "Desc" : "Asc"}
        </Button>
      </div>

      {/* Deals list */}
      <div className="space-y-3">
        {filteredDeals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
        {filteredDeals.length === 0 && (
          <Card className="border-border/50 py-0">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-muted-foreground">No deals match your filters</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function DealCard({ deal }: { deal: Deal }) {
  return (
    <Card className="border-border/50 hover:border-border transition-colors py-0">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Left: Deal info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-data text-[10px] text-muted-foreground">{deal.id}</span>
              <Badge variant="secondary" className={`text-[10px] ${getStageColor(deal.stage)}`}>
                {getStageLabel(deal.stage)}
              </Badge>
              {deal.stage === "negotiation" && (
                <Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-700">
                  Hot
                </Badge>
              )}
            </div>
            <h3 className="text-sm font-medium">{deal.company}</h3>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {deal.contact}
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {deal.industry}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Close: {new Date(deal.expectedClose).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
          </div>

          {/* Right: Value and owner */}
          <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1 shrink-0">
            <div className="font-data text-base font-semibold">{formatCurrency(deal.value)}</div>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${deal.probability}%`,
                    backgroundColor: deal.probability >= 70 ? "#0D7377" : deal.probability >= 40 ? "#C4841D" : "#64748B",
                  }}
                />
              </div>
              <span className="font-data text-[10px] text-muted-foreground">{deal.probability}%</span>
            </div>
            <div className="text-[10px] text-muted-foreground">{deal.owner}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
