"use client";

import { CalendarClient } from "@/components/ui/calendar/calendar-client";

export interface TasksCalendarViewProps {
  tasks?: unknown[];
  isPending?: boolean;
  onDateChange?: (taskId: string, dueAt: string | null) => void;
  onTaskClick?: (task: unknown) => void;
}

export function TasksCalendarView(_props: TasksCalendarViewProps) {
  return (
    <div className="min-h-0 w-full flex-1 overflow-auto p-4 max-h-[calc(100vh-14rem)]">
      <CalendarClient defaultView="month" />
    </div>
  );
}
