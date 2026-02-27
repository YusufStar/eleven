import React from "react";
import { CalendarBody } from "@/components/ui/calendar/calendar-body";
import { CalendarProvider } from "@/components/ui/calendar/calendar-context";
import { DndProvider } from "@/components/ui/calendar/dnd-context";
import { CalendarHeader } from "@/components/ui/calendar/calendar-header";
import { getEvents, getUsers } from "@/components/ui/calendar/requests";

async function getCalendarData() {
  return {
    events: await getEvents(),
    users: await getUsers(),
  };
}

export async function Calendar() {
  const { events, users } = await getCalendarData();

  return (
    <CalendarProvider events={events} users={users} view="month">
      <DndProvider>
        <div className="w-full border rounded-xl">
          <CalendarHeader />
          <CalendarBody />
        </div>
      </DndProvider>
    </CalendarProvider>
  );
}
