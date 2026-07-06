"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, ArrowRight01Icon, File02Icon } from "@hugeicons/core-free-icons";
import { parsePatch } from "@/services/github/diff";
import type { CommitFile } from "@/services/github";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  added: "added",
  removed: "deleted",
  modified: "modified",
  renamed: "renamed",
  changed: "changed",
};

export function CommitFileDiff({ file }: { file: CommitFile }) {
  const [open, setOpen] = useState(true);
  const lines = file.patch ? parsePatch(file.patch) : [];

  return (
    <div className="overflow-hidden rounded-lg border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 border-b bg-muted/40 px-3 py-2 text-left hover:bg-muted/60"
      >
        <HugeiconsIcon icon={open ? ArrowDown01Icon : ArrowRight01Icon} className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
        <HugeiconsIcon icon={File02Icon} className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
        <span className="min-w-0 flex-1 truncate font-mono text-xs">{file.filename}</span>
        <span className="shrink-0 rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
          {STATUS_LABEL[file.status] ?? file.status}
        </span>
        <span className="shrink-0 font-mono text-xs text-status-green">+{file.additions}</span>
        <span className="shrink-0 font-mono text-xs text-destructive">−{file.deletions}</span>
      </button>

      {open && (
        <div className="overflow-x-auto">
          {lines.length === 0 ? (
            <p className="px-3 py-4 text-xs text-muted-foreground">
              No textual diff available (binary file or too large to display).
            </p>
          ) : (
            <table className="w-full border-collapse font-mono text-xs">
              <tbody>
                {lines.map((l, i) => (
                  <tr
                    key={i}
                    className={cn(
                      l.type === "add" && "bg-status-green/10",
                      l.type === "del" && "bg-destructive/10",
                      l.type === "hunk" && "bg-status-blue/10 text-muted-foreground"
                    )}
                  >
                    <td className="w-10 select-none border-r px-2 text-right text-[10px] text-muted-foreground/60">
                      {l.oldNo ?? ""}
                    </td>
                    <td className="w-10 select-none border-r px-2 text-right text-[10px] text-muted-foreground/60">
                      {l.newNo ?? ""}
                    </td>
                    <td className="w-4 select-none pl-2 text-muted-foreground/70">
                      {l.type === "add" ? "+" : l.type === "del" ? "−" : ""}
                    </td>
                    <td className="whitespace-pre px-2 py-0.5">{l.text || " "}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
