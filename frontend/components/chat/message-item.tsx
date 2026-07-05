"use client";

import * as React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownView } from "@/components/ui/markdown-view";
import { EmojiPicker } from "@/components/chat/emoji-picker";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/string";
import { getFileTypeConfig } from "@/lib/file-types";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SmileIcon,
  Comment01Icon,
  PinIcon,
  Edit02Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import {
  useDeleteMessage,
  useEditMessage,
  useTogglePin,
  useToggleReaction,
  type Message,
  type MessageMedia,
} from "@/services/chat";

const CDN_IMAGE_ORIGIN = "cdn.yusufstar.com";

function fileNameFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    const segment = path.split("/").filter(Boolean).pop();
    return segment ?? "file";
  } catch {
    return "file";
  }
}

function MediaBlock({ m }: { m: MessageMedia }) {
  const isImage = m.mimetype?.startsWith("image/");
  const isVideo = m.mimetype?.startsWith("video/");
  const useNextImage = isImage && m.url.includes(CDN_IMAGE_ORIGIN);

  if (isImage) {
    return (
      <a href={m.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg">
        {useNextImage ? (
          <Image src={m.url} alt="" width={400} height={300} className="max-h-72 w-auto rounded-lg object-contain" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={m.url} alt="" className="max-h-72 w-auto rounded-lg object-contain" />
        )}
      </a>
    );
  }

  if (isVideo) {
    return (
      <div className="overflow-hidden rounded-lg">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video src={m.url} controls className="max-h-72 max-w-full rounded-lg object-contain" preload="metadata" />
      </div>
    );
  }

  const fileName = fileNameFromUrl(m.url);
  const config = getFileTypeConfig(fileName, m.mimetype);
  const Icon = config.icon;

  return (
    <a
      href={m.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex min-w-0 items-center gap-2 rounded-lg border px-3 py-2.5 transition-colors hover:opacity-90",
        config.bgClass,
        config.borderClass
      )}
    >
      <span className="shrink-0 rounded p-1.5">
        <HugeiconsIcon icon={Icon} className="size-5" strokeWidth={2} />
      </span>
      <span className="min-w-0 truncate text-sm font-medium">{fileName}</span>
    </a>
  );
}

export interface MessageItemProps {
  message: Message;
  isOwn?: boolean;
  currentUserId: string | null;
  onReply?: (message: Message) => void;
  onOpenThread?: (message: Message) => void;
  /** Thread panels render replies without reply/thread actions */
  inThread?: boolean;
  className?: string;
}

