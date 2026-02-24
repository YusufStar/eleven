"use client";

import { ColumnDef } from "@tanstack/react-table";
import { HugeiconsIcon } from "@hugeicons/react";
import { Folder01Icon, LinkSquare01Icon, NoteIcon } from "@hugeicons/core-free-icons";
import type { Project } from "@/services/projects";
import { ProjectRowActions } from "@/components/projects/project-row-actions";

export const projectsColumns: ColumnDef<Project>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: () => (
      <span className="inline-flex items-center gap-2">
        <HugeiconsIcon icon={Folder01Icon} className="size-4 text-muted-foreground" strokeWidth={2} />
        Name
      </span>
    ),
    cell: ({ row }) => (
      <span className="font-medium text-foreground">{row.original.name?.trim() ?? "—"}</span>
    ),
  },
  {
    id: "slug",
    accessorKey: "slug",
    header: () => (
      <span className="inline-flex items-center gap-2">
        <HugeiconsIcon icon={LinkSquare01Icon} className="size-4 text-muted-foreground" strokeWidth={2} />
        Slug
      </span>
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground font-mono text-sm">{row.original.slug ?? "—"}</span>
    ),
  },
  {
    id: "description",
    accessorKey: "description",
    header: () => (
      <span className="inline-flex items-center gap-2">
        <HugeiconsIcon icon={NoteIcon} className="size-4 text-muted-foreground" strokeWidth={2} />
        Description
      </span>
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground truncate max-w-[240px] block">
        {row.original.description?.trim() ?? "—"}
      </span>
    ),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <div className="flex justify-end w-full">
        <ProjectRowActions project={row.original} />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
];
