"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

function openPalette() {
  window.dispatchEvent(new Event("open-command-palette"));
}

/** Search trigger in the header. Full pill on desktop, icon-only on mobile. */
export function CommandSearchButton() {
  const [mac, setMac] = React.useState(false);
  React.useEffect(() => {
    setMac(/mac/i.test(navigator.platform));
  }, []);

  return (
    <button
      type="button"
      onClick={openPalette}
      aria-label="Search"
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-lg border bg-input/30 px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted",
        "sm:w-56 sm:justify-between",
      )}
    >
      <span className="flex items-center gap-2">
        <HugeiconsIcon icon={Search01Icon} className="size-4" strokeWidth={2} />
        <span className="hidden sm:inline">Search…</span>
      </span>
      <kbd className="hidden rounded border bg-background px-1.5 font-mono text-[10px] text-muted-foreground sm:inline">
        {mac ? "⌘" : "Ctrl"} K
      </kbd>
    </button>
  );
}
