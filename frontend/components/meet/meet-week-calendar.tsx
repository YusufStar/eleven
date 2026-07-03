"use client";

import { useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { addDays, differenceInMinutes, format, isSameDay, isToday, startOfDay, startOfWeek } from "date-fns";
import type { Meeting } from "@/services/meetings";

const DAY_START_HOUR = 7;
const DAY_END_HOUR = 21;
const HOUR_PX = 56;
const VISIBLE_MINUTES = (DAY_END_HOUR - DAY_START_HOUR) * 60;

function minutesIntoDay(d: Date) {
  return d.getHours() * 60 + d.getMinutes();
}

type Block = {
  meeting: Meeting;
  top: number;
  height: number;
};

function blocksForDay(meetings: Meeting[], day: Date): Block[] {
  return meetings
    .filter((m) => isSameDay(new Date(m.startsAt), day))
    .map((m) => {
      const start = new Date(m.startsAt);
      const end = m.endsAt ? new Date(m.endsAt) : new Date(start.getTime() + 60 * 60 * 1000);
      const startMin = Math.max(minutesIntoDay(start) - DAY_START_HOUR * 60, 0);
      const duration = Math.max(differenceInMinutes(end, start), 30);
      return {
        meeting: m,
        top: (startMin / 60) * HOUR_PX,
        height: Math.min((duration / 60) * HOUR_PX, (VISIBLE_MINUTES / 60) * HOUR_PX),
      };
    });
}

export function MeetWeekCalendar({
  weekStart,
  meetings,
  onSlotClick,
}: {
  weekStart: Date;
  meetings: Meeting[];
  onSlotClick: (start: Date) => void;
}) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(weekStart, { weekStartsOn: 1 }), i)),
    [weekStart],
  );
  const hours = useMemo(
    () => Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => DAY_START_HOUR + i),
    [],
  );

  const now = new Date();
  const nowOffset = ((minutesIntoDay(now) - DAY_START_HOUR * 60) / 60) * HOUR_PX;
  const nowVisible = minutesIntoDay(now) >= DAY_START_HOUR * 60 && minutesIntoDay(now) <= DAY_END_HOUR * 60;

  const handleColumnClick = (day: Date, e: React.MouseEvent<HTMLDivElement>) => {
    // ignore clicks that land on a meeting block
    if ((e.target as HTMLElement).closest("[data-meeting]")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const minutes = ((e.clientY - rect.top) / HOUR_PX) * 60 + DAY_START_HOUR * 60;
    const rounded = Math.round(minutes / 30) * 30;
    const start = new Date(startOfDay(day).getTime() + rounded * 60 * 1000);
    onSlotClick(start);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card">
      {/* day headers */}
      <div className="grid shrink-0 grid-cols-[3.5rem_repeat(7,1fr)] border-b">
        <div />
        {days.map((day) => (
          <div key={day.toISOString()} className="border-l px-3 py-2.5">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {format(day, "EEE")}
            </p>
            <p
              className={`mt-0.5 inline-flex size-7 items-center justify-center rounded-full text-sm ${
                isToday(day) ? "bg-foreground font-medium text-background" : ""
              }`}
            >
              {format(day, "d")}
            </p>
          </div>
        ))}
      </div>

      {/* hour grid */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid grid-cols-[3.5rem_repeat(7,1fr)]">
          {/* hour labels */}
          <div>
            {hours.map((h) => (
              <div key={h} className="relative" style={{ height: HOUR_PX }}>
                <span className="absolute -top-2 right-2 font-mono text-[10px] text-muted-foreground">
                  {`${h}`.padStart(2, "0")}:00
                </span>
              </div>
            ))}
          </div>

          {days.map((day) => (
            <div
              key={day.toISOString()}
              className="relative cursor-pointer border-l"
              style={{ height: hours.length * HOUR_PX }}
              onClick={(e) => handleColumnClick(day, e)}
              role="presentation"
            >
              {hours.map((h) => (
                <div key={h} className="border-b border-border/60" style={{ height: HOUR_PX }} />
              ))}

              {isToday(day) && nowVisible && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
                  style={{ top: nowOffset }}
                >
                  <span className="size-2 rounded-full bg-destructive" />
                  <span className="h-px flex-1 bg-destructive" />
                </div>
              )}

              {blocksForDay(meetings, day).map(({ meeting, top, height }) => (
                <button
                  key={meeting.id}
                  type="button"
                  data-meeting
                  onClick={() => router.push(`/meet/${meeting.code}`)}
                  className="absolute inset-x-1 z-20 overflow-hidden rounded-lg border border-foreground/20 bg-foreground px-2.5 py-1.5 text-left text-background shadow-sm transition-opacity hover:opacity-90"
                  style={{ top, height: Math.max(height, 34) }}
                  title={`${meeting.title} — ${format(new Date(meeting.startsAt), "HH:mm")}`}
                >
                  <p className="truncate text-xs font-medium leading-tight">{meeting.title}</p>
                  <p className="truncate font-mono text-[10px] opacity-70">
                    {format(new Date(meeting.startsAt), "HH:mm")}
                    {meeting.isPublic ? " · everyone" : ` · ${meeting.participants.length}`}
                  </p>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
