"use client";

import type { Task } from "@/services/tasks";
import { TasksDataTable } from "@/components/tasks/tasks-data-table";
import { tasksColumns } from "@/components/tasks/columns";

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
  return (
    <TasksDataTable
      columns={tasksColumns}
      data={tasks}
      loading={isPending}
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={onPageChange}
    />
  );
}
