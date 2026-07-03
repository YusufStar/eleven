"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Building01Icon,
  LinkSquare01Icon,
  BankIcon,
  UserGroupIcon,
  StatusIcon,
  SparklesIcon,
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
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

export const companiesColumns: ColumnDef<Contact>[] = [
  {
    id: "companyName",
    accessorKey: "companyName",
    header: () => (
      <span className="inline-flex items-center gap-2">
        <HugeiconsIcon icon={Building01Icon} className="size-4 text-muted-foreground" strokeWidth={2} />
        Company
      </span>
    ),
    cell: ({ row }) => {
      const c = row.original;
      const name = c.companyName?.trim() ?? "—";
      return (
        <span className="inline-flex items-center gap-2">
          {c.avatar ? (
            <span className="h-8 w-8 relative shrink-0 block rounded-lg overflow-hidden">
              <Image
                src={c.avatar}
                alt=""
                fill
                sizes="32px"
                className="object-contain rounded-lg"
              />
            </span>
          ) : null}
          <Link
            href={`/dashboard/contacts/companies/${c.id}`}
            className="font-medium text-foreground hover:text-primary hover:underline"
          >
            {name}
          </Link>
        </span>
      );
    },
  },
  {
    accessorKey: "website",
    id: "website",
    header: () => (
      <span className="inline-flex items-center gap-2">
        <HugeiconsIcon icon={LinkSquare01Icon} className="size-4 text-muted-foreground" strokeWidth={2} />
        Website
      </span>
    ),
    cell: ({ row }) => {
      const url = row.original.website?.trim();
      if (!url) return <span className="text-muted-foreground">—</span>;
      const href = url.startsWith("http") ? url : `https://${url}`;
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-[200px] block">
          {url}
        </a>
      );
    },
  },
  {
    accessorKey: "industry",
    id: "industry",
    header: () => (
      <span className="inline-flex items-center gap-2">
        <HugeiconsIcon icon={BankIcon} className="size-4 text-muted-foreground" strokeWidth={2} />
        Industry
      </span>
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.industry ?? "—"}</span>
    ),
  },
  {
    accessorKey: "employeeCount",
    id: "employeeCount",
    header: () => (
      <span className="inline-flex items-center gap-2">
        <HugeiconsIcon icon={UserGroupIcon} className="size-4 text-muted-foreground" strokeWidth={2} />
        Employees
      </span>
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.employeeCount != null ? row.original.employeeCount : "—"}
      </span>
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
    cell: ({ row }) => <ContactRowActions contact={row.original} type="COMPANY" />,
    enableSorting: false,
    enableHiding: false,
  },
];
