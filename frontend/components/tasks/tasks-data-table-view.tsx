"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Task } from "@/services/tasks";
import { useBulkDeleteTasks, useBulkUpdateTasks } from "@/services/tasks";
import type { TaskStatusValue } from "@/services/tasks/types";
import { TasksDataTable } from "@/components/tasks/tasks-data-table";
import { tasksColumns } from "@/components/tasks/columns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface TasksDataTableViewProps {
  tasks: Task[];
  total: number;
  page: number;
  pageSize: number;
  isPending: boolean;
  onPageChange: (page: number) => void;
}

const actionsColumn: ColumnDef<Task> = {
  id: "actions",
  header: () => <span className="sr-only">Actions</span>,
  cell: () => null,
  enableSorting: false,
  enableHiding: false,
};

export function TasksDataTableView({
  tasks,
  total,
  page,
  pageSize,
  isPending,
  onPageChange,
}: TasksDataTableViewProps) {
  const bulkUpdate = useBulkUpdateTasks();
  const bulkDelete = useBulkDeleteTasks();

  const columns = React.useMemo<ColumnDef<Task>[]>(() => {
    const base = tasksColumns.filter((c) => c.id !== "actions");
    return [
      ...base,
      {
        ...actionsColumn,
        cell: ({ row }: { row: { original: Task } }) => (
          <div className="flex justify-end w-full">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/dashboard/tasks/${row.original.id}`}>View details</Link>
            </Button>
          </div>
        ),
      },
    ];
  }, []);

  const handleBulkStatusChange = async (taskIds: string[], status: TaskStatusValue) => {
    try {
      const res = await bulkUpdate.mutateAsync({ ids: taskIds, status });
      toast.success(`Updated ${res.count} tasks`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const handleBulkDelete = async (taskIds: string[]) => {
    try {
      const res = await bulkDelete.mutateAsync(taskIds);
      toast.success(`Deleted ${res.count} tasks`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete tasks");
    }
  };

  return (
    <>
      <TasksDataTable
        columns={columns}
        data={tasks}
        loading={isPending}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        onBulkStatusChange={handleBulkStatusChange}
        onBulkDelete={handleBulkDelete}
      />
    </>
  );
}
