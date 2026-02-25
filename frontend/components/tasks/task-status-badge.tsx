"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TaskStatusValue } from "@/services/tasks/types";

const STATUS_CONFIG: Record<
  TaskStatusValue,
  { label: string; className: string }
> = {
  TODO: {
    label: "To do",
    className:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
  },
  IN_PROGRESS: {
    label: "In progress",
    className:
      "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200",
  },
  DONE: {
    label: "Done",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
  },
  CANCELLED: {
    label: "Cancelled",
    className:
      "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400",
  },
};

export type TaskStatusBadgeProps = {
  status: string;
  className?: string;
  /** Override display label; default from STATUS_CONFIG */
  label?: string;
};

export function TaskStatusBadge({ status, className, label }: TaskStatusBadgeProps) {
  const config = STATUS_CONFIG[status as TaskStatusValue] ?? {
    label: status,
    className: "border-border bg-muted text-muted-foreground",
  };
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", config.className, className)}
    >
      {label ?? config.label}
    </Badge>
  );
}
