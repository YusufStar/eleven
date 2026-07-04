"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CircleIcon,
  PlayCircleIcon,
  EyeIcon,
  PauseCircleIcon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Archive02Icon,
  ArrowDown01Icon,
  MinusSignIcon,
  ArrowUp01Icon,
  FireIcon,
  AlertCircleIcon,
  Clock01Icon,
  RocketIcon,
  Flag02Icon,
} from "@hugeicons/core-free-icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * The one status badge for the whole app. Every status-like value
 * (task status, priority, project health, sprint state, notification
 * priority) renders through this component so colors, icons and
 * accessibility stay consistent everywhere.
 */

type Tone = "neutral" | "blue" | "purple" | "orange" | "red" | "green" | "yellow";

type Entry = {
  label: string;
  tone: Tone;
  icon: typeof CircleIcon;
  /** tooltip copy */
  hint?: string;
};

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "text-status-neutral border-status-neutral/25 bg-status-neutral/10 hover:bg-status-neutral/20",
  blue: "text-status-blue border-status-blue/25 bg-status-blue/10 hover:bg-status-blue/20",
  purple: "text-status-purple border-status-purple/25 bg-status-purple/10 hover:bg-status-purple/20",
  orange: "text-status-orange border-status-orange/25 bg-status-orange/10 hover:bg-status-orange/20",
  red: "text-status-red border-status-red/25 bg-status-red/10 hover:bg-status-red/20",
  green: "text-status-green border-status-green/25 bg-status-green/10 hover:bg-status-green/20",
  yellow: "text-status-yellow border-status-yellow/25 bg-status-yellow/10 hover:bg-status-yellow/20",
};

export type StatusDomain = "task" | "priority" | "health" | "sprint" | "notification";

const CONFIG: Record<StatusDomain, Record<string, Entry>> = {
  task: {
    TODO: { label: "To do", tone: "neutral", icon: CircleIcon, hint: "Not started yet" },
    IN_PROGRESS: { label: "In progress", tone: "blue", icon: PlayCircleIcon, hint: "Someone is actively working on this" },
    IN_REVIEW: { label: "In review", tone: "orange", icon: EyeIcon, hint: "Waiting for review" },
    BLOCKED: { label: "Blocked", tone: "red", icon: PauseCircleIcon, hint: "Blocked by a dependency or external factor" },
    DONE: { label: "Done", tone: "green", icon: CheckmarkCircle02Icon, hint: "Completed" },
    CANCELLED: { label: "Archived", tone: "neutral", icon: Archive02Icon, hint: "Cancelled or archived" },
  },
  priority: {
    LOW: { label: "Low", tone: "neutral", icon: ArrowDown01Icon, hint: "Low priority" },
    MEDIUM: { label: "Medium", tone: "yellow", icon: MinusSignIcon, hint: "Medium priority" },
    HIGH: { label: "High", tone: "orange", icon: ArrowUp01Icon, hint: "High priority" },
    URGENT: { label: "Urgent", tone: "red", icon: FireIcon, hint: "Needs attention now" },
  },
  health: {
    "on-track": { label: "On track", tone: "green", icon: CheckmarkCircle02Icon, hint: "Healthy — few blocked or overdue tasks" },
    "at-risk": { label: "At risk", tone: "orange", icon: AlertCircleIcon, hint: "Some tasks are blocked or overdue" },
    "off-track": { label: "Off track", tone: "red", icon: AlertCircleIcon, hint: "Many tasks are blocked or overdue" },
    "no-data": { label: "No data", tone: "neutral", icon: CircleIcon, hint: "No tasks yet" },
  },
  sprint: {
    upcoming: { label: "Upcoming", tone: "purple", icon: Clock01Icon, hint: "Starts soon" },
    active: { label: "Active", tone: "blue", icon: RocketIcon, hint: "Currently running" },
    done: { label: "Finished", tone: "green", icon: Flag02Icon, hint: "Sprint has ended" },
  },
  notification: {
    low: { label: "Low", tone: "neutral", icon: ArrowDown01Icon },
    normal: { label: "Normal", tone: "blue", icon: MinusSignIcon },
    high: { label: "High", tone: "red", icon: ArrowUp01Icon },
  },
};

const DOMAIN_LABEL: Record<StatusDomain, string> = {
  task: "Status",
  priority: "Priority",
  health: "Health",
  sprint: "Sprint",
  notification: "Priority",
};

export type StatusBadgeProps = {
  domain: StatusDomain;
  value: string;
  size?: "sm" | "md";
  showIcon?: boolean;
  /** Override the display label */
  label?: string;
  /** Disable the tooltip (e.g. inside another interactive element) */
  noTooltip?: boolean;
  className?: string;
};

export function StatusBadge({
  domain,
  value,
  size = "md",
  showIcon = true,
  label,
  noTooltip = false,
  className,
}: StatusBadgeProps) {
  const entry: Entry = CONFIG[domain][value] ?? {
    label: value,
    tone: "neutral",
    icon: CircleIcon,
  };
  const badge = (
    <span
      role="status"
      aria-label={`${DOMAIN_LABEL[domain]}: ${label ?? entry.label}`}
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1 rounded-full border font-medium whitespace-nowrap transition-colors",
        size === "sm" ? "px-1.5 py-px text-[11px]" : "px-2 py-0.5 text-xs",
        TONE_CLASSES[entry.tone],
        className,
      )}
    >
      {showIcon && (
        <HugeiconsIcon
          icon={entry.icon}
          strokeWidth={2}
          aria-hidden
          className={size === "sm" ? "size-3" : "size-3.5"}
        />
      )}
      {label ?? entry.label}
    </span>
  );
  if (noTooltip || !entry.hint) return badge;
  return (
    <TooltipProvider delayDuration={400}>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>{entry.hint}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** Small colored presence dot used next to avatars. */
export function PresenceDot({
  lastSeenAt,
  className,
}: {
  lastSeenAt: string | Date | null | undefined;
  className?: string;
}) {
  const state = presenceState(lastSeenAt);
  return (
    <span
      aria-label={state}
      title={state}
      className={cn(
        "inline-block size-2.5 rounded-full ring-2 ring-background",
        state === "online" && "bg-status-green",
        state === "away" && "bg-status-yellow",
        state === "offline" && "bg-muted-foreground/30",
        className,
      )}
    />
  );
}

export function presenceState(lastSeenAt: string | Date | null | undefined): "online" | "away" | "offline" {
  if (!lastSeenAt) return "offline";
  const diff = Date.now() - new Date(lastSeenAt).getTime();
  if (diff < 2 * 60 * 1000) return "online";
  if (diff < 15 * 60 * 1000) return "away";
  return "offline";
}
