/**
 * Prospects Page — Hinnawi Bros Bagels
 * Real Montreal wholesale prospect list with status tracking
 * Design: Editorial data table with segment filtering and priority badges
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Search,
  Target,
  Building2,
  MapPin,
  Lightbulb,
  ArrowUpRight,
  Coffee,
  UtensilsCrossed,
  Hotel,
  ShoppingBag,
  Users,
  GraduationCap,
  Briefcase,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { prospects, prospectStats } from "@/lib/prospects";

const segmentIcons: Record<string, typeof Coffee> = {
  Cafe: Coffee,
  Restaurant: UtensilsCrossed,
  Hotel: Hotel,
  Grocery: ShoppingBag,
  Catering: Users,
  University: GraduationCap,
  Corporate: Briefcase,
};

const priorityColors: Record<string, string> = {
  high: "bg-red-100 text-red-800 border-red-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-green-100 text-green-800 border-green-200",
};

const statusLabels: Record<string, string> = {
  new: "New Lead",
  contacted: "Contacted",
  tasting_scheduled: "Tasting Scheduled",
  follow_up: "Follow Up",
};

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-purple-100 text-purple-800",
  tasting_scheduled: "bg-green-100 text-green-800",
  follow_up: "bg-amber-100 text-amber-800",
};

export default function Prospects() {
  const [search, setSearch] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const filtered = useMemo(() => {
    return prospects.filter((p) => {
      const matchesSearch =
        p.business.toLowerCase().includes(search.toLowerCase()) ||
        p.neighborhood.toLowerCase().includes(search.toLowerCase());
      const matchesSegment = segmentFilter === "all" || p.segment === segmentFilter;
      const matchesPriority = priorityFilter === "all" || p.priority === priorityFilter;
      return matchesSearch && matchesSegment && matchesPriority;
    });
  }, [search, segmentFilter, priorityFilter]);

  const highPriorityCount = prospects.filter((p) => p.priority === "high").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Prospect List</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Real Montreal businesses to target for wholesale bagel accounts
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-amber-700" />
              <span className="text-xs text-muted-foreground">Total Prospects</span>
            </div>
            <p className="font-data text-2xl font-bold">{prospectStats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpRight className="h-4 w-4 text-red-600" />
              <span className="text-xs text-muted-foreground">High Priority</span>
            </div>
            <p className="font-data text-2xl font-bold">{highPriorityCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-muted-foreground">Est. Weekly Dozens</span>
            </div>
            <p className="font-data text-2xl font-bold text-amber-800">{prospectStats.estimatedTotalDozens}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb className="h-4 w-4 text-green-600" />
              <span className="text-xs text-muted-foreground">Est. Weekly Revenue</span>
            </div>
            <p className="font-data text-2xl font-bold text-green-700">{prospectStats.estimatedWeeklyRevenue}</p>
          </CardContent>
        </Card>
      </div>

      {/* Segment Breakdown */}
      <Card className="bg-card border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Prospects by Segment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {Object.entries(prospectStats.bySegment).map(([segment, count]) => {
              const Icon = segmentIcons[segment] || Building2;
              return (
                <button
                  key={segment}
                  onClick={() => setSegmentFilter(segmentFilter === segment ? "all" : segment)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all ${
                    segmentFilter === segment
                      ? "border-amber-400 bg-amber-50 shadow-sm"
                      : "border-border/40 hover:border-amber-200"
                  }`}
                >
                  <Icon className="h-5 w-5 text-amber-700" />
                  <span className="text-xs font-semibold">{segment}</span>
                  <span className="text-lg font-data font-bold">{count}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search businesses or neighborhoods..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Select value={segmentFilter} onValueChange={setSegmentFilter}>
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <Filter className="h-3.5 w-3.5 mr-1.5" />
            <SelectValue placeholder="Segment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Segments</SelectItem>
            <SelectItem value="Cafe">Cafes</SelectItem>
            <SelectItem value="Restaurant">Restaurants</SelectItem>
            <SelectItem value="Hotel">Hotels</SelectItem>
            <SelectItem value="Grocery">Grocery</SelectItem>
            <SelectItem value="Catering">Catering</SelectItem>
            <SelectItem value="University">Universities</SelectItem>
            <SelectItem value="Corporate">Corporate</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[140px] h-9 text-sm">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {prospects.length} prospects
      </p>

      {/* Prospect Table */}
      <Card className="bg-card border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold w-[200px]">Business</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Segment</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Area</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Priority</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Est. Dozens</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Why Target</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold">Approach</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((prospect) => {
                const Icon = segmentIcons[prospect.segment] || Building2;
                return (
                  <TableRow key={prospect.id} className="group hover:bg-muted/20">
                    <TableCell className="font-medium text-sm">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-amber-700 shrink-0" />
                        {prospect.business}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-medium">
                        {prospect.segment}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {prospect.neighborhood}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] border ${priorityColors[prospect.priority]}`}>
                        {prospect.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-data text-sm font-semibold">{prospect.estimatedDozens}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {prospect.whyTarget}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {prospect.approach}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          toast.success(`Marked "${prospect.business}" as contacted`, {
                            description: "Follow up in 2-3 days with a tasting offer.",
                          });
                        }}
                      >
                        Mark Contacted
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Action Tips */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-5">
          <h3 className="font-display font-bold text-sm mb-3 text-amber-900">Quick Start Guide</h3>
          <div className="grid md:grid-cols-3 gap-4 text-xs text-amber-800">
            <div>
              <p className="font-semibold mb-1">Week 1: High Priority Drops</p>
              <p>Visit the {highPriorityCount} high-priority prospects first. Bring sample dozens and pricing sheets. Focus on Mile End, Plateau, and Downtown.</p>
            </div>
            <div>
              <p className="font-semibold mb-1">Week 2: Follow Up + Expand</p>
              <p>Follow up with Week 1 contacts. Start reaching out to medium-priority prospects via email and Instagram DMs.</p>
            </div>
            <div>
              <p className="font-semibold mb-1">Week 3+: Close & Grow</p>
              <p>Schedule tastings for interested prospects. Close first accounts. Ask for referrals from signed customers.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
