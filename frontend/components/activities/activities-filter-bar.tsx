"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ActivityAction, ActivityEntityType } from "@/services/activities";

const ACTIONS: ActivityAction[] = ["CREATE", "UPDATE", "DELETE", "VIEW"];
const ACTION_LABELS: Record<ActivityAction, string> = {
  CREATE: "Created",
  UPDATE: "Updated",
  DELETE: "Deleted",
  VIEW: "Viewed",
};

const ENTITY_TYPES: ActivityEntityType[] = [
  "CONTACT",
  "DEAL",
  "PROJECT",
  "TASK",
  "PIPELINE",
  "STAGE",
  "PROJECT_FILE",
  "TASK_ATTACHMENT",
  "PROJECT_MEMBER",
];
const ENTITY_TYPE_LABELS: Record<ActivityEntityType, string> = {
  CONTACT: "Contact",
  DEAL: "Deal",
  PROJECT: "Project",
  TASK: "Task",
  PIPELINE: "Pipeline",
  STAGE: "Stage",
  PROJECT_FILE: "Project file",
  TASK_ATTACHMENT: "Task attachment",
  PROJECT_MEMBER: "Project member",
};

export type ActivitiesFilterBarProps = {
  search: string;
  onSearchChange: (v: string) => void;
  action: ActivityAction | "";
  onActionChange: (v: ActivityAction | "") => void;
  entityType: ActivityEntityType | "";
  onEntityTypeChange: (v: ActivityEntityType | "") => void;
  dateFrom: string;
  onDateFromChange: (v: string) => void;
  dateTo: string;
  onDateToChange: (v: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  className?: string;
};

export function ActivitiesFilterBar({
  search,
  onSearchChange,
  action,
  onActionChange,
  entityType,
  onEntityTypeChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  onClearFilters,
  hasActiveFilters,
  className,
}: ActivitiesFilterBarProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] max-w-sm">
          <HugeiconsIcon
            icon={Search01Icon}
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={2}
          />
          <Input
            placeholder="Search by entity or ID..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 pl-8"
          />
        </div>
        <Select
          value={action || "all"}
          onValueChange={(v) => onActionChange(v === "all" ? "" : (v as ActivityAction))}
        >
          <SelectTrigger size="sm" className="h-8 w-[140px]">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {ACTIONS.map((a) => (
              <SelectItem key={a} value={a}>
                {ACTION_LABELS[a]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={entityType || "all"}
          onValueChange={(v) =>
            onEntityTypeChange(v === "all" ? "" : (v as ActivityEntityType))
          }
        >
          <SelectTrigger size="sm" className="h-8 w-[160px]">
            <SelectValue placeholder="Entity type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {ENTITY_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {ENTITY_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          placeholder="From"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="h-8 w-[140px]"
        />
        <Input
          type="date"
          placeholder="To"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className="h-8 w-[140px]"
        />
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-muted-foreground"
            onClick={onClearFilters}
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
