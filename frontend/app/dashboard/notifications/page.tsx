"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { MotionButton, motionButtonInteraction } from "@/components/ui/motion-button";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationRowActions } from "@/components/notifications/notification-row-actions";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Tick02Icon,
  Settings02Icon,
  Task01Icon,
  AtIcon,
  Folder01Icon,
  AiVideoIcon,
  Notification01Icon,
  InboxIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import {
  useNotificationsList,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  type AppNotification,
  type NotificationCategory,
} from "@/services/notifications";

const CATEGORY_META: Record<
  NotificationCategory,
  { label: string; icon: typeof Task01Icon; tone: string }
> = {
  task: { label: "Tasks", icon: Task01Icon, tone: "text-status-blue bg-status-blue/10" },
  mention: { label: "Mentions", icon: AtIcon, tone: "text-status-purple bg-status-purple/10" },
  project: { label: "Projects", icon: Folder01Icon, tone: "text-status-green bg-status-green/10" },
  meeting: { label: "Meetings", icon: AiVideoIcon, tone: "text-status-orange bg-status-orange/10" },
  system: { label: "System", icon: Notification01Icon, tone: "text-status-neutral bg-status-neutral/10" },
};

const TABS: { value: "all" | "unread" | NotificationCategory | "archived"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "task", label: "Tasks" },
  { value: "mention", label: "Mentions" },
  { value: "project", label: "Projects" },
  { value: "archived", label: "Archived" },
];

function NotificationRow({ n }: { n: AppNotification }) {
  const router = useRouter();
  const markRead = useMarkNotificationRead();
  const meta = CATEGORY_META[n.category] ?? CATEGORY_META.system;

  const open = () => {
    if (!n.readAt) markRead.mutate(n.id);
    if (n.link) router.push(n.link);
  };

  return (
    <div
      className={cn(
        "group relative flex gap-3 border-b px-3 py-2.5 last:border-b-0 transition-colors hover:bg-muted/50",
        !n.readAt && "bg-brand/3",
      )}
    >
      <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg", meta.tone)}>
        <HugeiconsIcon icon={meta.icon} className="size-4" strokeWidth={2} />
      </span>

      <button type="button" onClick={open} className="min-w-0 flex-1 pr-14 text-left">
        <div className="flex items-center gap-2">
          {!n.readAt && <span className="size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />}
          <span className={cn("truncate text-sm leading-snug", !n.readAt && "font-medium")}>{n.title}</span>
          {n.priority === "high" && (
            <span className="shrink-0 rounded px-1 py-px text-[10px] font-medium leading-none text-status-red bg-status-red/10">
              high
            </span>
          )}
        </div>
        {n.body && (
          <p className="mt-0.5 line-clamp-1 text-xs leading-snug text-muted-foreground">{n.body}</p>
        )}
        <p className="mt-1 text-[11px] leading-none text-muted-foreground/70">
          {n.actor ? `${n.actor.user.name} · ` : ""}
          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
        </p>
      </button>

      <NotificationRowActions n={n} />
    </div>
  );
}

export default function NotificationsPage() {
  const [tab, setTab] = React.useState<(typeof TABS)[number]["value"]>("all");
  const markAll = useMarkAllNotificationsRead();

  const params =
    tab === "all"
      ? {}
      : tab === "unread"
        ? { unreadOnly: true }
        : tab === "archived"
          ? { archived: true }
          : { category: tab as NotificationCategory };

  const { data, isPending } = useNotificationsList(params);
  const notifications = data?.data ?? [];

  return (
    <div className="container mx-auto max-w-3xl space-y-5 py-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">Everything that needs your attention, in one inbox.</p>
        </div>
        <div className="flex items-center gap-2">
          <MotionButton
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={markAll.isPending}
            {...motionButtonInteraction}
            onClick={() => markAll.mutate()}
          >
            <HugeiconsIcon icon={Tick02Icon} className="size-4" strokeWidth={2} />
            Mark all read
          </MotionButton>
          <Button asChild variant="ghost" size="sm" className="gap-1.5">
            <Link href="/dashboard/notifications/preferences">
              <HugeiconsIcon icon={Settings02Icon} className="size-4" strokeWidth={2} />
              Preferences
            </Link>
          </Button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              tab === t.value ? "border-brand/40 bg-brand/10 text-brand" : "hover:bg-muted",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isPending ? (
        <div className="overflow-hidden rounded-lg border">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border-b px-3 py-2.5 last:border-b-0">
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center">
          <HugeiconsIcon icon={InboxIcon} className="size-8 text-muted-foreground" strokeWidth={2} />
          <p className="text-sm text-muted-foreground">You&apos;re all caught up. 🎉</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          {notifications.map((n) => (
            <NotificationRow key={n.id} n={n} />
          ))}
        </div>
      )}
    </div>
  );
}
