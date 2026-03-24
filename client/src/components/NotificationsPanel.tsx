/**
 * NotificationsPanel — Bell icon dropdown showing recent notifications
 * with unread count badge, mark as read, and mark all read
 */

import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Bell, Check, CheckCheck, Trash2, Inbox, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocation } from "wouter";

const typeConfig: Record<string, { emoji: string; color: string }> = {
  new_lead: { emoji: "📥", color: "bg-blue-500" },
  tasting_request: { emoji: "🥯", color: "bg-amber-500" },
  new_order: { emoji: "📦", color: "bg-green-500" },
  order_status: { emoji: "🚚", color: "bg-purple-500" },
  system: { emoji: "⚙️", color: "bg-slate-500" },
};

function timeAgo(date: Date | string): string {
  const now = new Date();
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return d.toLocaleDateString();
}

export default function NotificationsPanel() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  const { data: unreadCount = 0 } = trpc.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 30000, // Poll every 30 seconds
  });

  const { data: notifications = [], refetch } = trpc.notifications.list.useQuery(
    { limit: 30 },
    { enabled: open }
  );

  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      refetch();
      trpcUtils.notifications.unreadCount.invalidate();
    },
  });

  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      refetch();
      trpcUtils.notifications.unreadCount.invalidate();
    },
  });

  const deleteNotif = trpc.notifications.delete.useMutation({
    onSuccess: () => {
      refetch();
      trpcUtils.notifications.unreadCount.invalidate();
    },
  });

  const trpcUtils = trpc.useUtils();

  // Close panel on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  const handleNotificationClick = (notif: { id: number; isRead: number; link: string | null }) => {
    if (!notif.isRead) {
      markRead.mutate({ id: notif.id });
    }
    if (notif.link) {
      navigate(notif.link);
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative h-8 w-8"
        onClick={() => setOpen(!open)}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 rounded-lg border border-border bg-background shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-amber-50 text-amber-700">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                Mark all read
              </Button>
            )}
          </div>

          <Separator />

          {/* Notification List */}
          <ScrollArea className="max-h-[400px]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Inbox className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">No notifications yet</p>
                <p className="text-xs mt-0.5">You'll see alerts for new leads, orders, and tastings here</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {notifications.map((notif) => {
                  const config = typeConfig[notif.type] || typeConfig.system;
                  return (
                    <div
                      key={notif.id}
                      className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                        !notif.isRead ? "bg-amber-50/30 dark:bg-amber-950/10" : ""
                      }`}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      {/* Type indicator */}
                      <div className="flex-shrink-0 mt-0.5">
                        <span className="text-base">{config.emoji}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs leading-snug ${!notif.isRead ? "font-semibold" : ""}`}>
                            {notif.title}
                          </p>
                          {!notif.isRead && (
                            <span className="flex-shrink-0 h-2 w-2 rounded-full bg-amber-500 mt-1" />
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-muted-foreground">
                            {timeAgo(notif.createdAt)}
                          </span>
                          {notif.link && (
                            <ExternalLink className="h-2.5 w-2.5 text-muted-foreground/50" />
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notif.isRead && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              markRead.mutate({ id: notif.id });
                            }}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotif.mutate({ id: notif.id });
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
