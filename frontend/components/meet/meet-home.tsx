"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addDays, endOfWeek, format, isSameDay, isToday, startOfWeek } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Video01Icon,
  KeyboardIcon,
  Calendar03Icon,
  ArrowLeft02Icon,
  ArrowRight02Icon,
  Globe02Icon,
  Add01Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import ElevenLogo from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScheduleMeetingModal } from "@/components/meet/schedule-meeting-modal";
import { MeetWeekCalendar } from "@/components/meet/meet-week-calendar";
import { useCreateMeeting, useMeetingsRange, useUpcomingMeetings, type Meeting } from "@/services/meetings";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
}

function AgendaRow({ meeting }: { meeting: Meeting }) {
  const start = new Date(meeting.startsAt);
  return (
    <li className="group flex items-center gap-3 border-b px-4 py-3 last:border-b-0">
      <div className="w-12 shrink-0 text-center">
        <p className="font-mono text-sm">{format(start, "HH:mm")}</p>
        <p className="font-mono text-[10px] uppercase text-muted-foreground">
          {isToday(start) ? "today" : format(start, "EEE d")}
        </p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{meeting.title}</p>
        {meeting.isPublic ? (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <HugeiconsIcon icon={Globe02Icon} className="size-3" strokeWidth={1.8} />
            Everyone
          </p>
        ) : (
          <div className="mt-1 flex -space-x-1.5">
            {meeting.participants.slice(0, 4).map((p) => (
              <span
                key={p.id}
                title={p.member.user.name}
                className="flex size-5 items-center justify-center rounded-full border bg-muted font-serif text-[9px]"
              >
                {initials(p.member.user.name)}
              </span>
            ))}
          </div>
        )}
      </div>
      <Button
        asChild
        variant="outline"
        size="sm"
        className="rounded-full opacity-60 transition-opacity group-hover:opacity-100"
      >
        <Link href={`/meet/${meeting.code}`}>Join</Link>
      </Button>
    </li>
  );
}

export function MeetHome() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [slotStart, setSlotStart] = useState<Date | null>(null);
  const [weekAnchor, setWeekAnchor] = useState(() => new Date());

  const weekStart = useMemo(() => startOfWeek(weekAnchor, { weekStartsOn: 1 }), [weekAnchor]);
  const weekEnd = useMemo(() => endOfWeek(weekAnchor, { weekStartsOn: 1 }), [weekAnchor]);

  const { data: rangeData } = useMeetingsRange(weekStart, weekEnd);
  const { data: upcoming } = useUpcomingMeetings();
  const createMeeting = useCreateMeeting();

  const meetings = rangeData?.data ?? [];
  const agenda = upcoming?.data ?? [];

  const weekLabel = isSameDay(weekStart, startOfWeek(new Date(), { weekStartsOn: 1 }))
    ? `This week · ${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d")}`
    : `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`;

  const startInstant = () => {
    createMeeting.mutate(
      { isPublic: true },
      {
        onSuccess: (meeting) => router.push(`/meet/${meeting.code}`),
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const join = () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    const roomId = trimmed.split("/").pop() ?? trimmed;
    router.push(`/meet/${encodeURIComponent(roomId)}`);
  };

  const openPlanner = (start: Date | null) => {
    setSlotStart(start);
    setScheduleOpen(true);
  };

  return (
    <div className="flex h-svh flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <ElevenLogo className="size-7" />
          <span className="text-[15px] font-medium tracking-tight">
            Eleven <span className="text-muted-foreground">Meet</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <HugeiconsIcon
              icon={KeyboardIcon}
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              strokeWidth={1.8}
            />
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && join()}
              placeholder="Join with a code"
              className="h-9 w-44 rounded-full pl-9"
              aria-label="Meeting code or link"
            />
          </div>
          <NotificationBell />
          <ThemeToggle />
          <Button asChild variant="outline" size="sm" className="gap-2 rounded-full">
            <Link href="/meet/history">
              <HugeiconsIcon icon={Clock01Icon} className="size-4" strokeWidth={1.8} />
              History
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </header>

      {/* calendar toolbar */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-full"
              aria-label="Previous week"
              onClick={() => setWeekAnchor((d) => addDays(d, -7))}
            >
              <HugeiconsIcon icon={ArrowLeft02Icon} className="size-4" strokeWidth={2} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-full"
              aria-label="Next week"
              onClick={() => setWeekAnchor((d) => addDays(d, 7))}
            >
              <HugeiconsIcon icon={ArrowRight02Icon} className="size-4" strokeWidth={2} />
            </Button>
          </div>
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => setWeekAnchor(new Date())}>
            Today
          </Button>
          <p className="flex items-center gap-2 text-sm font-medium">
            <HugeiconsIcon icon={Calendar03Icon} className="size-4 text-muted-foreground" strokeWidth={1.8} />
            {weekLabel}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 rounded-full" onClick={() => openPlanner(null)}>
            <HugeiconsIcon icon={Add01Icon} className="size-4" strokeWidth={2} />
            Plan meeting
          </Button>
          <Button size="sm" className="gap-2 rounded-full px-4" onClick={startInstant} disabled={createMeeting.isPending}>
            <HugeiconsIcon icon={Video01Icon} className="size-4" strokeWidth={1.8} />
            {createMeeting.isPending ? "Starting…" : "Meet now"}
          </Button>
        </div>
      </div>

      <main className="flex min-h-0 flex-1 gap-4 p-4">
        <MeetWeekCalendar weekStart={weekStart} meetings={meetings} onSlotClick={(start) => openPlanner(start)} />

        {/* agenda rail */}
        <aside className="hidden w-80 shrink-0 flex-col overflow-hidden rounded-xl border bg-card xl:flex">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-medium">Agenda</h2>
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              {agenda.length} upcoming
            </span>
          </div>
          {agenda.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
              <p className="text-sm text-muted-foreground">Nothing on the calendar yet.</p>
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => openPlanner(null)}>
                Plan your first meeting
              </Button>
            </div>
          ) : (
            <ul className="flex-1 overflow-y-auto">
              {agenda.map((m) => (
                <AgendaRow key={m.id} meeting={m} />
              ))}
            </ul>
          )}
          <p className="border-t px-4 py-3 text-xs text-muted-foreground">
            Click any empty slot in the calendar to plan a meeting at that time.
          </p>
        </aside>
      </main>

      <ScheduleMeetingModal open={scheduleOpen} onOpenChange={setScheduleOpen} defaultStartsAt={slotStart} />
    </div>
  );
}
