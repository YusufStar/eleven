"use client";

import { format, parse, isValid } from "date-fns";
import type { DateRange } from "react-day-picker";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar03Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ActivityAction, ActivityEntityType } from "@/services/activities";

const DATE_FORMAT = "yyyy-MM-dd";

function parseDate(s: string): Date | undefined {
  if (!s) return undefined;
  const d = parse(s, DATE_FORMAT, new Date());
  return isValid(d) ? d : undefined;
}

function toDateRange(from: string, to: string): DateRange | undefined {
  const fromDate = parseDate(from);
  const toDate = parseDate(to);
  if (!fromDate && !toDate) return undefined;
  return { from: fromDate, to: toDate };
}

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
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 min-w-[240px] justify-start text-left font-normal",
                !dateFrom && !dateTo && "text-muted-foreground"
              )}
            >
              <HugeiconsIcon icon={Calendar03Icon} className="size-4" strokeWidth={2} />
              {(() => {
                const range = toDateRange(dateFrom, dateTo);
                if (!range?.from) return "Pick a date range";
                if (range.to) {
                  return `${format(range.from, "LLL dd, y")} - ${format(range.to, "LLL dd, y")}`;
                }
                return format(range.from, "LLL dd, y");
              })()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              defaultMonth={parseDate(dateFrom) ?? parseDate(dateTo) ?? new Date()}
              selected={toDateRange(dateFrom, dateTo)}
              onSelect={(range) => {
                onDateFromChange(range?.from ? format(range.from, DATE_FORMAT) : "");
                onDateToChange(range?.to ? format(range.to, DATE_FORMAT) : "");
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
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
