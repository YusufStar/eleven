"use client";

import type { Task } from "@/services/tasks";

export interface TasksCalendarViewProps {
  tasks: Task[];
  isPending: boolean;
  onDateChange?: (taskId: string, dueAt: string | null) => void;
  onTaskClick?: (task: Task) => void;
}

export function TasksCalendarView({
  tasks,
  isPending,
  onDateChange,
  onTaskClick,
}: TasksCalendarViewProps) {
  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-dashed bg-muted/30">
      <p className="text-muted-foreground">Calendar View</p>
    </div>
  );
}