export function MessageItem({
  message,
  isOwn,
  currentUserId,
  onReply,
  onOpenThread,
  inThread = false,
  className,
}: MessageItemProps) {
  const { sender, content, createdAt, medias } = message;
  const displayName = sender.name ?? sender.email ?? "Unknown";
  const toggleReaction = useToggleReaction();
  const togglePin = useTogglePin();
  const editMessage = useEditMessage();
  const deleteMessage = useDeleteMessage();
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(content ?? "");

  // group reactions by emoji
  const reactionGroups = React.useMemo(() => {
    const map = new Map<string, { count: number; mine: boolean; names: string[] }>();
    for (const r of message.reactions ?? []) {
      const g = map.get(r.emoji) ?? { count: 0, mine: false, names: [] };
      g.count += 1;
      if (r.userId === currentUserId) g.mine = true;
      if (r.user?.name) g.names.push(r.user.name);
      map.set(r.emoji, g);
    }
    return [...map.entries()];
  }, [message.reactions, currentUserId]);

  const react = (emoji: string) =>
    toggleReaction.mutate(
      { chatId: message.chatId, messageId: message.id, emoji },
      { onError: (e) => toast.error(e.message) },
    );

  const replyCount = message._count?.replies ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn("group relative w-full", className)}
    >
      <div
        className={cn(
          "w-full max-w-[70%] rounded-xl border bg-card px-3 py-2 shadow-sm transition-colors sm:max-w-[55%]",
          isOwn && "ml-auto bg-primary/5 ring-primary/10",
          message.pinnedAt && "border-status-yellow/40",
        )}
      >
        {message.pinnedAt && (
          <p className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-status-yellow">
            <HugeiconsIcon icon={PinIcon} className="size-3" strokeWidth={2} /> Pinned
          </p>
        )}
        {message.replyTo && !inThread && (
          <button
            type="button"
            onClick={() => onOpenThread?.(message)}
            className="mb-1.5 block w-full truncate rounded-md border-l-2 border-brand/50 bg-muted/50 px-2 py-1 text-left text-xs text-muted-foreground hover:bg-muted"
          >
            <span className="font-medium">{message.replyTo.sender?.name ?? "Someone"}:</span>{" "}
            {message.replyTo.content ?? "attachment"}
          </button>
        )}
        <div className="flex items-center gap-2">
          <Avatar className="size-6 shrink-0">
            <AvatarImage src={sender.image ?? undefined} alt="" />
            <AvatarFallback className="text-[10px]">{initials(displayName)}</AvatarFallback>
          </Avatar>
          <span className="truncate text-sm font-medium">{displayName}</span>
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {new Date(createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
            {message.editedAt && <span className="ml-1 italic">(edited)</span>}
          </span>
        </div>

        <div className="mt-1 pl-8">
          {editing ? (
            <div className="space-y-2">
              <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} className="resize-none text-sm" />
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  disabled={editMessage.isPending || !draft.trim()}
                  onClick={() =>
                    editMessage.mutate(
                      { chatId: message.chatId, messageId: message.id, content: draft.trim() },
                      {
                        onSuccess: () => setEditing(false),
                        onError: (e) => toast.error(e.message),
                      },
                    )
                  }
                >
                  Save
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            content && <MarkdownView className="text-sm [&_.prose]:text-sm" content={content} />
          )}
          {medias?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-3">
              {medias.map((m) => (
                <MediaBlock key={m.id} m={m} />
              ))}
            </div>
          )}

          {(reactionGroups.length > 0 || (!inThread && replyCount > 0)) && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              {reactionGroups.map(([emoji, g]) => (
                <button
                  key={emoji}
                  type="button"
                  title={g.names.join(", ")}
                  onClick={() => react(emoji)}
                  className={cn(
                    "flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs transition-all hover:scale-105",
                    g.mine ? "border-brand/40 bg-brand/10" : "border-border bg-muted/50",
                  )}
                >
                  <span>{emoji}</span>
                  <span className="tabular-nums">{g.count}</span>
                </button>
              ))}
              {!inThread && replyCount > 0 && (
                <button
                  type="button"
                  onClick={() => onOpenThread?.(message)}
                  className="flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-xs text-brand transition-colors hover:bg-muted"
                >
                  <HugeiconsIcon icon={Comment01Icon} className="size-3" strokeWidth={2} />
                  {replyCount} {replyCount === 1 ? "reply" : "replies"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* hover toolbar */}
      {!editing && (
        <div
          className={cn(
            "absolute -top-3 z-10 hidden items-center gap-0.5 rounded-lg border bg-popover p-0.5 shadow-md group-hover:flex",
            isOwn ? "right-2" : "left-2",
          )}
        >
          <EmojiPicker onPick={react}>
            <Button variant="ghost" size="icon" className="size-7" aria-label="React" title="React">
              <HugeiconsIcon icon={SmileIcon} className="size-4" strokeWidth={2} />
            </Button>
          </EmojiPicker>
          {!inThread && (
            <IconButton
              variant="ghost"
              className="size-7"
              label="Reply in thread"
              onClick={() => onReply?.(message)}
            >
              <HugeiconsIcon icon={Comment01Icon} className="size-4" strokeWidth={2} />
            </IconButton>
          )}
          <IconButton
            variant="ghost"
            className="size-7"
            label={message.pinnedAt ? "Unpin" : "Pin"}
            onClick={() =>
              togglePin.mutate(
                { chatId: message.chatId, messageId: message.id },
                {
                  onSuccess: (r) => toast.success(r.pinned ? "Pinned." : "Unpinned."),
                  onError: (e) => toast.error(e.message),
                },
              )
            }
          >
            <HugeiconsIcon icon={PinIcon} className="size-4" strokeWidth={2} />
          </IconButton>
          {isOwn && (
            <>
              <IconButton
                variant="ghost"
                className="size-7"
                label="Edit"
                onClick={() => {
                  setDraft(content ?? "");
                  setEditing(true);
                }}
              >
                <HugeiconsIcon icon={Edit02Icon} className="size-4" strokeWidth={2} />
              </IconButton>
              <IconButton
                variant="ghost"
                className="size-7 text-destructive"
                label="Delete"
                onClick={() =>
                  deleteMessage.mutate(
                    { chatId: message.chatId, messageId: message.id },
                    { onError: (e) => toast.error(e.message) },
                  )
                }
              >
                <HugeiconsIcon icon={Delete02Icon} className="size-4" strokeWidth={2} />
              </IconButton>
            </>
          )}
        </div>
      )}
    </motion.div>
  );
}
