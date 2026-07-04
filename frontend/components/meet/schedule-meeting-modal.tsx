"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Globe02Icon, UserGroupIcon } from "@hugeicons/core-free-icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { useTeamMembersList } from "@/services/team";
import { useCreateMeeting } from "@/services/meetings";
import { authClient } from "@/lib/auth-client";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
}

export function ScheduleMeetingModal({
  open,
  onOpenChange,
  defaultStartsAt = null,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStartsAt?: Date | null;
}) {
  const { data: session } = authClient.useSession();
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState<Date | null>(null);

  // adopt the slot the user clicked in the calendar
  useEffect(() => {
    if (open) setStartsAt(defaultStartsAt);
  }, [open, defaultStartsAt]);
  const [isPublic, setIsPublic] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: members } = useTeamMembersList({ pageSize: 100 });
  const createMeeting = useCreateMeeting();

  const selectable = useMemo(
    () =>
      (members?.data ?? []).filter(
        (m) =>
          m.user.id !== session?.user?.id &&
          (search.trim() === "" ||
            m.user.name.toLowerCase().includes(search.trim().toLowerCase()) ||
            m.user.email.toLowerCase().includes(search.trim().toLowerCase())),
      ),
    [members?.data, search, session?.user?.id],
  );

  const toggle = (memberId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  };

  const reset = () => {
    setTitle("");
    setStartsAt(null);
    setIsPublic(true);
    setSearch("");
    setSelected(new Set());
  };

  const submit = () => {
    createMeeting.mutate(
      {
        title: title.trim() || undefined,
        startsAt: startsAt ? startsAt.toISOString() : null,
        isPublic,
        participantMemberIds: isPublic ? [] : [...selected],
      },
      {
        onSuccess: (meeting) => {
          toast.success(`Meeting scheduled — code ${meeting.code}`);
          reset();
          onOpenChange(false);
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const canSubmit = !createMeeting.isPending && (isPublic || selected.size > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Plan a meeting</DialogTitle>
          <DialogDescription>
            Invitees get an in-app notification with the join link.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="meeting-title">Title</Label>
            <Input
              id="meeting-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Weekly sprint review"
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label>Starts</Label>
            <DateTimePicker value={startsAt} onChange={(d) => setStartsAt(d ?? null)} />
            <p className="text-xs text-muted-foreground">Leave empty to start right now.</p>
          </div>

          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div className="flex items-center gap-3">
              <HugeiconsIcon
                icon={isPublic ? Globe02Icon : UserGroupIcon}
                className="size-4.5 text-muted-foreground"
                strokeWidth={1.8}
              />
              <div>
                <p className="text-sm font-medium">{isPublic ? "Open to everyone" : "Invite only"}</p>
                <p className="text-xs text-muted-foreground">
                  {isPublic ? "Every member of your team can join" : "Only selected teammates can join"}
                </p>
              </div>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} aria-label="Open to everyone" />
          </div>

          {!isPublic && (
            <div className="space-y-2">
              <Label>Participants</Label>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search teammates"
              />
              <div className="max-h-44 overflow-y-auto rounded-lg border">
                {selectable.length === 0 ? (
                  <p className="px-3 py-4 text-center text-sm text-muted-foreground">No teammates found.</p>
                ) : (
                  selectable.map((m) => (
                    <label
                      key={m.id}
                      className="flex cursor-pointer items-center gap-3 border-b px-3 py-2.5 last:border-b-0 hover:bg-muted/60"
                    >
                      <Checkbox checked={selected.has(m.id)} onCheckedChange={() => toggle(m.id)} />
                      <span className="flex size-7 items-center justify-center rounded-full border bg-muted font-serif text-[11px]">
                        {initials(m.user.name)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm">{m.user.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">{m.user.email}</span>
                      </span>
                    </label>
                  ))
                )}
              </div>
              {selected.size > 0 && (
                <p className="text-xs text-muted-foreground">{selected.size} selected</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {createMeeting.isPending ? "Planning…" : "Plan meeting"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
