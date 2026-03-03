"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, ChevronsUpDown } from "@hugeicons/core-free-icons";
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
import type { DealStatus, Pipeline, Stage } from "@/services/deals";
import { cn } from "@/lib/utils";

export const DEAL_STATUSES: DealStatus[] = ["OPEN", "WON", "LOST"];
const STATUS_LABELS: Record<DealStatus, string> = {
  OPEN: "Open",
  WON: "Won",
  LOST: "Lost",
};

export type DealsFilterBarProps = {
  search: string;
  onSearchChange: (v: string) => void;
  pipelineId: string;
  onPipelineChange: (id: string) => void;
  stageId: string;
  onStageChange: (id: string) => void;
  pipelines: Pipeline[];
  stages: Stage[];
  status: DealStatus | "";
  onStatusChange: (s: DealStatus | "") => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  className?: string;
};

export function DealsFilterBar({
  search,
  onSearchChange,
  pipelineId,
  onPipelineChange,
  stageId,
  onStageChange,
  pipelines,
  stages,
  status,
  onStatusChange,
  onClearFilters,
  hasActiveFilters,
  className,
}: DealsFilterBarProps) {
  const [statusOpen, setStatusOpen] = React.useState(false);
  const displayStatus =
    !status ? "All statuses" : STATUS_LABELS[status as DealStatus];

  const toggleStatus = (s: DealStatus) => {
    if (status === s) onStatusChange("");
    else onStatusChange(s);
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
            placeholder="Search deals..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 pl-8"
          />
        </div>
        {pipelines.length > 0 && (
          <Select
            value={pipelineId || "all"}
            onValueChange={(v) => onPipelineChange(v === "all" ? "" : v)}
          >
            <SelectTrigger size="sm" className="h-8 w-[160px]">
              <SelectValue placeholder="Pipeline" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All pipelines</SelectItem>
              {pipelines.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {stages.length > 0 && (
          <Select
            value={stageId || "all"}
            onValueChange={(v) => onStageChange(v === "all" ? "" : v)}
          >
            <SelectTrigger size="sm" className="h-8 w-[140px]">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {stages.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Popover open={statusOpen} onOpenChange={setStatusOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-[140px] justify-between font-normal">
              {displayStatus}
              <HugeiconsIcon icon={ChevronsUpDown} className="size-4 shrink-0 opacity-50" strokeWidth={2} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="start">
            <div className="flex flex-col gap-1">
              {DEAL_STATUSES.map((s) => (
                <label
                  key={s}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-muted/50"
                >
                  <Checkbox
                    checked={status === s}
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
      </div>
    </div>
  );
}
