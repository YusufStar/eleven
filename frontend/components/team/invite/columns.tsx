"use client";

import { ColumnDef } from "@tanstack/react-table";
import { HugeiconsIcon } from "@hugeicons/react";
import { Mail01Icon, UserGroupIcon, Calendar03Icon, UserIcon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { InviteRowActions } from "./invite-row-actions";
import { formatDistanceToNow } from "date-fns";

export type OrgInvitation = {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: Date;
  expiresAt: Date | null;
  inviter?: { user?: { name?: string | null; email?: string | null } };
};

export const invitesColumns: ColumnDef<OrgInvitation>[] = [
  {
    id: "email",
    accessorKey: "email",
    header: () => (
      <span className="inline-flex items-center gap-2">
        <HugeiconsIcon icon={Mail01Icon} className="size-4 text-muted-foreground" strokeWidth={2} />
        Email
      </span>
    ),
    cell: ({ row }) => (
      <a
        href={row.original.email ? `mailto:${row.original.email}` : undefined}
        className="block max-w-[220px] truncate font-medium text-primary hover:underline"
      >
        {row.original.email ?? "—"}
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
      <span className="capitalize text-muted-foreground">{row.original.role ?? "—"}</span>
    ),
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = (row.original.status ?? "pending") as string;
      return (
        <Badge variant="secondary" className="capitalize">
          {status}
        </Badge>
      );
    },
  },
  {
    id: "invitedBy",
    accessorFn: (row) => row.inviter?.user?.name ?? row.inviter?.user?.email,
    header: () => (
      <span className="inline-flex items-center gap-2">
        <HugeiconsIcon icon={UserIcon} className="size-4 text-muted-foreground" strokeWidth={2} />
        Invited by
      </span>
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.inviter?.user?.name ?? row.original.inviter?.user?.email ?? "—"}
      </span>
    ),
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: () => (
      <span className="inline-flex items-center gap-2">
        <HugeiconsIcon icon={Calendar03Icon} className="size-4 text-muted-foreground" strokeWidth={2} />
        Invited
      </span>
    ),
    cell: ({ row }) => {
      const d = row.original.createdAt;
      const date = typeof d === "string" ? new Date(d) : d;
      return (
        <span className="text-muted-foreground text-sm">
          {date ? formatDistanceToNow(date, { addSuffix: true }) : "—"}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => <InviteRowActions invitation={row.original} />,
    enableSorting: false,
    enableHiding: false,
  },
];
