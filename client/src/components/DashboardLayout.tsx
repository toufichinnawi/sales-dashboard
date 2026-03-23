/**
 * DashboardLayout — Hinnawi Bros Bagels Wholesale
 * Warm bakery-inspired branding with persistent sidebar
 */

import { useLocation, Link } from "wouter";
import {
  LayoutDashboard,
  GitBranch,
  Briefcase,
  Users,
  BarChart3,
  Target,
  Inbox,
  Settings,
  Bell,
  Search,
  ChevronRight,
  Cookie,
  Building2,
  ShoppingBag,
  Repeat,
  Link2,
  UtensilsCrossed,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { kpiData, formatCurrency, formatPercent } from "@/lib/data";

const navSections = [
  {
    label: "Sales Operations",
    items: [
      { path: "/", label: "Overview", icon: LayoutDashboard },
      { path: "/leads", label: "Leads", icon: Inbox },
      { path: "/customers", label: "Accounts", icon: Building2 },
      { path: "/orders", label: "Orders", icon: ShoppingBag },
      { path: "/recurring", label: "Standing Orders", icon: Repeat },
      { path: "/tastings", label: "Tasting Requests", icon: UtensilsCrossed },
    ],
  },
  {
    label: "Analytics & Pipeline",
    items: [
      { path: "/pipeline", label: "Pipeline", icon: GitBranch },
      { path: "/deals", label: "Accounts", icon: Briefcase },
      { path: "/team", label: "Team", icon: Users },
      { path: "/analytics", label: "Analytics", icon: BarChart3 },
      { path: "/prospects", label: "Prospects", icon: Target },
    ],
  },
  {
    label: "Settings",
    items: [
      { path: "/quickbooks", label: "QuickBooks", icon: Link2 },
    ],
  },
];

const allNavItems = navSections.flatMap((s) => s.items);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r border-border/60">
        <SidebarHeader className="px-3 py-4">
          <div className="flex items-center gap-2.5 group-data-[collapsible=icon]:justify-center">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Cookie className="h-4 w-4" />
            </div>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="font-display text-sm font-bold tracking-tight">Hinnawi Bros</span>
              <span className="text-[11px] text-muted-foreground leading-none">Wholesale Bagels</span>
            </div>
          </div>
        </SidebarHeader>

        <Separator className="mx-3 w-auto" />

        <SidebarContent className="pt-2">
          {navSections.map((section) => (
            <SidebarGroup key={section.label}>
              <SidebarGroupLabel className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/70">
                {section.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        asChild
                        isActive={location === item.path}
                        tooltip={item.label}
                      >
                        <Link to={item.path}>
                          <item.icon className="h-4 w-4" />
                          <span className="text-[13px]">{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}

          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/70">
              This Month
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-2 space-y-3 group-data-[collapsible=icon]:hidden">
                <QuickStat label="Revenue" value={formatCurrency(kpiData.monthlyRevenue)} change={formatPercent(kpiData.revenueChange)} positive />
                <QuickStat label="Accounts" value={String(kpiData.activeAccounts)} change={formatPercent(kpiData.accountsChange)} positive />
                <QuickStat label="Dz/Week" value={String(kpiData.weeklyDozens)} change={formatPercent(kpiData.dozensChange)} positive />
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="pb-3">
          <Separator className="mx-3 w-auto mb-2" />
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Settings"
                onClick={() => toast("Settings panel coming soon")}
              >
                <Settings className="h-4 w-4" />
                <span className="text-[13px]">Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <div className="px-2 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
            <div className="flex items-center gap-2.5 rounded-md p-2 group-data-[collapsible=icon]:p-0">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  RM
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="text-xs font-medium">Rosie Manneh</span>
                <span className="text-[10px] text-muted-foreground">Founder</span>
              </div>
            </div>
          </div>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        {/* Top header bar */}
        <header className="sticky top-0 z-30 flex h-12 items-center gap-3 border-b border-border/60 bg-background/95 backdrop-blur-sm px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-5" />

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm">
            <span className="text-muted-foreground text-xs">Wholesale</span>
            <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
            <span className="font-medium text-xs">
              {allNavItems.find((n) => n.path === location)?.label || "Overview"}
            </span>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search accounts, contacts..."
                className="h-8 w-56 pl-8 text-xs bg-muted/50 border-transparent focus:border-border"
              />
            </div>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8"
              onClick={() => toast("Notifications panel coming soon")}
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-amber-500" />
            </Button>
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function QuickStat({
  label,
  value,
  change,
  positive,
}: {
  label: string;
  value: string;
  change: string;
  positive: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="font-data text-xs font-medium">{value}</span>
        <Badge
          variant="secondary"
          className={`h-4 px-1 text-[9px] font-medium ${
            positive ? "text-amber-700 bg-amber-50" : "text-red-600 bg-red-50"
          }`}
        >
          {change}
        </Badge>
      </div>
    </div>
  );
}
