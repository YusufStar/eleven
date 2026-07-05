"use client";

import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon, Archive02Icon, Clock01Icon } from "@hugeicons/core-free-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MotionButton, motionButtonInteraction } from "@/components/ui/motion-button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  useMarkNotificationRead,
  useArchiveNotification,
  useSnoozeNotification,
  type AppNotification,
} from "@/services/notifications";

function snoozeTimes(): { label: string; until: string }[] {
  const now = new Date();
  const inHours = (h: number) => new Date(now.getTime() + h * 3600_000).toISOString();
  const tomorrow9 = new Date(now);
  tomorrow9.setDate(now.getDate() + 1);
  tomorrow9.setHours(9, 0, 0, 0);
  return [
    { label: "1 hour", until: inHours(1) },
    { label: "3 hours", until: inHours(3) },
    { label: "Tomorrow 9am", until: tomorrow9.toISOString() },
  ];
}

const actionBtnClass = "size-7";

function ActionTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

export function NotificationRowActions({ n }: { n: AppNotification }) {
  const markRead = useMarkNotificationRead();
  const archive = useArchiveNotification();
  const snooze = useSnoozeNotification();

  return (
    <div className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-md border bg-background/95 p-0.5 shadow-sm opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
      {!n.readAt && (
        <ActionTooltip label="Mark read">
          <MotionButton
            variant="ghost"
            size="icon"
            className={actionBtnClass}
            aria-label="Mark read"
            {...motionButtonInteraction}
            onClick={(e) => {
              e.stopPropagation();
              markRead.mutate(n.id);
            }}
          >
            <HugeiconsIcon icon={Tick02Icon} className="size-3.5" strokeWidth={2} />
          </MotionButton>
        </ActionTooltip>
      )}
      <DropdownMenu>
        <ActionTooltip label="Snooze">
          <DropdownMenuTrigger asChild>
            <MotionButton
              variant="ghost"
              size="icon"
              className={actionBtnClass}
              aria-label="Snooze"
              {...motionButtonInteraction}
            >
              <HugeiconsIcon icon={Clock01Icon} className="size-3.5" strokeWidth={2} />
            </MotionButton>
          </DropdownMenuTrigger>
        </ActionTooltip>
        <DropdownMenuContent align="end">
          {snoozeTimes().map((s) => (
            <DropdownMenuItem
              key={s.label}
              onClick={() =>
                snooze.mutate(
                  { id: n.id, until: s.until },
                  { onSuccess: () => toast.success(`Snoozed for ${s.label.toLowerCase()}`) },
                )
              }
            >
              {s.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <ActionTooltip label={n.archivedAt ? "Unarchive" : "Archive"}>
        <MotionButton
          variant="ghost"
          size="icon"
          className={actionBtnClass}
          aria-label={n.archivedAt ? "Unarchive" : "Archive"}
          {...motionButtonInteraction}
          onClick={(e) => {
            e.stopPropagation();
            archive.mutate({ id: n.id, archived: !n.archivedAt });
          }}
        >
          <HugeiconsIcon icon={Archive02Icon} className="size-3.5" strokeWidth={2} />
        </MotionButton>
      </ActionTooltip>
    </div>
  );
}
