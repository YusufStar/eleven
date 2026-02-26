"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
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
import { HugeiconsIcon } from "@hugeicons/react";
import { UserIcon, ChevronsUpDown, Cancel01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 300;

export type ContactSelectProps = {
  value: string | null;
  onChange: (contactId: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
};

function contactLabel(c: { firstName?: string; lastName?: string | null; companyName?: string | null }) {
  const name = [c.firstName, c.lastName].filter(Boolean).join(" ").trim() || "Unnamed";
  return c.companyName ? `${name} · ${c.companyName}` : name;
}

export function ContactSelect({
  value,
  onChange,
  placeholder = "Select contact...",
  disabled,
  id,
}: ContactSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [selectedLabel, setSelectedLabel] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isPending } = useQuery({
    queryKey: ["contacts", "people", { search: debouncedSearch, pageSize: 50 }],
    queryFn: () => contactsApi.listPeople({ search: debouncedSearch, pageSize: 50 }),
    enabled: open,
  });
  const contacts = data?.data ?? [];

  const selectedContact = contacts.find((c) => c.id === value);
  React.useEffect(() => {
    if (!value) setSelectedLabel("");
    else if (selectedContact) setSelectedLabel(contactLabel(selectedContact));
    else setSelectedLabel("");
  }, [value, selectedContact]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setSearch("");
  };

  const handleSelect = (contact: { id: string; firstName: string; lastName?: string | null; companyName?: string | null }) => {
    onChange(contact.id);
    setSelectedLabel(contactLabel(contact));
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
          aria-label="Select contact"
          disabled={disabled}
          id={id}
          className={cn(
            "w-full justify-between font-normal h-8 rounded-lg border px-2.5",
            !selectedLabel && "text-muted-foreground"
          )}
        >
          <span className="inline-flex items-center gap-2 truncate">
            <HugeiconsIcon icon={UserIcon} className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
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
                aria-label="Clear contact"
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
            placeholder="Search contacts..."
          />
          <CommandList>
            <ScrollArea ref={scrollRef} className="h-72">
              {isPending ? (
                <div className="py-6 text-center text-sm text-muted-foreground">Loading...</div>
              ) : (
                <>
                  <CommandEmpty>No contact found.</CommandEmpty>
                  <CommandGroup>
                    {contacts.map((contact) => (
                      <CommandItem
                        key={contact.id}
                        value={contact.id}
                        onSelect={() => handleSelect(contact)}
                        className="gap-2"
                      >
                        <HugeiconsIcon icon={UserIcon} className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
                        <span className="truncate">{contactLabel(contact)}</span>
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
