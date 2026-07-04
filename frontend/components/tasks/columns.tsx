"use client";

import { ColumnDef } from "@tanstack/react-table";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Task01Icon,
  Flag03Icon,
  UserIcon,
  Calendar03Icon,
  Folder01Icon,
} from "@hugeicons/core-free-icons";
import type { Task } from "@/services/tasks";
import { StatusBadge } from "@/components/ui/status-badge";

export const tasksColumns: ColumnDef<Task>[] = [
  {
    id: "title",
    accessorKey: "title",
    header: () => (
      <span className="inline-flex items-center gap-2">
        <HugeiconsIcon icon={Task01Icon} className="size-4 text-muted-foreground" strokeWidth={2} />
        Title
      </span>
    ),
    cell: ({ row }) => (
      <span className="font-medium text-foreground">{row.original.title?.trim() ?? "—"}</span>
    ),
  },
  {
    id: "status",
    accessorKey: "status",
    header: () => (
      <span className="inline-flex items-center gap-2">
        <HugeiconsIcon icon={Flag03Icon} className="size-4 text-muted-foreground" strokeWidth={2} />
        Status
      </span>
    ),
    cell: ({ row }) => <StatusBadge domain="task" value={row.original.status} />,
  },
  {
    id: "priority",
    accessorKey: "priority",
    header: () => (
      <span className="inline-flex items-center gap-2">
        <HugeiconsIcon icon={Flag03Icon} className="size-4 text-muted-foreground" strokeWidth={2} />
        Priority
      </span>
    ),
    cell: ({ row }) => <StatusBadge domain="priority" value={row.original.priority} />,
  },
  {
    id: "project",
    accessorKey: "project",
    header: () => (
      <span className="inline-flex items-center gap-2">
        <HugeiconsIcon icon={Folder01Icon} className="size-4 text-muted-foreground" strokeWidth={2} />
        Project
      </span>
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.project?.name?.trim() ?? "—"}
      </span>
    ),
  },
  {
    id: "assignee",
    accessorKey: "assignee",
    header: () => (
      <span className="inline-flex items-center gap-2">
        <HugeiconsIcon icon={UserIcon} className="size-4 text-muted-foreground" strokeWidth={2} />
        Assignee
      </span>
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.assignee?.user?.name?.trim() ?? "—"}
      </span>
    ),
  },
  {
    id: "dueAt",
    accessorKey: "dueAt",
    header: () => (
      <span className="inline-flex items-center gap-2">
        <HugeiconsIcon icon={Calendar03Icon} className="size-4 text-muted-foreground" strokeWidth={2} />
        Due date
      </span>
    ),
    cell: ({ row }) => {
      const due = row.original.dueAt;
      if (!due) return <span className="text-muted-foreground">—</span>;
      try {
        const d = new Date(due);
        return (
          <span className="text-muted-foreground">
            {d.toLocaleDateString(undefined, { dateStyle: "medium" })}
          </span>
        );
      } catch {
        return <span className="text-muted-foreground">—</span>;
      }
    },
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: () => (
      <div className="flex justify-end w-full">
        <span className="text-muted-foreground text-sm">—</span>
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
];
