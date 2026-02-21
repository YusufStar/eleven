"use client";

import { ColumnDef } from "@tanstack/react-table";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserIcon,
  Mail01Icon,
  Call02Icon,
  Briefcase01Icon,
  Building01Icon,
  StatusIcon,
  SparklesIcon,
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import Image from "next/image";
import type { Contact, ContactStatus } from "@/services/contacts";
import { ContactRowActions } from "@/components/contacts/contact-row-actions";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  ContactStatus,
  { label: string; icon: typeof SparklesIcon; className: string }
> = {
  LEAD: {
    label: "Lead",
    icon: SparklesIcon,
    className:
      "bg-amber-500/12 text-amber-700 dark:text-amber-400 border border-amber-500/20 [&_svg]:text-amber-600 dark:[&_svg]:text-amber-400",
  },
  PROSPECT: {
    label: "Prospect",
    icon: ArrowRight01Icon,
    className:
      "bg-blue-500/12 text-blue-700 dark:text-blue-400 border border-blue-500/20 [&_svg]:text-blue-600 dark:[&_svg]:text-blue-400",
  },
  CUSTOMER: {
    label: "Customer",
    icon: CheckmarkCircle01Icon,
    className:
      "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 [&_svg]:text-emerald-600 dark:[&_svg]:text-emerald-400",
  },
  CHURNED: {
    label: "Churned",
    icon: Cancel01Icon,
    className:
      "bg-red-500/12 text-red-700 dark:text-red-400 border border-red-500/20 [&_svg]:text-red-600 dark:[&_svg]:text-red-400",
  },
  PARTNER: {
    label: "Partner",
    icon: UserGroupIcon,
    className:
      "bg-violet-500/12 text-violet-700 dark:text-violet-400 border border-violet-500/20 [&_svg]:text-violet-600 dark:[&_svg]:text-violet-400",
  },
};

function ContactStatusBadge({ status }: { status: ContactStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-tight border [&_svg]:size-3 shrink-0",
        config.className
      )}
    >
      <HugeiconsIcon icon={Icon} strokeWidth={2} />
      {config.label}
    </span>
  );
}

function formatName(c: Contact) {
  const first = c.firstName?.trim() ?? "";
  const last = (c.lastName?.trim() ?? "").trim();
  return last ? `${first} ${last}`.trim() : first || "—";
}

export const peopleColumns: ColumnDef<Contact>[] = [
  {
    id: "name",
    accessorFn: (row) => formatName(row),
    header: () => (
      <span className="inline-flex items-center gap-2">
        <HugeiconsIcon icon={UserIcon} className="size-4 text-muted-foreground" strokeWidth={2} />
        Name
      </span>
    ),
    cell: ({ row }) => {
      const c = row.original;
      return (
        <span className="inline-flex items-center gap-2">
          {c.avatar ? (
            <span className="h-8 w-8 relative shrink-0 block rounded-lg overflow-hidden">
              <Image
                src={c.avatar}
                alt=""
                fill
                className="object-contain rounded-lg"
              />
            </span>
          ) : null}
          <span className="font-medium text-foreground">{formatName(c)}</span>
        </span>
      );
    },
  },
  {
    accessorKey: "email",
    id: "email",
    header: () => (
      <span className="inline-flex items-center gap-2">
        <HugeiconsIcon icon={Mail01Icon} className="size-4 text-muted-foreground" strokeWidth={2} />
        Email
      </span>
    ),
    cell: ({ row }) => (
      <a
        href={row.original.email ? `mailto:${row.original.email}` : undefined}
        className="text-primary hover:underline truncate max-w-[200px] block"
      >
        {row.original.email ?? "—"}
      </a>
    ),
  },
  {
    accessorKey: "phone",
    id: "phone",
    header: () => (
      <span className="inline-flex items-center gap-2">
        <HugeiconsIcon icon={Call02Icon} className="size-4 text-muted-foreground" strokeWidth={2} />
        Phone
      </span>
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.phone ?? "—"}</span>
    ),
  },
  {
    accessorKey: "title",
    id: "title",
    header: () => (
      <span className="inline-flex items-center gap-2">
        <HugeiconsIcon icon={Briefcase01Icon} className="size-4 text-muted-foreground" strokeWidth={2} />
        Title
      </span>
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.title ?? "—"}</span>
    ),
  },
  {
    accessorKey: "companyName",
    id: "company",
    header: () => (
      <span className="inline-flex items-center gap-2">
        <HugeiconsIcon icon={Building01Icon} className="size-4 text-muted-foreground" strokeWidth={2} />
        Company
      </span>
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.companyName ?? "—"}</span>
    ),
  },
  {
    accessorKey: "status",
    id: "status",
    header: () => (
      <span className="inline-flex items-center gap-2">
        <HugeiconsIcon icon={StatusIcon} className="size-4 text-muted-foreground" strokeWidth={2} />
        Status
      </span>
    ),
    cell: ({ row }) => {
      const status = row.original.status as ContactStatus;
      const config = statusConfig[status];
      if (!config) return <span className="text-muted-foreground text-xs">{String(status)}</span>;
      return <ContactStatusBadge status={status} />;
    },
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => <ContactRowActions contact={row.original} type="PERSON" />,
    enableSorting: false,
    enableHiding: false,
  },
];
