"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PRIORITY_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  LOW: {
    label: "Low",
    className:
      "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300",
  },
  MEDIUM: {
    label: "Medium",
    className:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
  },
  HIGH: {
    label: "High",
    className:
      "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-200",
  },
  URGENT: {
    label: "Urgent",
    className:
      "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200",
  },
};

export type TaskPriorityBadgeProps = {
  priority: string;
  className?: string;
  label?: string;
};

export function TaskPriorityBadge({ priority, className, label }: TaskPriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority] ?? {
    label: priority,
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
