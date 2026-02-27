"use client";

import { CalendarBody } from "@/components/ui/calendar/calendar-body";
import { CalendarProvider } from "@/components/ui/calendar/calendar-context";
import { DndProvider } from "@/components/ui/calendar/dnd-context";
import { CalendarHeader } from "@/components/ui/calendar/calendar-header";
import type { IEvent, IUser } from "@/components/ui/calendar/interfaces";

export interface CalendarClientProps {
  events?: IEvent[];
  users?: IUser[];
  defaultView?: "day" | "week" | "month" | "year" | "agenda";
}

export function CalendarClient({
  events = [],
  users = [],
  defaultView = "month",
}: CalendarClientProps) {
  return (
    <CalendarProvider events={events} users={users} view={defaultView}>
      <DndProvider>
        <div className="w-full rounded-xl border bg-card">
          <CalendarHeader />
          <CalendarBody />
        </div>
      </DndProvider>
    </CalendarProvider>
  );
}
