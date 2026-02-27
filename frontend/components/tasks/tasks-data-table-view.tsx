"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Task } from "@/services/tasks";
import { useUpdateTaskStatus } from "@/services/tasks";
import type { TaskStatusValue } from "@/services/tasks/types";
import { TasksDataTable } from "@/components/tasks/tasks-data-table";
import { tasksColumns } from "@/components/tasks/columns";
import { TaskDetailModal } from "@/components/tasks/task-detail-modal";
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
  const updateStatus = useUpdateTaskStatus();
  const [detailTaskId, setDetailTaskId] = React.useState<string | null>(null);

  const columns = React.useMemo<ColumnDef<Task>[]>(() => {
    const base = tasksColumns.filter((c) => c.id !== "actions");
    return [
      ...base,
      {
        ...actionsColumn,
        cell: ({ row }: { row: { original: Task } }) => (
          <div className="flex justify-end w-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDetailTaskId(row.original.id)}
            >
              View details
            </Button>
          </div>
        ),
      },
    ];
  }, []);

  const handleBulkStatusChange = async (taskIds: string[], status: TaskStatusValue) => {
    try {
      await Promise.all(
        taskIds.map((taskId) => updateStatus.mutateAsync({ taskId, status }))
      );
      toast.success("Status updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
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
      />
      <TaskDetailModal
        taskId={detailTaskId}
        open={!!detailTaskId}
        onOpenChange={(open) => !open && setDetailTaskId(null)}
      />
    </>
  );
}
