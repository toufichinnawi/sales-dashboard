/**
 * Accounts — Hinnawi Bros Bagels Wholesale
 * Searchable, filterable table of all wholesale accounts and prospects
 */

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  User,
  MapPin,
  Calendar,
} from "lucide-react";
import {
  deals,
  formatCurrency,
  stageLabel,
  stageColor,
  type Deal,
} from "@/lib/data";

type SortField = "company" | "value" | "dozenPerWeek" | "probability" | "expectedClose";
type SortDir = "asc" | "desc";

export default function Deals() {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [segmentFilter, setSegmentFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("value");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const segments = useMemo(() => {
    const set = new Set(deals.map((d) => d.segment));
    return Array.from(set).sort();
  }, []);

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    deals.forEach((d) => {
      counts[d.stage] = (counts[d.stage] || 0) + 1;
    });
    return counts;
  }, []);

  const filteredDeals = useMemo(() => {
    let result = [...deals];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.company.toLowerCase().includes(q) ||
          d.contact.toLowerCase().includes(q) ||
          d.products.some((p) => p.toLowerCase().includes(q))
      );
    }

    if (stageFilter !== "all") {
      result = result.filter((d) => d.stage === stageFilter);
    }

    if (segmentFilter !== "all") {
      result = result.filter((d) => d.segment === segmentFilter);
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "company":
          cmp = a.company.localeCompare(b.company);
          break;
        case "value":
          cmp = a.value - b.value;
          break;
        case "dozenPerWeek":
          cmp = a.dozenPerWeek - b.dozenPerWeek;
          break;
        case "probability":
          cmp = a.probability - b.probability;
          break;
        case "expectedClose":
          cmp = new Date(a.expectedClose).getTime() - new Date(b.expectedClose).getTime();
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });

    return result;
  }, [search, stageFilter, segmentFilter, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="font-display text-xl md:text-2xl font-bold tracking-tight">Accounts</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {filteredDeals.length} of {deals.length} wholesale accounts & prospects
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
        {(["signed", "negotiation", "tasting", "sample_request", "lead"] as Deal["stage"][]).map(
          (stage) => (
            <Button
              key={stage}
              variant={stageFilter === stage ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setStageFilter(stage)}
            >
              {stageLabel(stage)} ({stageCounts[stage] || 0})
            </Button>
          )
        )}
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search accounts, contacts, products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>
        <Select value={segmentFilter} onValueChange={setSegmentFilter}>
          <SelectTrigger className="w-full sm:w-40 h-9 text-xs">
            <SelectValue placeholder="All Segments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Segments</SelectItem>
            {segments.map((seg) => (
              <SelectItem key={seg} value={seg}>{seg}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
          <SelectTrigger className="w-full sm:w-40 h-9 text-xs">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="value">Value/Mo</SelectItem>
            <SelectItem value="company">Company</SelectItem>
            <SelectItem value="dozenPerWeek">Dozens/Week</SelectItem>
            <SelectItem value="probability">Probability</SelectItem>
            <SelectItem value="expectedClose">Close Date</SelectItem>
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

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard
          label="Total Monthly Value"
          value={formatCurrency(filteredDeals.reduce((s, d) => s + d.value, 0))}
        />
        <SummaryCard
          label="Total Dz/Week"
          value={`${filteredDeals.reduce((s, d) => s + d.dozenPerWeek, 0)} dz`}
        />
        <SummaryCard
          label="Signed Accounts"
          value={String(filteredDeals.filter((d) => d.stage === "signed").length)}
        />
        <SummaryCard
          label="Avg Order/Mo"
          value={formatCurrency(
            filteredDeals.length > 0
              ? filteredDeals.reduce((s, d) => s + d.value, 0) / filteredDeals.length
              : 0
          )}
        />
      </div>

      {/* Deals list */}
      <div className="space-y-3">
        {filteredDeals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
        {filteredDeals.length === 0 && (
          <Card className="border-border/50 py-0">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-muted-foreground">No accounts match your filters</p>
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
              <Badge className={`${stageColor(deal.stage)} text-[10px]`}>
                {stageLabel(deal.stage)}
              </Badge>
              <Badge variant="secondary" className="text-[10px] h-5">{deal.segment}</Badge>
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
                <MapPin className="h-3 w-3" />
                {deal.region}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {deal.stage === "signed" ? "Signed" : "Est. close"}: {new Date(deal.expectedClose).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
            <div className="flex gap-1.5 mt-2">
              {deal.products.map((p) => (
                <span key={p} className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">
                  {p}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Value and metrics */}
          <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1 shrink-0">
            <div className="font-data text-base font-semibold">{formatCurrency(deal.value)}/mo</div>
            <div className="font-data text-[11px] text-muted-foreground">{deal.dozenPerWeek} dz/week</div>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${deal.probability}%`,
                    backgroundColor: deal.probability >= 70 ? "#92400E" : deal.probability >= 40 ? "#D97706" : "#78716C",
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

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-border/50 py-0">
      <CardContent className="p-3.5">
        <div className="text-[11px] text-muted-foreground mb-1">{label}</div>
        <div className="font-data text-lg font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}
