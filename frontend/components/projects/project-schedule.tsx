"use client";

import * as React from "react";
import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon, Flag02Icon } from "@hugeicons/core-free-icons";
import { IconButton } from "@/components/ui/icon-button";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import type { ProjectDetailTask } from "@/services/projects";
import { useProjectMilestones, type MilestoneRow } from "@/services/projects";

type Item = {
  id: string;
  title: string;
  date: Date;
  kind: "task" | "milestone";
  status?: string;
  done: boolean;
};

function buildItems(tasks: ProjectDetailTask[], milestones: MilestoneRow[]): Item[] {
  const items: Item[] = [];
  for (const t of tasks) {
    if (!t.dueAt) continue;
    items.push({ id: t.id, title: t.title, date: new Date(t.dueAt), kind: "task", status: t.status, done: !!t.completedAt });
  }
  for (const m of milestones) {
    if (!m.dueAt) continue;
    items.push({ id: m.id, title: m.name, date: new Date(m.dueAt), kind: "milestone", done: !!m.completedAt });
  }
  return items;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function ProjectCalendar({ projectId, tasks }: { projectId: string; tasks: ProjectDetailTask[] }) {
  const { data: milestones } = useProjectMilestones(projectId);
  const [cursor, setCursor] = React.useState(() => startOfMonth(new Date()));
  const items = React.useMemo(() => buildItems(tasks, milestones ?? []), [tasks, milestones]);

  const days = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const itemsFor = (day: Date) => items.filter((i) => isSameDay(i.date, day));

  return (
    <div className="rounded-xl border">
      <div className="flex items-center justify-between border-b p-3">
        <h3 className="text-sm font-semibold">{format(cursor, "MMMM yyyy")}</h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setCursor(startOfMonth(new Date()))}>
            Today
          </Button>
          <IconButton variant="ghost" className="size-7" label="Previous month" onClick={() => setCursor((c) => addMonths(c, -1))}>
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" strokeWidth={2} />
          </IconButton>
          <IconButton variant="ghost" className="size-7" label="Next month" onClick={() => setCursor((c) => addMonths(c, 1))}>
            <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" strokeWidth={2} />
          </IconButton>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1.5">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayItems = itemsFor(day);
          const inMonth = isSameMonth(day, cursor);
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-24 border-b border-r p-1.5 last:border-r-0 [&:nth-child(7n)]:border-r-0",
                !inMonth && "bg-muted/30 text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-6 items-center justify-center rounded-full text-xs",
                  isToday(day) && "bg-brand font-semibold text-white",
                )}
              >
                {format(day, "d")}
              </span>
              <div className="mt-1 space-y-1">
                {dayItems.slice(0, 3).map((i) =>
                  i.kind === "milestone" ? (
                    <div
                      key={i.id}
                      className="flex items-center gap-1 truncate rounded bg-status-purple/10 px-1 py-0.5 text-[10px] text-status-purple"
                      title={i.title}
                    >
                      <HugeiconsIcon icon={Flag02Icon} className="size-3 shrink-0" strokeWidth={2} />
                      <span className="truncate">{i.title}</span>
                    </div>
                  ) : (
                    <Link
                      key={i.id}
                      href={`/dashboard/tasks/${i.id}`}
                      className={cn(
                        "block truncate rounded px-1 py-0.5 text-[10px] hover:opacity-80",
                        i.done ? "bg-status-green/10 text-status-green line-through" : "bg-status-blue/10 text-status-blue",
                      )}
                      title={i.title}
                    >
                      {i.title}
                    </Link>
                  ),
                )}
                {dayItems.length > 3 && (
                  <span className="block text-[10px] text-muted-foreground">+{dayItems.length - 3} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ProjectTimeline({ projectId, tasks }: { projectId: string; tasks: ProjectDetailTask[] }) {
  const { data: milestones } = useProjectMilestones(projectId);
  const items = React.useMemo(
    () => buildItems(tasks, milestones ?? []).sort((a, b) => a.date.getTime() - b.date.getTime()),
    [tasks, milestones],
  );

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
        No scheduled tasks or milestones yet. Add due dates to see them on the timeline.
      </div>
    );
  }

  const min = items[0].date.getTime();
  const max = items[items.length - 1].date.getTime();
  const span = Math.max(1, max - min);
  const pct = (d: Date) => ((d.getTime() - min) / span) * 100;
  const now = Date.now();
  const nowPct = now >= min && now <= max ? ((now - min) / span) * 100 : null;

  return (
    <div className="rounded-xl border p-4">
      <div className="mb-3 flex justify-between text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <span>{format(new Date(min), "MMM d, yyyy")}</span>
        <span>{format(new Date(max), "MMM d, yyyy")}</span>
      </div>
      <div className="space-y-1.5">
        {items.map((i) => (
          <div key={`${i.kind}-${i.id}`} className="group flex items-center gap-3">
            <div className="w-40 shrink-0 truncate text-sm">
              {i.kind === "milestone" ? (
                <span className="flex items-center gap-1 font-medium text-status-purple">
                  <HugeiconsIcon icon={Flag02Icon} className="size-3.5 shrink-0" strokeWidth={2} />
                  <span className="truncate">{i.title}</span>
                </span>
              ) : (
                <Link href={`/dashboard/tasks/${i.id}`} className="truncate hover:underline">
                  {i.title}
                </Link>
              )}
            </div>
            <div className="relative h-6 flex-1 rounded bg-muted/40">
              {nowPct != null && (
                <span className="absolute inset-y-0 z-0 w-px bg-status-red/50" style={{ left: `${nowPct}%` }} />
              )}
              <span
                className={cn(
                  "absolute top-1/2 z-10 -translate-y-1/2 -translate-x-1/2",
                  i.kind === "milestone"
                    ? "size-3 rotate-45 rounded-[2px] bg-status-purple"
                    : i.done
                      ? "size-2.5 rounded-full bg-status-green"
                      : "size-2.5 rounded-full bg-status-blue",
                )}
                style={{ left: `${pct(i.date)}%` }}
                title={`${i.title} · ${format(i.date, "MMM d")}`}
              />
            </div>
            <span className="w-16 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
              {format(i.date, "MMM d")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
