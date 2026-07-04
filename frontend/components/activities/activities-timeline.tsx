"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/string";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Task01Icon,
  Folder01Icon,
  RocketIcon,
  Flag02Icon,
  File02Icon,
  AttachmentIcon,
  UserGroupIcon,
  BubbleChatQuestionIcon,
  AiVideoIcon,
  UserIcon,
  ChartLineData01Icon,
} from "@hugeicons/core-free-icons";
import type { ActivityListItem, ActivityEntityType } from "@/services/activities";

const ENTITY: Record<
  ActivityEntityType,
  { label: string; icon: typeof Task01Icon; tone: string; href?: (id: string) => string }
> = {
  TASK: { label: "Task", icon: Task01Icon, tone: "text-status-blue bg-status-blue/10", href: (id) => `/dashboard/tasks/${id}` },
  PROJECT: { label: "Project", icon: Folder01Icon, tone: "text-status-purple bg-status-purple/10" },
  SPRINT: { label: "Sprint", icon: RocketIcon, tone: "text-brand bg-brand/10", href: () => "/dashboard/sprints" },
  MILESTONE: { label: "Milestone", icon: Flag02Icon, tone: "text-status-purple bg-status-purple/10" },
  PROJECT_FILE: { label: "File", icon: File02Icon, tone: "text-status-green bg-status-green/10", href: () => "/dashboard/files" },
  TASK_ATTACHMENT: { label: "Attachment", icon: AttachmentIcon, tone: "text-status-green bg-status-green/10" },
  PROJECT_MEMBER: { label: "Member", icon: UserGroupIcon, tone: "text-status-neutral bg-status-neutral/10" },
  MESSAGE: { label: "Message", icon: BubbleChatQuestionIcon, tone: "text-status-blue bg-status-blue/10" },
  MEETING: { label: "Meeting", icon: AiVideoIcon, tone: "text-status-orange bg-status-orange/10" },
  MEMBER: { label: "Member", icon: UserIcon, tone: "text-status-neutral bg-status-neutral/10" },
  AI_REPORT: { label: "AI report", icon: ChartLineData01Icon, tone: "text-brand bg-brand/10", href: () => "/dashboard/reports" },
};

const ACTION_VERB: Record<string, string> = {
  CREATE: "created",
  UPDATE: "updated",
  DELETE: "deleted",
  VIEW: "viewed",
  COMMENT: "commented on",
  ASSIGN: "assigned",
  COMPLETE: "completed",
  MENTION: "mentioned in",
};

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function ActivitiesTimeline({
  activities,
  loading,
  fetching,
}: {
  activities: ActivityListItem[];
  loading: boolean;
  fetching?: boolean;
}) {
  const groups = React.useMemo(() => {
    const map = new Map<string, ActivityListItem[]>();
    for (const a of activities) {
      const key = new Date(a.createdAt).toDateString();
      const arr = map.get(key) ?? [];
      arr.push(a);
      map.set(key, arr);
    }
    return [...map.entries()];
  }, [activities]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed py-16 text-center">
        <HugeiconsIcon icon={Task01Icon} className="size-8 text-muted-foreground" strokeWidth={2} />
        <p className="text-sm text-muted-foreground">No activity matches these filters yet.</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6 transition-opacity", fetching && "opacity-70")}>
      {groups.map(([day, items]) => (
        <section key={day}>
          <div className="sticky top-0 z-10 -mx-1 mb-2 bg-background/80 px-1 py-1 backdrop-blur">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{dayLabel(items[0].createdAt)}</h2>
          </div>
          <ul className="relative space-y-1 before:absolute before:left-[18px] before:top-2 before:bottom-2 before:w-px before:bg-border">
            {items.map((a) => {
              const meta = ENTITY[a.entityType] ?? ENTITY.TASK;
              const label = a.entityTitle?.trim() || a.entityId;
              const href = meta.href?.(a.entityId);
              const inner = (
                <>
                  <span className="font-medium">{a.member?.user?.name ?? "Someone"}</span>{" "}
                  <span className="text-muted-foreground">{ACTION_VERB[a.action] ?? a.action.toLowerCase()}</span>{" "}
                  <span className="text-muted-foreground">{meta.label.toLowerCase()}</span>{" "}
                  <span className="font-medium">{label}</span>
                </>
              );
              return (
                <motion.li
                  key={a.id}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15 }}
                  className="relative flex items-center gap-3 rounded-lg px-1 py-2 transition-colors hover:bg-muted/40"
                >
                  <span className={cn("z-10 flex size-9 shrink-0 items-center justify-center rounded-full ring-4 ring-background", meta.tone)}>
                    <HugeiconsIcon icon={meta.icon} className="size-4" strokeWidth={2} />
                  </span>
                  <div className="min-w-0 flex-1 text-sm">
                    {href ? (
                      <Link href={href} className="hover:underline">
                        {inner}
                      </Link>
                    ) : (
                      <span>{inner}</span>
                    )}
                  </div>
                  <span className="flex shrink-0 items-center gap-2">
                    {a.member?.user && (
                      <Avatar className="size-5">
                        <AvatarImage src={a.member.user.image ?? undefined} alt="" />
                        <AvatarFallback className="text-[9px]">{initials(a.member.user.name)}</AvatarFallback>
                      </Avatar>
                    )}
                    <span className="text-xs tabular-nums text-muted-foreground">{timeLabel(a.createdAt)}</span>
                  </span>
                </motion.li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
