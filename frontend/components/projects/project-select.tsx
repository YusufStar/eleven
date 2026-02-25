"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { projectsApi } from "@/services/projects/api";
import { useProject } from "@/services/projects/use-projects";
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
import { Folder01Icon, ChevronsUpDown, Cancel01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 300;

export type ProjectSelectProps = {
  value: string | null;
  onChange: (projectId: string | null, projectName?: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
};

export function ProjectSelect({
  value,
  onChange,
  placeholder = "Select project...",
  disabled,
  id,
}: ProjectSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [selectedLabel, setSelectedLabel] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

  const { data: project } = useProject(value);

  React.useEffect(() => {
    if (!value) setSelectedLabel("");
    else if (project?.name) setSelectedLabel(project.name.trim() || "Unnamed project");
  }, [value, project?.name]);

  const { data, isPending } = useQuery({
    queryKey: ["projects", "list", { search: debouncedSearch, pageSize: 50 }],
    queryFn: () => projectsApi.list({ search: debouncedSearch, pageSize: 50 }),
    enabled: open,
  });
  const projects = data?.data ?? [];

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setSearch("");
  };

  const handleSelect = (project: { id: string; name: string }) => {
    const name = project.name?.trim() || "Unnamed project";
    onChange(project.id, name);
    setSelectedLabel(name);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(null);
    setSelectedLabel("");
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select project"
          disabled={disabled}
          id={id}
          className={cn(
            "w-full justify-between font-normal h-8 rounded-lg border px-2.5",
            !selectedLabel && "text-muted-foreground"
          )}
        >
          <span className="inline-flex items-center gap-2 truncate">
            <HugeiconsIcon icon={Folder01Icon} className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
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
                aria-label="Clear project"
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
            onValueChange={(v) => {
              setSearch(v);
              setTimeout(() => {
                if (scrollRef.current) {
                  const viewport = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
                  if (viewport) (viewport as HTMLElement).scrollTop = 0;
                }
              }, 0);
            }}
            placeholder="Search project..."
          />
          <CommandList>
            <ScrollArea ref={scrollRef} className="h-72">
              {isPending ? (
                <div className="py-6 text-center text-sm text-muted-foreground">Loading...</div>
              ) : (
                <>
                  <CommandEmpty>No project found.</CommandEmpty>
                  <CommandGroup>
                    {projects.map((project) => (
                      <CommandItem
                        key={project.id}
                        value={project.id}
                        onSelect={() => handleSelect(project)}
                        className="gap-2"
                      >
                        <HugeiconsIcon icon={Folder01Icon} className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
                        <span className="truncate">{project.name?.trim() || "Unnamed project"}</span>
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
