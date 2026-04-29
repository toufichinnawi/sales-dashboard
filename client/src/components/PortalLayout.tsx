/**
 * PortalLayout — Mobile-first customer portal layout
 * Bottom tab navigation for phone, sidebar for desktop
 */

import { useLocation, Link } from "wouter";
import {
  ShoppingBag,
  Repeat,
  PlusCircle,
  User,
  Cookie,
  LogOut,
  FileText,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

const portalNav = [
  { path: "/portal", label: "Orders", icon: ShoppingBag },
  { path: "/portal/standing", label: "Standing", icon: Repeat },
  { path: "/portal/order", label: "Order", icon: PlusCircle },
  { path: "/portal/documents", label: "Docs", icon: FileText },
  { path: "/portal/profile", label: "Profile", icon: User },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { data: customer } = trpc.portal.me.useQuery();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top header */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur-sm px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Cookie className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-sm font-bold tracking-tight">Hinnawi Bros</span>
              <span className="text-[11px] text-muted-foreground leading-none">
                {customer?.businessName ?? "Customer Portal"}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={() => logout()}
          >
            <LogOut className="h-3.5 w-3.5 mr-1" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-6">
        <div className="max-w-2xl mx-auto px-4 py-4">
          {children}
        </div>
      </main>

      {/* Bottom tab navigation (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border/60 bg-background/95 backdrop-blur-sm md:hidden">
        <div className="flex items-center justify-around py-2">
          {portalNav.map((item) => {
            const isActive = location === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : ""}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop side navigation */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-56 border-r border-border/60 bg-background flex-col pt-16 px-3">
        <div className="space-y-1 mt-4">
          {portalNav.map((item) => {
            const isActive = location === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
