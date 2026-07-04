"use client";

import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// ponytail: curated set instead of an emoji-picker dependency; extend the array when needed
const EMOJIS = [
  "👍", "❤️", "😂", "🎉", "🚀", "👀", "😮", "😢",
  "🙏", "🔥", "✅", "❌", "💯", "🤔", "👏", "🫡",
  "😍", "🤯", "🥳", "😅", "☕", "🍕", "🌟", "🐛",
];

export function EmojiPicker({
  onPick,
  children,
}: {
  onPick: (emoji: string) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="end">
        <div className="grid grid-cols-8 gap-0.5">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              className="flex size-6 items-center justify-center rounded text-base transition-transform hover:scale-125 hover:bg-muted"
              onClick={() => {
                onPick(e);
                setOpen(false);
              }}
            >
              {e}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
