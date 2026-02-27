"use client";

import type { Task } from "@/services/tasks";
import { useUpdateTaskStatus } from "@/services/tasks";
import type { TaskStatusValue } from "@/services/tasks/types";
import { TasksDataTable } from "@/components/tasks/tasks-data-table";
import { tasksColumns } from "@/components/tasks/columns";
import { toast } from "sonner";

export interface TasksDataTableViewProps {
  tasks: Task[];
  total: number;
  page: number;
  pageSize: number;
  isPending: boolean;
  onPageChange: (page: number) => void;
}

export function TasksDataTableView({
  tasks,
  total,
  page,
  pageSize,
  isPending,
  onPageChange,
}: TasksDataTableViewProps) {
  const updateStatus = useUpdateTaskStatus();

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
    <TasksDataTable
      columns={tasksColumns}
      data={tasks}
      loading={isPending}
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={onPageChange}
      onBulkStatusChange={handleBulkStatusChange}
    />
  );
}
