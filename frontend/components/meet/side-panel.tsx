"use client";

import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  SentIcon,
  Mic01Icon,
  MicOff01Icon,
  WavingHand01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import type { CallChatMessage } from "./use-webrtc";

export type PanelTab = "chat" | "people";

export type PanelParticipant = {
  id: string;
  name: string;
  muted: boolean;
  hand?: boolean;
  isSelf?: boolean;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
}

export function SidePanel({
  tab,
  participants,
  messages,
  onSend,
  onClose,
}: {
  tab: PanelTab;
  participants: PanelParticipant[];
  messages: CallChatMessage[];
  onSend: (text: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, tab]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
  };

  return (
    <aside className="flex w-80 shrink-0 flex-col rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-medium">
          {tab === "chat" ? "In-call messages" : `People (${participants.length})`}
        </h2>
        <IconButton variant="ghost" className="size-7 rounded-full" onClick={onClose} label="Close panel">
          <HugeiconsIcon icon={Cancel01Icon} className="size-4" strokeWidth={2} />
        </IconButton>
      </div>

      {tab === "chat" ? (
        <>
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Messages stay in the call — nothing is saved.
              </p>
            )}
            {messages.map((m) => (
              <div key={m.id}>
                <p className="flex items-baseline gap-2">
                  <span className="text-xs font-medium">{m.self ? "You" : m.name}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {new Date(m.time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
                  </span>
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{m.text}</p>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="flex items-center gap-2 border-t p-3">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Send a message"
              className="h-9 rounded-full"
              aria-label="Message"
            />
            <IconButton
              className="size-9 shrink-0 rounded-full"
              disabled={!draft.trim()}
              onClick={send}
              label="Send message"
            >
              <HugeiconsIcon icon={SentIcon} className="size-4" strokeWidth={1.8} />
            </IconButton>
          </div>
        </>
      ) : (
        <ul className="flex-1 overflow-y-auto px-2 py-2">
          {participants.map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/60">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-muted font-serif text-xs">
                {initials(p.name)}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm">
                {p.name}
                {p.isSelf && <span className="text-muted-foreground"> (you)</span>}
              </span>
              {p.hand && (
                <HugeiconsIcon icon={WavingHand01Icon} className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
              )}
              <HugeiconsIcon
                icon={p.muted ? MicOff01Icon : Mic01Icon}
                className={`size-4 shrink-0 ${p.muted ? "text-muted-foreground/50" : "text-muted-foreground"}`}
                strokeWidth={1.8}
              />
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
