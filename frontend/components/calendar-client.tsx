"use client";

import { CalendarBody } from "@/components/ui/calendar/calendar-body";
import { DndProvider } from "@/components/ui/calendar/dnd-context";
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
      <DndProvider>
        <div className="w-full rounded-xl border bg-card">
          <CalendarBody />
        </div>
      </DndProvider>
  );
}
