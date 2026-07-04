"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Tick02Icon,
  Archive02Icon,
  Clock01Icon,
  Settings02Icon,
  Task01Icon,
  AtIcon,
  Folder01Icon,
  AiVideoIcon,
  Notification01Icon,
  InboxIcon,
  MoreVerticalIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/string";
import {
  useNotificationsList,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useArchiveNotification,
  useSnoozeNotification,
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

function snoozeTimes(): { label: string; until: string }[] {
  const now = new Date();
  const inHours = (h: number) => new Date(now.getTime() + h * 3600_000).toISOString();
  const tomorrow9 = new Date(now);
  tomorrow9.setDate(now.getDate() + 1);
  tomorrow9.setHours(9, 0, 0, 0);
  return [
    { label: "1 hour", until: inHours(1) },
    { label: "3 hours", until: inHours(3) },
    { label: "Tomorrow 9am", until: tomorrow9.toISOString() },
  ];
}

function NotificationRow({ n }: { n: AppNotification }) {
  const router = useRouter();
  const markRead = useMarkNotificationRead();
  const archive = useArchiveNotification();
  const snooze = useSnoozeNotification();
  const meta = CATEGORY_META[n.category] ?? CATEGORY_META.system;

  const open = () => {
    if (!n.readAt) markRead.mutate(n.id);
    if (n.link) router.push(n.link);
  };

  return (
    <Card
      size="sm"
      className={cn(
        "group flex items-start gap-3 p-3 transition-colors hover:bg-muted/40",
        !n.readAt && "border-l-2 border-l-brand",
      )}
    >
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", meta.tone)}>
        <HugeiconsIcon icon={meta.icon} className="size-4" strokeWidth={2} />
      </span>
      <button type="button" onClick={open} className="min-w-0 flex-1 text-left">
        <div className="flex items-center gap-2">
          <span className={cn("truncate text-sm", n.readAt ? "text-muted-foreground" : "font-semibold")}>{n.title}</span>
          {n.priority === "high" && (
            <span className="shrink-0 rounded-full bg-status-red/12 px-1.5 text-[10px] font-medium text-status-red">high</span>
          )}
        </div>
        {n.body && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>}
        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground/70">
          {n.actor && (
            <Avatar className="size-3.5">
              <AvatarImage src={n.actor.user.image ?? undefined} alt="" />
              <AvatarFallback className="text-[7px]">{initials(n.actor.user.name)}</AvatarFallback>
            </Avatar>
          )}
          {n.actor ? `${n.actor.user.name} · ` : ""}
          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
        </p>
      </button>
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        {!n.readAt && (
          <Button variant="ghost" size="icon" className="size-7" aria-label="Mark read" onClick={() => markRead.mutate(n.id)}>
            <HugeiconsIcon icon={Tick02Icon} className="size-4" strokeWidth={2} />
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7" aria-label="Snooze">
              <HugeiconsIcon icon={Clock01Icon} className="size-4" strokeWidth={2} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {snoozeTimes().map((s) => (
              <DropdownMenuItem
                key={s.label}
                onClick={() =>
                  snooze.mutate(
                    { id: n.id, until: s.until },
                    { onSuccess: () => toast.success(`Snoozed for ${s.label.toLowerCase()}`) },
                  )
                }
              >
                {s.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          aria-label={n.archivedAt ? "Unarchive" : "Archive"}
          onClick={() => archive.mutate({ id: n.id, archived: !n.archivedAt })}
        >
          <HugeiconsIcon icon={Archive02Icon} className="size-4" strokeWidth={2} />
        </Button>
      </div>
    </Card>
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
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
            <HugeiconsIcon icon={Tick02Icon} className="size-4" strokeWidth={2} />
            Mark all read
          </Button>
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
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed py-16 text-center">
          <HugeiconsIcon icon={InboxIcon} className="size-8 text-muted-foreground" strokeWidth={2} />
          <p className="text-sm text-muted-foreground">You&apos;re all caught up. 🎉</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <NotificationRow key={n.id} n={n} />
          ))}
        </div>
      )}
    </div>
  );
}
