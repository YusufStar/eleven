"use client";

import * as React from "react";
import {
  type ColumnDef,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { HugeiconsIcon } from "@hugeicons/react";
import { Settings01Icon, Search01Icon, Building01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import type { ContactStatus } from "@/services/contacts";

const STATUS_OPTIONS: { value: ContactStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "LEAD", label: "Lead" },
  { value: "PROSPECT", label: "Prospect" },
  { value: "CUSTOMER", label: "Customer" },
  { value: "CHURNED", label: "Churned" },
  { value: "PARTNER", label: "Partner" },
];

export type CompaniesDataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  fetching?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  search?: string;
  onSearchChange?: (value: string) => void;
  status?: ContactStatus | "all";
  onStatusChange?: (value: ContactStatus | "all") => void;
};

const columnLabels: Record<string, string> = {
  companyName: "Company",
  website: "Website",
  industry: "Industry",
  employeeCount: "Employees",
  status: "Status",
};

export function CompaniesDataTable<TData, TValue>({
  columns,
  data,
  loading = false,
  fetching = false,
  page,
  pageSize,
  total,
  onPageChange,
  search = "",
  onSearchChange,
  status = "all",
  onStatusChange,
}: CompaniesDataTableProps<TData, TValue>) {
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: { columnVisibility },
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrevious = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-[280px]">
          <HugeiconsIcon
            icon={Search01Icon}
            className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2"
            strokeWidth={2}
          />
          <Input
            placeholder="Search companies..."
            className="pl-8 h-8"
            value={search}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={(v) => onStatusChange?.(v as ContactStatus | "all")}>
          <SelectTrigger size="sm" className="w-[130px] h-8">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <HugeiconsIcon icon={Settings01Icon} className="size-4" strokeWidth={2} />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((col) => col.getCanHide() && col.id !== "actions")
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    className="capitalize"
                  >
                    {columnLabels[column.id] ?? column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className={cn("overflow-hidden rounded-lg border bg-card relative", fetching && "opacity-60 pointer-events-none")}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full max-w-[120px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="p-0">
                  <Empty className="min-h-[280px] border-0">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <HugeiconsIcon icon={Building01Icon} className="size-5" strokeWidth={2} />
                      </EmptyMedia>
                      <EmptyTitle>No companies found</EmptyTitle>
                      <EmptyDescription>
                        {search || status !== "all"
                          ? "Try adjusting your search or status filter."
                          : "Get started by adding your first company."}
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Page {page} of {totalPages}
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (canPrevious) onPageChange(page - 1);
                  }}
                  className={cn(!canPrevious && "pointer-events-none opacity-50")}
                  text="Previous"
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (canNext) onPageChange(page + 1);
                  }}
                  className={cn(!canNext && "pointer-events-none opacity-50")}
                  text="Next"
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
