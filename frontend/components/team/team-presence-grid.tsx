"use client";

import * as React from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PresenceDot, presenceState } from "@/components/ui/status-badge";
import { useOnlineUsers } from "@/services/live";
import { useUpdateMe, type TeamMember } from "@/services/team";

function initials(name: string): string {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function localTime(timezone: string | null): string | null {
  if (!timezone) return null;
  try {
    return new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", timeZone: timezone });
  } catch {
    return null;
  }
}

const STATUS_EMOJIS = ["💻", "🎯", "☕", "🏝️", "🤒", "🏠", "🚀", "🧠"];

export function MyStatusDialog({
  me,
  open,
  onOpenChange,
}: {
  me: TeamMember;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const updateMe = useUpdateMe();
  const [statusEmoji, setStatusEmoji] = React.useState(me.statusEmoji ?? "");
  const [statusText, setStatusText] = React.useState(me.statusText ?? "");
  const [workingOn, setWorkingOn] = React.useState(me.workingOn ?? "");
  const [timezone, setTimezone] = React.useState(me.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [skills, setSkills] = React.useState((me.skills ?? []).join(", "));

  React.useEffect(() => {
    if (open) {
      setStatusEmoji(me.statusEmoji ?? "");
      setStatusText(me.statusText ?? "");
      setWorkingOn(me.workingOn ?? "");
      setTimezone(me.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone);
      setSkills((me.skills ?? []).join(", "));
    }
  }, [open, me]);

  const save = () => {
    updateMe.mutate(
      {
        statusEmoji: statusEmoji || null,
        statusText: statusText.trim() || null,
        workingOn: workingOn.trim() || null,
        timezone: timezone.trim() || null,
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
      },
      {
        onSuccess: () => {
          toast.success("Status updated.");
          onOpenChange(false);
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>My status</DialogTitle>
          <DialogDescription>Let your team know what you&apos;re up to.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Mood</Label>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setStatusEmoji(statusEmoji === e ? "" : e)}
                  className={`flex size-9 items-center justify-center rounded-lg border text-lg transition-all hover:scale-110 ${
                    statusEmoji === e ? "border-brand bg-brand/10" : "border-border"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status-text">Status</Label>
            <Input id="status-text" value={statusText} onChange={(e) => setStatusText(e.target.value)} placeholder="In deep work until 3pm" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="working-on">Working on</Label>
            <Input id="working-on" value={workingOn} onChange={(e) => setWorkingOn(e.target.value)} placeholder="Payment flow refactor" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tz">Timezone</Label>
              <Input id="tz" value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="Europe/Istanbul" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="skills">Skills</Label>
              <Input id="skills" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="react, go, design" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={updateMe.isPending}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TeamPresenceGrid({
  members,
  myUserId,
  onEditStatus,
}: {
  members: TeamMember[];
  myUserId: string | null;
  onEditStatus: () => void;
}) {
  const online = useOnlineUsers();
  const stateOf = React.useCallback(
    (m: TeamMember) => (online.has(m.userId) ? "online" : presenceState(m.lastSeenAt)),
    [online],
  );
  const sorted = React.useMemo(() => {
    const rank = { online: 0, away: 1, offline: 2 } as const;
    return [...members].sort((a, b) => rank[stateOf(a)] - rank[stateOf(b)]);
  }, [members, stateOf]);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {sorted.map((m) => {
        const time = localTime(m.timezone);
        const isMe = m.userId === myUserId;
        return (
          <Card key={m.id} size="sm" className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="flex gap-3 p-4">
              <span className="relative inline-flex shrink-0 self-start">
                <Avatar className="size-10">
                  <AvatarImage src={m.user.image ?? undefined} alt={m.user.name} />
                  <AvatarFallback>{initials(m.user.name)}</AvatarFallback>
                </Avatar>
                <PresenceDot lastSeenAt={m.lastSeenAt} online={online.has(m.userId)} className="absolute -bottom-0.5 -right-0.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-semibold">
                    {m.user.name} {m.statusEmoji && <span>{m.statusEmoji}</span>}
                  </p>
                  {isMe && (
                    <Button variant="ghost" size="sm" className="ml-auto h-6 px-2 text-xs" onClick={onEditStatus}>
                      Edit
                    </Button>
                  )}
                </div>
                <p className="truncate text-xs capitalize text-muted-foreground">
                  {m.role}
                  {time ? ` · ${time} local` : ""}
                </p>
                {(m.statusText || m.workingOn) && (
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {m.statusText ?? ""}
                    {m.statusText && m.workingOn ? " — " : ""}
                    {m.workingOn ? `working on ${m.workingOn}` : ""}
                  </p>
                )}
                {m.skills.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {m.skills.slice(0, 4).map((s) => (
                      <Badge key={s} variant="secondary" className="px-1.5 py-0 text-[10px]">
                        {s}
                      </Badge>
                    ))}
                    {m.skills.length > 4 && (
                      <span className="text-[10px] text-muted-foreground">+{m.skills.length - 4}</span>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
