"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { contactQueryKeys } from "@/services/contacts/query-keys";
import { contactsApi } from "@/services/contacts/api";
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
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { Building01Icon, ChevronsUpDown, Cancel01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 300;

export type CompanySelectProps = {
  value: string | null;
  onChange: (companyId: string | null, companyName?: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
};

export function CompanySelect({
  value,
  onChange,
  placeholder = "Select company...",
  disabled,
  id,
}: CompanySelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [selectedLabel, setSelectedLabel] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

  React.useEffect(() => {
    if (!value) setSelectedLabel("");
  }, [value]);

  const { data, isPending } = useQuery({
    queryKey: contactQueryKeys.companies({ search: debouncedSearch, pageSize: 50 }),
    queryFn: () => contactsApi.listCompanies({ search: debouncedSearch, pageSize: 50 }),
    enabled: open,
  });
  const companies = data?.data ?? [];

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setSearch("");
  };

  const handleSelect = (company: { id: string; companyName: string | null }) => {
    const name = company.companyName?.trim() || "Unnamed company";
    onChange(company.id, name);
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
          aria-label="Select company"
          disabled={disabled}
          id={id}
          className={cn(
            "w-full justify-between font-normal h-8 rounded-lg border px-2.5",
            !selectedLabel && "text-muted-foreground"
          )}
        >
          <span className="inline-flex items-center gap-2 truncate">
            <HugeiconsIcon icon={Building01Icon} className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
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
                aria-label="Clear company"
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
            placeholder="Search company..."
          />
          <CommandList>
            <ScrollArea ref={scrollRef} className="h-72">
              {isPending ? (
                <div className="py-6 text-center text-sm text-muted-foreground">Loading...</div>
              ) : (
                <>
                  <CommandEmpty>No company found.</CommandEmpty>
                  <CommandGroup>
                    {companies.map((company) => (
                      <CommandItem
                        key={company.id}
                        value={company.id}
                        onSelect={() => handleSelect(company)}
                        className="gap-2"
                      >
                        {company.avatar ? (
                          <span className="size-6 relative shrink-0 block rounded-md overflow-hidden">
                            <Image
                              src={company.avatar}
                              alt=""
                              fill
                              className="object-contain rounded-md"
                            />
                          </span>
                        ) : (
                          <HugeiconsIcon icon={Building01Icon} className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
                        )}
                        <span className="truncate">{company.companyName?.trim() || "Unnamed company"}</span>
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
