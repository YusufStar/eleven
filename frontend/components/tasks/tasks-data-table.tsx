"use client";

import * as React from "react";
import {
  type ColumnDef,
  type RowSelectionState,
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { HugeiconsIcon } from "@hugeicons/react";
import { Settings01Icon, Task01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import type { Task } from "@/services/tasks";
import { TASK_STATUSES, type TaskStatusValue } from "@/services/tasks/types";

const columnLabels: Record<string, string> = {
  select: "Select",
  title: "Title",
  status: "Status",
  priority: "Priority",
  project: "Project",
  assignee: "Assignee",
  dueAt: "Due date",
};

const PRIORITY_ROW_BORDER: Record<string, string> = {
  LOW: "border-l-4 border-l-slate-400 dark:border-l-slate-500",
  MEDIUM: "border-l-4 border-l-amber-400 dark:border-l-amber-500",
  HIGH: "border-l-4 border-l-orange-400 dark:border-l-orange-500",
  URGENT: "border-l-4 border-l-red-400 dark:border-l-red-500",
};

const STATUS_LABELS: Record<TaskStatusValue, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  IN_REVIEW: "In review",
  BLOCKED: "Blocked",
  DONE: "Done",
  CANCELLED: "Archived",
};

export type TasksDataTableProps = {
  columns: ColumnDef<Task, unknown>[];
  data: Task[];
  loading?: boolean;
  fetching?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onBulkStatusChange?: (taskIds: string[], status: TaskStatusValue) => void;
  onBulkDelete?: (taskIds: string[]) => void;
};

export function TasksDataTable({
  columns,
  data,
  loading = false,
  fetching = false,
  page,
  pageSize,
  total,
  onPageChange,
  onBulkStatusChange,
  onBulkDelete,
}: TasksDataTableProps) {
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [statusSelectValue, setStatusSelectValue] = React.useState<string>("");

  const selectionColumn: ColumnDef<Task, unknown> = React.useMemo(
    () => ({
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    }),
    []
  );

  const table = useReactTable({
    data,
    columns: [selectionColumn, ...columns],
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { columnVisibility, rowSelection },
    enableRowSelection: true,
  });

  const selectedIds = React.useMemo(
    () => table.getFilteredSelectedRowModel().rows.map((r) => r.original.id),
    [table, rowSelection]
  );

  const handleStatusChange = (value: string) => {
    if (!value || selectedIds.length === 0) return;
    onBulkStatusChange?.(selectedIds, value as TaskStatusValue);
    setStatusSelectValue("");
    setRowSelection({});
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrevious = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {selectedIds.length > 0 && (
          <span className="text-sm text-muted-foreground">{selectedIds.length} selected</span>
        )}
        {selectedIds.length > 0 && onBulkStatusChange && (
          <Select value={statusSelectValue || undefined} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[160px]" size="sm">
              <SelectValue placeholder="Update status" />
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {selectedIds.length > 0 && onBulkDelete && (
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              onBulkDelete(selectedIds);
              setRowSelection({});
            }}
          >
            Delete
          </Button>
        )}
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

      <div
        className={cn(
          "overflow-hidden rounded-lg border bg-card relative",
          fetching && "opacity-60 pointer-events-none"
        )}
      >
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
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={PRIORITY_ROW_BORDER[row.original.priority] ?? ""}
                >
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
                        <HugeiconsIcon icon={Task01Icon} className="size-5" strokeWidth={2} />
                      </EmptyMedia>
                      <EmptyTitle>No tasks found</EmptyTitle>
                      <EmptyDescription>
                        Adjust filters or create a new task.
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
