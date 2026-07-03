"use client";

import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import { BellIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  useNotificationsList,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  type AppNotification,
} from "@/services/notifications";

function NotificationRow({ n, onOpen }: { n: AppNotification; onOpen: (n: AppNotification) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(n)}
      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60"
    >
      <span
        aria-hidden
        className={`mt-1.5 size-2 shrink-0 rounded-full ${n.readAt ? "bg-transparent" : "bg-foreground"}`}
      />
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-sm ${n.readAt ? "text-muted-foreground" : "font-medium"}`}>
          {n.title}
        </span>
        {n.body && <span className="block truncate text-xs text-muted-foreground">{n.body}</span>}
        <span className="mt-0.5 block text-[11px] text-muted-foreground/70">
          {n.actor ? `${n.actor.user.name} · ` : ""}
          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
        </span>
      </span>
    </button>
  );
}

export function NotificationBell() {
  const router = useRouter();
  const { data: unread } = useUnreadCount();
  const { data: list, isPending } = useNotificationsList();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const count = unread?.count ?? 0;
  const notifications = list?.data ?? [];

  const open = (n: AppNotification) => {
    if (!n.readAt) markRead.mutate(n.id);
    if (n.link) router.push(n.link);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative" aria-label={`Notifications${count ? ` (${count} unread)` : ""}`}>
          <HugeiconsIcon icon={BellIcon} className="size-4.5" strokeWidth={1.8} />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 font-mono text-[10px] leading-none text-background">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-medium">Notifications</h2>
          {count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending}
            >
              <HugeiconsIcon icon={Tick02Icon} className="size-3.5" strokeWidth={2} />
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {isPending ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nothing yet. You&apos;ll see task assignments, deal updates, and meeting invites here.
            </p>
          ) : (
            notifications.map((n) => <NotificationRow key={n.id} n={n} onOpen={open} />)
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
