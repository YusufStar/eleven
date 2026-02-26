"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { tasksApi } from "@/services/tasks/api";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HugeiconsIcon } from "@hugeicons/react";
import { Task01Icon, ChevronsUpDown, Cancel01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 300;

export type TaskSelectProps = {
  value: string | null;
  onChange: (taskId: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  /** Exclude this task id from options (e.g. when editing, exclude self) */
  excludeTaskId?: string | null;
  projectId?: string | null;
};

export function TaskSelect({
  value,
  onChange,
  placeholder = "Select parent task...",
  disabled,
  id,
  excludeTaskId,
  projectId,
}: TaskSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isPending } = useQuery({
    queryKey: ["tasks", "list", { all: true, search: debouncedSearch || undefined, projectId: projectId || undefined }],
    queryFn: () => tasksApi.list({ all: true, pageSize: 100, search: debouncedSearch || undefined, projectId: projectId || undefined }),
    enabled: open,
  });
  const tasks = (data?.data ?? []).filter((t) => t.id !== excludeTaskId);

  const selectedTask = tasks.find((t) => t.id === value);
  const selectedLabel = selectedTask?.title?.trim() || "";

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setSearch("");
  };

  const handleSelect = (task: { id: string; title: string }) => {
    onChange(task.id);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(null);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select task"
          disabled={disabled}
          id={id}
          className={cn(
            "w-full justify-between font-normal h-8 rounded-lg border px-2.5",
            !selectedLabel && "text-muted-foreground"
          )}
        >
          <span className="inline-flex items-center gap-2 truncate">
            <HugeiconsIcon icon={Task01Icon} className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
            {selectedLabel || placeholder}
          </span>
          <span className="flex items-center gap-0.5 shrink-0">
            {value && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={(e) => e.key === "Enter" && handleClear(e as unknown as React.MouseEvent)}
                className="rounded p-0.5 hover:bg-muted"
                aria-label="Clear task"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-4" strokeWidth={2} />
              </span>
            )}
            <HugeiconsIcon icon={ChevronsUpDown} className="size-4 text-muted-foreground" strokeWidth={2} />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder="Search tasks..."
          />
          <CommandList>
            <ScrollArea className="h-72">
              {isPending ? (
                <div className="py-6 text-center text-sm text-muted-foreground">Loading...</div>
              ) : (
                <>
                  <CommandEmpty>No task found.</CommandEmpty>
                  <CommandGroup>
                    {tasks.map((task) => (
                      <CommandItem
                        key={task.id}
                        value={task.id}
                        onSelect={() => handleSelect(task)}
                        className="gap-2"
                      >
                        <HugeiconsIcon icon={Task01Icon} className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
                        <span className="truncate">{task.title?.trim() || "Untitled"}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
