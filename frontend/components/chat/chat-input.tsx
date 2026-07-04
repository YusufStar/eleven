"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmojiPicker } from "@/components/chat/emoji-picker";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AttachmentIcon,
  Delete02Icon,
  ArrowRight01Icon,
  SmileIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/string";
import { useUploadFileMutation } from "@/services/upload";
import { useTypingNotifier } from "@/services/chat";
import { useTeamMembersList } from "@/services/team";
import type { SendMessageMediaItem, SendMessageMediaUpload, SendMessagePayload } from "@/services/chat";

const MAX_MEDIAS = 10;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPT: Record<string, string[]> = {
  "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
  "video/*": [".mp4", ".webm"],
  "application/pdf": [".pdf"],
};

export interface ChatInputProps {
  chatId?: string | null;
  onSend: (payload: SendMessagePayload) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function ChatInput({
  chatId = null,
  onSend,
  disabled = false,
  placeholder = "Type a message...",
  className,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const [pendingMedias, setPendingMedias] = useState<SendMessageMediaUpload[]>([]);
  // names inserted via @mention picker → userIds, resolved at send time
  const [mentionMap, setMentionMap] = useState<Record<string, string>>({});
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFileMutation();
  const notifyTyping = useTypingNotifier(chatId);
  const { data: teamData } = useTeamMembersList({ pageSize: 100 });
  const members = teamData?.data ?? [];

  const canSend = (text.trim().length > 0 || pendingMedias.length > 0) && !disabled;

  const mentionCandidates = useMemo(() => {
    if (mentionQuery == null) return [];
    const q = mentionQuery.toLowerCase();
    return members
      .filter((m) => (m.user.name ?? "").toLowerCase().includes(q))
      .slice(0, 6);
  }, [mentionQuery, members]);

  const removePending = useCallback((index: number) => {
    setPendingMedias((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addFiles = useCallback(
    async (files: File[]) => {
      const toAdd: SendMessageMediaUpload[] = [];
      for (const file of files.slice(0, MAX_MEDIAS - pendingMedias.length)) {
        if (file.size > MAX_FILE_SIZE) continue;
        try {
          const res = await uploadFile(file);
          toAdd.push({
            url: res.url,
            fileName: res.fileName,
            fileType: res.fileType,
            fileSize: res.fileSize,
          });
        } catch {
          // mutation handles toast
        }
      }
      setPendingMedias((prev) => [...prev, ...toAdd].slice(0, MAX_MEDIAS));
    },
    [pendingMedias.length, uploadFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files?.length) addFiles(Array.from(files));
      e.target.value = "";
    },
    [addFiles]
  );

  const updateText = (value: string) => {
    setText(value);
    notifyTyping();
    // open the @mention picker when the caret is inside an "@word"
    const el = textareaRef.current;
    const caret = el?.selectionStart ?? value.length;
    const before = value.slice(0, caret);
    const match = before.match(/(?:^|\s)@([\w ]{0,20})$/);
    setMentionQuery(match ? match[1] : null);
  };

  const pickMention = (name: string, userId: string) => {
    const el = textareaRef.current;
    const caret = el?.selectionStart ?? text.length;
    const before = text.slice(0, caret).replace(/(?:^|\s)@([\w ]{0,20})$/, (m) =>
      m.startsWith(" ") || m.startsWith("\n") ? `${m[0]}@${name} ` : `@${name} `
    );
    setText(before + text.slice(caret));
    setMentionMap((prev) => ({ ...prev, [name]: userId }));
    setMentionQuery(null);
    el?.focus();
  };

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current;
    const caret = el?.selectionStart ?? text.length;
    setText(text.slice(0, caret) + emoji + text.slice(caret));
    el?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    const content = text.trim() || null;
    const mentionUserIds = Object.entries(mentionMap)
      .filter(([name]) => content?.includes(`@${name}`))
      .map(([, id]) => id);
    onSend({
      content,
      medias: pendingMedias.length > 0 ? pendingMedias : undefined,
      mentionUserIds: mentionUserIds.length > 0 ? mentionUserIds : undefined,
    });
    setText("");
    setPendingMedias([]);
    setMentionMap({});
    setMentionQuery(null);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mentionQuery != null && mentionCandidates.length > 0 && (e.key === "Tab" || e.key === "Enter")) {
      e.preventDefault();
      const m = mentionCandidates[0];
      pickMention(m.user.name, m.userId);
      return;
    }
    if (e.key === "Escape" && mentionQuery != null) {
      setMentionQuery(null);
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onSubmit={handleSubmit}
      className={cn(
        "relative flex flex-col gap-2 rounded-xl border bg-card p-2 shadow-sm ring-1 ring-foreground/5",
        className
      )}
    >
      <AnimatePresence>
        {mentionQuery != null && mentionCandidates.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute bottom-full left-2 z-20 mb-1 w-64 overflow-hidden rounded-lg border bg-popover py-1 shadow-lg"
          >
            {mentionCandidates.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-sm hover:bg-muted"
                  onClick={() => pickMention(m.user.name, m.userId)}
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

      <div className="flex flex-col gap-2 outline-none">
        <AnimatePresence mode="popLayout">
          {pendingMedias.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-wrap gap-1.5 overflow-hidden"
            >
              {pendingMedias.map((m, i) => (
                <motion.div
                  key={`${m.url}-${i}`}
                  layout
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="flex items-center gap-1 rounded-md bg-muted/80 px-2 py-1 text-xs"
                >
                  <span className="max-w-24 truncate">{m.fileName}</span>
                  <button
                    type="button"
                    onClick={() => removePending(i)}
                    className="rounded p-0.5 hover:bg-muted"
                    aria-label="Remove"
                  >
                    <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-1">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <Textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => updateText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className="min-h-10 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 max-h-[100px]"
            />
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={Object.keys(ACCEPT).join(",")}
              onChange={handleFileChange}
              className="hidden"
              aria-hidden
            />
            <EmojiPicker onPick={insertEmoji}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 shrink-0"
                disabled={disabled}
                aria-label="Insert emoji"
              >
                <HugeiconsIcon icon={SmileIcon} className="size-5" />
              </Button>
            </EmojiPicker>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 shrink-0"
              disabled={disabled || isUploading || pendingMedias.length >= MAX_MEDIAS}
              aria-label="Attach file"
              onClick={() => fileInputRef.current?.click()}
            >
              <HugeiconsIcon icon={AttachmentIcon} className="size-5" />
            </Button>

            <Button
              type="submit"
              size="icon"
              className="size-9 shrink-0"
              disabled={!canSend}
              aria-label="Send"
            >
              <HugeiconsIcon icon={ArrowRight01Icon} className="size-5" />
            </Button>
          </div>
        </div>
      </div>
    </motion.form>
  );
}
