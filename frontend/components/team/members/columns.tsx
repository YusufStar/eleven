"use client";

import { ColumnDef } from "@tanstack/react-table";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserIcon, Mail01Icon, UserGroupIcon, GithubIcon } from "@hugeicons/core-free-icons";
import Image from "next/image";
import type { TeamMember } from "@/services/team";
import { MemberRowActions } from "./member-row-actions";

export const membersColumns: ColumnDef<TeamMember>[] = [
  {
    id: "name",
    accessorFn: (row) => row.user.name,
    header: () => (
      <span className="inline-flex items-center gap-2">
        <HugeiconsIcon icon={UserIcon} className="size-4 text-muted-foreground" strokeWidth={2} />
        Name
      </span>
    ),
    cell: ({ row }) => {
      const m = row.original;
      const name = m.user?.name?.trim() ?? "—";
      return (
        <span className="inline-flex items-center gap-2">
          {m.user?.image ? (
            <span className="relative block h-8 w-8 shrink-0 overflow-hidden rounded-lg">
              <Image
                src={m.user.image}
                alt=""
                fill
                className="rounded-lg object-cover"
              />
            </span>
          ) : null}
          <span className="font-medium text-foreground">{name}</span>
        </span>
      );
    },
  },
  {
    id: "email",
    accessorFn: (row) => row.user.email,
    header: () => (
      <span className="inline-flex items-center gap-2">
        <HugeiconsIcon icon={Mail01Icon} className="size-4 text-muted-foreground" strokeWidth={2} />
        Email
      </span>
    ),
    cell: ({ row }) => (
      <a
        href={row.original.user?.email ? `mailto:${row.original.user.email}` : undefined}
        className="block max-w-[200px] truncate text-primary hover:underline"
      >
        {row.original.user?.email ?? "—"}
      </a>
    ),
  },
  {
    id: "role",
    accessorKey: "role",
    header: () => (
      <span className="inline-flex items-center gap-2">
        <HugeiconsIcon icon={UserGroupIcon} className="size-4 text-muted-foreground" strokeWidth={2} />
        Role
      </span>
    ),
    cell: ({ row }) => (
      <span className="capitalize text-muted-foreground">
        {row.original.role ?? "—"}
      </span>
    ),
  },
  {
    id: "github",
    accessorFn: (row) => row.user?.githubProfile?.githubLogin ?? null,
    header: () => (
      <span className="inline-flex items-center gap-2">
        <HugeiconsIcon icon={GithubIcon} className="size-4 text-muted-foreground" strokeWidth={2} />
        GitHub
      </span>
    ),
    cell: ({ row }) => {
      const gh = row.original.user?.githubProfile;
      if (!gh) return <span className="text-muted-foreground text-sm">Not connected</span>;
      return (
        <span className="inline-flex items-center gap-2">
          {gh.avatarUrl ? (
            <img src={gh.avatarUrl} alt="" className="size-6 rounded-full" />
          ) : null}
          <span className="text-sm">@{gh.githubLogin}</span>
        </span>
      );
    },
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => <MemberRowActions member={row.original} />,
    enableSorting: false,
    enableHiding: false,
  },
];
