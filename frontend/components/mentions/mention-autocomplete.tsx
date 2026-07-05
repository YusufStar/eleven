"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTeamMembersList, type TeamMember } from "@/services/team";
import { initials } from "@/lib/string";
import { cn } from "@/lib/utils";

export type MentionPick = { name: string; memberId: string; userId: string };

/** Shared @mention state for any textarea composer (chat + task comments).
 *  Callers wire `detect` on change, render <MentionSuggestions>, and call
 *  `resolve(finalText)` at submit to get the mentions still present in the text. */
export function useMentionAutocomplete() {
  const { data } = useTeamMembersList({ pageSize: 100 });
  const members = data?.data ?? [];
  const [query, setQuery] = React.useState<string | null>(null);
  const [picked, setPicked] = React.useState<Record<string, MentionPick>>({});

  const candidates = React.useMemo(() => {
    if (query == null) return [];
    const q = query.toLowerCase();
    return members.filter((m) => (m.user.name ?? "").toLowerCase().includes(q)).slice(0, 6);
  }, [query, members]);

  /** Detect an "@word" the caret currently sits in and open/close the dropdown. */
  const detect = (value: string, caret: number) => {
    const before = value.slice(0, caret);
    const match = before.match(/(?:^|\s)@([\w ]{0,20})$/);
    setQuery(match ? match[1] : null);
  };

  /** Replace the in-progress "@word" with the picked member's name. */
  const insert = (text: string, caret: number, member: TeamMember): { text: string; caret: number } => {
    const name = member.user.name;
    const before = text.slice(0, caret).replace(/(?:^|\s)@([\w ]{0,20})$/, (m) =>
      m.startsWith(" ") || m.startsWith("\n") ? `${m[0]}@${name} ` : `@${name} `,
    );
    setPicked((prev) => ({ ...prev, [name]: { name, memberId: member.id, userId: member.userId } }));
    setQuery(null);
    return { text: before + text.slice(caret), caret: before.length };
  };

  /** Mentions whose "@name" is still present in the final content. */
  const resolve = (content: string): MentionPick[] =>
    Object.values(picked).filter((p) => content.includes(`@${p.name}`));

  const reset = () => {
    setPicked({});
    setQuery(null);
  };

  return { open: query != null, query, candidates, detect, insert, resolve, reset, close: () => setQuery(null) };
}

export function MentionSuggestions({
  candidates,
  onPick,
  className,
}: {
  candidates: TeamMember[];
  onPick: (m: TeamMember) => void;
  className?: string;
}) {
  return (
    <AnimatePresence>
      {candidates.length > 0 && (
        <motion.ul
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          className={cn("z-20 w-64 overflow-hidden rounded-lg border bg-popover py-1 shadow-lg", className)}
        >
          {candidates.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-sm hover:bg-muted"
                onMouseDown={(e) => {
                  e.preventDefault(); // keep textarea focus
                  onPick(m);
                }}
              >
                <Avatar className="size-5">
                  <AvatarImage src={m.user.image ?? undefined} alt="" />
                  <AvatarFallback className="text-[9px]">{initials(m.user.name)}</AvatarFallback>
                </Avatar>
                <span className="truncate">{m.user.name}</span>
              </button>
            </li>
          ))}
        </motion.ul>
      )}
    </AnimatePresence>
  );
}
