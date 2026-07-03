"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Video01Icon,
  KeyboardIcon,
  Calendar03Icon,
  ArrowRight02Icon,
  Globe02Icon,
} from "@hugeicons/core-free-icons";
import ElevenLogo from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScheduleMeetingModal } from "@/components/meet/schedule-meeting-modal";
import { useCreateMeeting, useUpcomingMeetings, type Meeting } from "@/services/meetings";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
}

function MeetingRow({ meeting }: { meeting: Meeting }) {
  const time = new Date(meeting.startsAt).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const day = new Date(meeting.startsAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const isToday = new Date(meeting.startsAt).toDateString() === new Date().toDateString();

  return (
    <li className="group flex items-center gap-4 border-b px-6 py-4 last:border-b-0">
      <span className="w-14 shrink-0 font-mono text-sm text-muted-foreground">
        {isToday ? time : day}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{meeting.title}</p>
        <div className="mt-1.5 flex items-center gap-2">
          {meeting.isPublic ? (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <HugeiconsIcon icon={Globe02Icon} className="size-3.5" strokeWidth={1.8} />
              Open to everyone
            </span>
          ) : (
            <div className="flex -space-x-1.5">
              {meeting.participants.slice(0, 5).map((p) => (
                <span
                  key={p.id}
                  title={p.member.user.name}
                  className="flex size-6 items-center justify-center rounded-full border bg-muted font-serif text-[10px]"
                >
                  {initials(p.member.user.name)}
                </span>
              ))}
              {meeting.participants.length > 5 && (
                <span className="flex size-6 items-center justify-center rounded-full border bg-muted font-mono text-[9px]">
                  +{meeting.participants.length - 5}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      <Button
        asChild
        variant="outline"
        size="sm"
        className="gap-1.5 rounded-full opacity-70 transition-opacity group-hover:opacity-100"
      >
        <Link href={`/meet/${meeting.code}`}>
          Join
          <HugeiconsIcon icon={ArrowRight02Icon} className="size-3.5" strokeWidth={2} />
        </Link>
      </Button>
    </li>
  );
}

export default function MeetPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  const { data: upcoming, isPending } = useUpcomingMeetings();
  const createMeeting = useCreateMeeting();

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const clock = useMemo(
    () =>
      now
        ? {
            time: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
            date: now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
          }
        : null,
    [now],
  );

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
    // accept a bare code or a pasted link
    const roomId = trimmed.split("/").pop() ?? trimmed;
    router.push(`/meet/${encodeURIComponent(roomId)}`);
  };

  const meetings = upcoming?.data ?? [];

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-16 items-center justify-between border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <ElevenLogo className="size-7" />
          <span className="text-[15px] font-medium tracking-tight">
            Eleven <span className="text-muted-foreground">Meet</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {clock && (
            <p className="hidden font-mono text-xs text-muted-foreground sm:block">
              {clock.time} · {clock.date}
            </p>
          )}
          <NotificationBell />
          <ThemeToggle />
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-16 px-6 py-16 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
            Nº 11 — Meetings
          </p>
          <h1 className="mt-5 max-w-xl font-serif text-4xl leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
            Meet, without the meeting <em>about</em> the meeting.
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
            Start an instant call, plan one for later, or join with a code.
            Your camera stays off until you say otherwise.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              className="gap-2 rounded-full px-6"
              onClick={startInstant}
              disabled={createMeeting.isPending}
            >
              <HugeiconsIcon icon={Video01Icon} className="size-4.5" strokeWidth={1.8} />
              {createMeeting.isPending ? "Starting…" : "New meeting"}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="gap-2 rounded-full px-6"
              onClick={() => setScheduleOpen(true)}
            >
              <HugeiconsIcon icon={Calendar03Icon} className="size-4.5" strokeWidth={1.8} />
              Plan meeting
            </Button>

            <div className="flex items-center gap-2">
              <div className="relative">
                <HugeiconsIcon
                  icon={KeyboardIcon}
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  strokeWidth={1.8}
                />
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && join()}
                  placeholder="Enter a code or link"
                  className="h-10 w-52 rounded-full pl-9"
                  aria-label="Meeting code or link"
                />
              </div>
              <Button variant="ghost" className="rounded-full" disabled={!code.trim()} onClick={join}>
                Join
              </Button>
            </div>
          </div>
        </div>

        <section aria-label="Upcoming meetings" className="rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-2.5">
              <HugeiconsIcon icon={Calendar03Icon} className="size-4.5 text-muted-foreground" strokeWidth={1.8} />
              <h2 className="text-sm font-medium">Upcoming</h2>
            </div>
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              {meetings.length} scheduled
            </span>
          </div>
          {isPending ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">Loading…</p>
          ) : meetings.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-muted-foreground">Nothing on the calendar.</p>
              <Button variant="outline" size="sm" className="mt-4 rounded-full" onClick={() => setScheduleOpen(true)}>
                Plan your first meeting
              </Button>
            </div>
          ) : (
            <ul>
              {meetings.map((m) => (
                <MeetingRow key={m.id} meeting={m} />
              ))}
            </ul>
          )}
        </section>
      </main>

      <ScheduleMeetingModal open={scheduleOpen} onOpenChange={setScheduleOpen} />
    </div>
  );
}
