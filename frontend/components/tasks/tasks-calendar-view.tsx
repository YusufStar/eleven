"use client";

import { useMemo } from "react";
import type { Task } from "@/services/tasks";
import type { TaskStatusValue } from "@/services/tasks/types";
import { CalendarClient } from "@/components/ui/calendar/calendar-client";
import type { IEvent, IUser } from "@/components/ui/calendar/interfaces";
import type { TEventColor } from "@/components/ui/calendar/types";

const STATUS_TO_COLOR: Record<TaskStatusValue, TEventColor> = {
  TODO: "orange",
  IN_PROGRESS: "blue",
  DONE: "green",
  CANCELLED: "red",
};

const DEFAULT_USER: IUser = { id: "", name: "Unassigned", picturePath: null };

function taskToEvent(task: Task, index: number): IEvent {
  const dueAt = task.dueAt ? new Date(task.dueAt) : new Date(task.createdAt);
  const startDate = dueAt.toISOString();
  const endDate = new Date(dueAt.getTime() + 60 * 60 * 1000).toISOString();
  const status = (task.status in STATUS_TO_COLOR ? task.status : "TODO") as TaskStatusValue;
  const user: IUser = task.assignee?.user
    ? { id: task.assignee.id, name: task.assignee.user.name ?? "—", picturePath: task.assignee.user.image ?? null }
    : DEFAULT_USER;
  return {
    id: index,
    startDate,
    endDate,
    title: task.title?.trim() || "Untitled",
    color: STATUS_TO_COLOR[status],
    description: task.description?.trim() || "",
    user,
    taskId: task.id,
  };
}

export interface TasksCalendarViewProps {
  tasks?: Task[];
  isPending?: boolean;
}

export function TasksCalendarView({ tasks = [], isPending }: TasksCalendarViewProps) {
  const events = useMemo(() => tasks.map((t, i) => taskToEvent(t, i)), [tasks]);

  return (
    <div className="min-h-0 w-full flex-1 overflow-auto">
      <CalendarClient events={events} defaultView="month" />
    </div>
  );
}
