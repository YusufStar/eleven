"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { teamApi } from "@/services/team";
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
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon, ChevronsUpDown, Cancel01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

export type OrgMemberOption = {
  id: string;
  userId: string;
  user: { id: string; name: string; email: string; image: string | null };
};

export type OrgMemberMultiSelectProps = {
  value: string[];
  onChange: (memberIds: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
};

export function OrgMemberMultiSelect({
  value,
  onChange,
  placeholder = "Select members...",
  disabled,
  id,
}: OrgMemberMultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id ?? null;

  const { data: listData, isPending } = useQuery({
    queryKey: ["team", "members", "all", { pageSize: 200 }],
    queryFn: () => teamApi.listMembers({ pageSize: 200 }),
    enabled: open,
  });

  const members: OrgMemberOption[] = React.useMemo(() => {
    const list = listData?.data ?? [];
    return currentUserId ? list.filter((m) => m.userId !== currentUserId) : list;
  }, [listData?.data, currentUserId]);

  const selectedMembers = React.useMemo(() => {
    return members.filter((m) => value.includes(m.id));
  }, [members, value]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setSearch("");
  };

  const handleSelect = (member: OrgMemberOption) => {
    if (value.includes(member.id)) {
      onChange(value.filter((id) => id !== member.id));
    } else {
      onChange([...value, member.id]);
    }
  };

  const handleRemove = (e: React.MouseEvent, memberId: string) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(value.filter((id) => id !== memberId));
  };

  const filteredMembers = search.trim()
    ? members.filter(
        (m) =>
          m.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
          m.user?.email?.toLowerCase().includes(search.toLowerCase())
      )
    : members;

  return (
    <div className="space-y-1.5">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select members"
            disabled={disabled}
            id={id}
            className={cn(
              "w-full justify-between font-normal min-h-8 h-auto rounded-lg border px-2.5 py-1.5",
              !value.length && "text-muted-foreground"
            )}
          >
            <span className="inline-flex flex-wrap items-center gap-1.5 truncate">
              <HugeiconsIcon icon={UserGroupIcon} className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
              {selectedMembers.length > 0 ? (
                selectedMembers.map((m) => (
                  <Badge
                    key={m.id}
                    variant="secondary"
                    className="gap-0.5 pr-0.5 font-normal"
                  >
                    {m.user?.name?.trim() || m.user?.email || "—"}
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => handleRemove(e, m.id)}
                      onKeyDown={(e) => e.key === "Enter" && handleRemove(e as unknown as React.MouseEvent, m.id)}
                      className="rounded p-0.5 hover:bg-muted ml-0.5"
                      aria-label="Remove"
                    >
                      <HugeiconsIcon icon={Cancel01Icon} className="size-3" strokeWidth={2} />
                    </span>
                  </Badge>
                ))
              ) : (
                placeholder
              )}
            </span>
            <HugeiconsIcon icon={ChevronsUpDown} className="size-4 shrink-0 text-muted-foreground ml-2" strokeWidth={2} />
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
              placeholder="Search members..."
            />
            <CommandList>
              <ScrollArea ref={scrollRef} className="h-56">
                {isPending ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">Loading...</div>
                ) : (
                  <>
                    <CommandEmpty>No member found.</CommandEmpty>
                    <CommandGroup>
                      {filteredMembers.map((member) => {
                        const isSelected = value.includes(member.id);
                        return (
                          <CommandItem
                            key={member.id}
                            value={member.id}
                            onSelect={() => handleSelect(member)}
                            className="gap-2"
                          >
                            {member.user?.image ? (
                              <span className="size-6 relative shrink-0 block rounded-md overflow-hidden">
                                <Image
                                  src={member.user.image}
                                  alt=""
                                  fill
                                  className="object-cover rounded-md"
                                />
                              </span>
                            ) : (
                              <HugeiconsIcon icon={UserGroupIcon} className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
                            )}
                            <span className="truncate">{member.user?.name?.trim() || member.user?.email || "—"}</span>
                            {isSelected && (
                              <span className="ml-auto text-xs text-muted-foreground">Added</span>
                            )}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </>
                )}
              </ScrollArea>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <p className="text-xs text-muted-foreground">
        The creator is automatically added as a project member.
      </p>
    </div>
  );
}
