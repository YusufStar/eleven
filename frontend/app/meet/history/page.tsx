"use client";

import Link from "next/link";
import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02Icon,
  Clock01Icon,
  Globe02Icon,
  UserGroupIcon,
  RecordIcon,
} from "@hugeicons/core-free-icons";
import ElevenLogo from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Button } from "@/components/ui/button";
import { useMeetingHistory, type AttendanceSession, type MeetingHistoryItem } from "@/services/meetings";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
}

function fmtTime(iso: string) {
  return format(new Date(iso), "HH:mm");
}

function sessionMinutes(s: AttendanceSession) {
  if (!s.leftAt) return null;
  return Math.max(1, Math.round((new Date(s.leftAt).getTime() - new Date(s.joinedAt).getTime()) / 60_000));
}

function fmtBytes(bytes: number | null) {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

function fmtDuration(sec: number | null) {
  if (!sec) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function MeetingCard({ meeting }: { meeting: MeetingHistoryItem }) {
  // group join sessions per member
  const byMember = new Map<string, { name: string; sessions: AttendanceSession[] }>();
  for (const a of meeting.attendance) {
    const entry = byMember.get(a.memberId) ?? { name: a.member.user.name, sessions: [] };
    entry.sessions.push(a);
    byMember.set(a.memberId, entry);
  }
  const attendees = [...byMember.values()];

  return (
    <article className="overflow-hidden rounded-xl border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4">
        <div className="min-w-0">
          <h2 className="truncate text-[15px] font-medium">{meeting.title}</h2>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
            {format(new Date(meeting.startsAt), "MMM d, yyyy · HH:mm")} · {meeting.code}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {meeting.isPublic ? (
            <span className="flex items-center gap-1.5">
              <HugeiconsIcon icon={Globe02Icon} className="size-3.5" strokeWidth={1.8} />
              Everyone
            </span>
          ) : (
            <span>{meeting.participants.length} invited</span>
          )}
          <span className="flex items-center gap-1.5">
            <HugeiconsIcon icon={UserGroupIcon} className="size-3.5" strokeWidth={1.8} />
            {attendees.length} attended
          </span>
        </div>
      </header>

      {attendees.length === 0 ? (
        <p className="px-6 py-5 text-sm text-muted-foreground">Nobody joined this meeting.</p>
      ) : (
        <ul className="divide-y">
          {attendees.map((a) => {
            const rejoins = a.sessions.length - 1;
            return (
              <li key={a.name + a.sessions[0].id} className="flex flex-wrap items-center gap-3 px-6 py-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-muted font-serif text-xs">
                  {initials(a.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    {a.name}
                    {rejoins > 0 && (
                      <span className="text-muted-foreground"> — rejoined {rejoins}×</span>
                    )}
                  </p>
                  <p className="mt-0.5 flex flex-wrap gap-x-3 font-mono text-[11px] text-muted-foreground">
                    {a.sessions.map((s) => {
                      const mins = sessionMinutes(s);
                      return (
                        <span key={s.id}>
                          {fmtTime(s.joinedAt)}–{s.leftAt ? fmtTime(s.leftAt) : "…"}
                          {mins != null && ` (${mins}m)`}
                        </span>
                      );
                    })}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {meeting.recordings.length > 0 && (
        <div className="space-y-4 border-t px-6 py-5">
          <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            <HugeiconsIcon icon={RecordIcon} className="size-3.5" strokeWidth={1.8} />
            {meeting.recordings.length} recording{meeting.recordings.length > 1 ? "s" : ""}
          </p>
          {meeting.recordings.map((r) => (
            <div key={r.id}>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video controls preload="metadata" src={r.url} className="aspect-video w-full rounded-lg border bg-black" />
              <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
                {format(new Date(r.createdAt), "HH:mm")} · by {r.createdBy.user.name}
                {r.durationSec ? ` · ${fmtDuration(r.durationSec)}` : ""}
                {r.sizeBytes ? ` · ${fmtBytes(r.sizeBytes)}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

export default function MeetHistoryPage() {
  const { data, isPending } = useMeetingHistory();
  const meetings = data?.data ?? [];

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <ElevenLogo className="size-7" />
          <span className="text-[15px] font-medium tracking-tight">
            Eleven <span className="text-muted-foreground">Meet</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <ThemeToggle />
          <Button asChild variant="outline" size="sm" className="gap-2 rounded-full">
            <Link href="/meet">
              <HugeiconsIcon icon={ArrowLeft02Icon} className="size-4" strokeWidth={2} />
              Back to Meet
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
          Nº 11 — History
        </p>
        <h1 className="mt-4 font-serif text-4xl tracking-tight md:text-5xl">
          Every meeting, <em>accounted for.</em>
        </h1>
        <p className="mt-4 max-w-md text-sm text-muted-foreground">
          Who joined, when they came and went, and the full recording when one was made.
        </p>

        <div className="mt-10 space-y-6">
          {isPending ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <HugeiconsIcon icon={Clock01Icon} className="size-4" strokeWidth={1.8} />
              Loading history…
            </p>
          ) : meetings.length === 0 ? (
            <div className="rounded-xl border bg-card px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">No past meetings yet.</p>
              <Button asChild variant="outline" size="sm" className="mt-4 rounded-full">
                <Link href="/meet">Start one now</Link>
              </Button>
            </div>
          ) : (
            meetings.map((m) => <MeetingCard key={m.id} meeting={m} />)
          )}
        </div>
      </main>
    </div>
  );
}
