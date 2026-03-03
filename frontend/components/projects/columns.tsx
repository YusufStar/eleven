"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { HugeiconsIcon } from "@hugeicons/react";
import { Folder01Icon, LinkSquare01Icon, NoteIcon, GithubIcon } from "@hugeicons/core-free-icons";
import type { Project, ProjectLinkItem } from "@/services/projects";
import { ProjectRowActions } from "@/components/projects/project-row-actions";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function ProjectLinksCell({ links }: { links?: ProjectLinkItem[] | null }) {
  const list = Array.isArray(links) ? links.filter((l) => l?.title != null && l?.url != null) : [];
  if (list.length === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <HugeiconsIcon icon={LinkSquare01Icon} className="size-4" />
          Links
        </Button>
      </PopoverTrigger>
      <PopoverContent align="center" className="flex flex-col gap-1 max-h-64 overflow-auto">
        {list.map((link, i) => (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded px-2 py-1.5 text-sm hover:bg-muted truncate"
              >
                {link.title || link.url}
              </a>
            </TooltipTrigger>
            <TooltipContent>{link.url}</TooltipContent>
          </Tooltip>
        ))}
      </PopoverContent>
    </Popover>
  );
}

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
    cell: ({ row }) => {
      const p = row.original;
      const name = p.name?.trim() ?? "—";
      const href = `/dashboard/projects/${encodeURIComponent(p.slug || p.id)}`;
      return (
        <Link href={href} className="font-medium text-foreground hover:text-primary hover:underline">
          {name}
        </Link>
      );
    },
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
    id: "links",
    accessorKey: "links",
    header: () => (
      <span className="inline-flex items-center gap-2">
        <HugeiconsIcon icon={LinkSquare01Icon} className="size-4 text-muted-foreground" strokeWidth={2} />
        Links
      </span>
    ),
    cell: ({ row }) => <ProjectLinksCell links={row.original.links} />,
    enableSorting: false,
  },
  {
    id: "repository",
    accessorKey: "githubRepoUrl",
    header: () => (
      <span className="inline-flex items-center gap-2">
        <HugeiconsIcon icon={GithubIcon} className="size-4 text-muted-foreground" strokeWidth={2} />
        Repository
      </span>
    ),
    cell: ({ row }) => {
      const url = row.original.githubRepoUrl;
      const label = row.original.githubRepoFullName ?? url;
      if (!url) return <span className="text-muted-foreground">—</span>;
      return (
        <Link
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline truncate max-w-[200px] inline-block"
        >
          {label}
        </Link>
      );
    },
    enableSorting: false,
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
