"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { ActivityListItem } from "@/services/activities";
import { cn } from "@/lib/utils";

const actionClass: Record<string, string> = {
  CREATE: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  UPDATE: "bg-amber-500/12 text-amber-700 dark:text-amber-400 border-amber-500/20",
  DELETE: "bg-red-500/12 text-red-700 dark:text-red-400 border-red-500/20",
  VIEW: "bg-sky-500/12 text-sky-700 dark:text-sky-400 border-sky-500/20",
};

const entityTypeLabel: Record<string, string> = {
  CONTACT: "Contact",
  DEAL: "Deal",
  PROJECT: "Project",
  TASK: "Task",
  PIPELINE: "Pipeline",
  STAGE: "Stage",
  PROJECT_FILE: "File",
  TASK_ATTACHMENT: "Attachment",
  PROJECT_MEMBER: "Member",
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function activitiesColumns(): ColumnDef<ActivityListItem>[] {
  return [
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: "Time",
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground whitespace-nowrap">
          {formatTime(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "action",
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => {
        const a = row.original.action;
        return (
          <span
            className={cn(
              "inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs font-medium",
              actionClass[a] ?? "bg-muted"
            )}
          >
            {a}
          </span>
        );
      },
    },
    {
      id: "entityType",
      accessorKey: "entityType",
      header: "Type",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs font-medium">
          {entityTypeLabel[row.original.entityType] ?? row.original.entityType}
        </span>
      ),
    },
    {
      id: "entity",
      header: "Entity",
      cell: ({ row }) => {
        const x = row.original;
        const label = x.entityTitle?.trim() || x.entityId;
        return (
          <span className="font-medium truncate max-w-[200px] inline-block" title={label}>
            {label || "—"}
          </span>
        );
      },
    },
    {
      id: "member",
      header: "User",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.member?.user?.name ?? "—"}
        </span>
      ),
    },
  ];
}
