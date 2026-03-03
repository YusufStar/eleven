"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import type { DealListItem } from "@/services/deals";
import { DealRowActions } from "@/components/deals/deal-row-actions";
import { cn } from "@/lib/utils";

function formatValue(value: string | null, currency: string) {
  if (value == null || value === "") return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function contactName(deal: DealListItem) {
  const c = deal.contact;
  if (!c) return "—";
  const name = [c.firstName, c.lastName].filter(Boolean).join(" ").trim();
  return name || c.companyName || "—";
}

const statusClass: Record<string, string> = {
  OPEN: "bg-blue-500/12 text-blue-700 dark:text-blue-400 border-blue-500/20",
  WON: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  LOST: "bg-red-500/12 text-red-700 dark:text-red-400 border-red-500/20",
};

export function dealsColumns(): ColumnDef<DealListItem>[] {
  return [
    {
      id: "title",
      accessorKey: "title",
      header: "Deal",
      cell: ({ row }) => {
        const d = row.original;
        return (
          <Link
            href={`/dashboard/deals/${d.id}`}
            className="font-medium text-primary hover:underline"
          >
            {d.title?.trim() || "Untitled"}
          </Link>
        );
      },
    },
    {
      id: "value",
      accessorKey: "value",
      header: "Value",
      cell: ({ row }) => {
        const d = row.original;
        return (
          <span className="tabular-nums">
            {formatValue(d.value, d.currency)}
          </span>
        );
      },
    },
    {
      id: "stage",
      accessorFn: (r) => r.stage?.name,
      header: "Stage",
      cell: ({ row }) => {
        const d = row.original;
        const stage = d.stage;
        const color = stage?.color || "bg-muted";
        return (
          <span
            className={cn(
              "inline-flex rounded-md border px-1.5 py-0.5 text-xs font-medium",
              color
            )}
          >
            {stage?.name ?? "—"}
          </span>
        );
      },
    },
    {
      id: "pipeline",
      accessorFn: (r) => r.pipeline?.name,
      header: "Pipeline",
      cell: ({ row }) => row.original.pipeline?.name ?? "—",
    },
    {
      id: "contact",
      header: "Contact",
      cell: ({ row }) => contactName(row.original),
    },
    {
      id: "owner",
      accessorFn: (r) => r.owner?.user?.name,
      header: "Owner",
      cell: ({ row }) => row.original.owner?.user?.name ?? "—",
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.original.status;
        return (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium",
              statusClass[s] ?? "bg-muted"
            )}
          >
            {s}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DealRowActions deal={row.original} />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
