"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  ChevronsUpDown,
  GridTableIcon,
  KanbanIcon,
  Calendar03Icon,
} from "@hugeicons/core-free-icons";
import { ProjectSelect } from "@/components/projects/project-select";
import { OrgMemberMultiSelect } from "@/components/projects/org-member-multi-select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TASK_STATUSES, type TaskStatusValue } from "@/services/tasks/types";
import { cn } from "@/lib/utils";

export type TaskViewType = "table" | "kanban" | "calendar";

const VIEW_ICONS: Record<TaskViewType, typeof GridTableIcon> = {
  table: GridTableIcon,
  kanban: KanbanIcon,
  calendar: Calendar03Icon,
};

const VIEW_LABELS: Record<TaskViewType, string> = {
  table: "Table",
  kanban: "Kanban",
  calendar: "Calendar",
};

const STATUS_LABELS: Record<TaskStatusValue, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  IN_REVIEW: "In review",
  BLOCKED: "Blocked",
  DONE: "Done",
  CANCELLED: "Archived",
};

export type TasksFilterBarProps = {
  search: string;
  onSearchChange: (v: string) => void;
  projectId: string | null;
  onProjectIdChange: (id: string | null) => void;
  assigneeIds: string[];
  onAssigneeIdsChange: (ids: string[]) => void;
  statuses: TaskStatusValue[];
  onStatusesChange: (s: TaskStatusValue[]) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  viewType: TaskViewType;
  onViewTypeChange: (v: TaskViewType) => void;
  className?: string;
};

export function TasksFilterBar({
  search,
  onSearchChange,
  projectId,
  onProjectIdChange,
  assigneeIds,
  onAssigneeIdsChange,
  statuses,
  onStatusesChange,
  onClearFilters,
  hasActiveFilters,
  viewType,
  onViewTypeChange,
  className,
}: TasksFilterBarProps) {
  const [statusOpen, setStatusOpen] = React.useState(false);
  const displayStatus =
    statuses.length === 0
      ? "All statuses"
      : statuses.length === TASK_STATUSES.length
        ? "All statuses"
        : statuses.length <= 2
          ? statuses.map((s) => STATUS_LABELS[s]).join(", ")
          : `${statuses.length} statuses`;

  const toggleStatus = (s: TaskStatusValue) => {
    if (statuses.includes(s)) onStatusesChange(statuses.filter((x) => x !== s));
    else onStatusesChange([...statuses, s]);
  };

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
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 pl-8"
          />
        </div>
        <div className="w-[250px]">
          <ProjectSelect
            value={projectId}
            onChange={onProjectIdChange}
            placeholder="All projects"
          />
        </div>
        <div className="w-[220px]">
          <OrgMemberMultiSelect
            value={assigneeIds}
            onChange={onAssigneeIdsChange}
            placeholder="Select assignees..."
            includeCurrentUser
            triggerDisplay="count"
          />
        </div>
        <Popover open={statusOpen} onOpenChange={setStatusOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-[160px] justify-between font-normal">
              {displayStatus}
              <HugeiconsIcon icon={ChevronsUpDown} className="size-4 shrink-0 opacity-50" strokeWidth={2} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="start">
            <div className="flex flex-col gap-1">
              {TASK_STATUSES.map((s) => (
                <label
                  key={s}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-muted/50"
                >
                  <Checkbox
                    checked={statuses.includes(s)}
                    onCheckedChange={() => toggleStatus(s)}
                  />
                  {STATUS_LABELS[s]}
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-8 text-muted-foreground" onClick={onClearFilters}>
            Clear filters
          </Button>
        )}
        <Select value={viewType} onValueChange={onViewTypeChange}>
          <SelectTrigger size="sm" className="ml-auto w-[140px] h-8 gap-2">
            <SelectValue placeholder="View" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="table">
              <span className="flex items-center gap-2">
                <HugeiconsIcon icon={GridTableIcon} className="size-4" strokeWidth={2} />
                {VIEW_LABELS.table}
              </span>
            </SelectItem>
            <SelectItem value="kanban">
              <span className="flex items-center gap-2">
                <HugeiconsIcon icon={KanbanIcon} className="size-4" strokeWidth={2} />
                {VIEW_LABELS.kanban}
              </span>
            </SelectItem>
            <SelectItem value="calendar">
              <span className="flex items-center gap-2">
                <HugeiconsIcon icon={Calendar03Icon} className="size-4" strokeWidth={2} />
                {VIEW_LABELS.calendar}
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
