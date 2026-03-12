"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AttachmentIcon,
  Delete02Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { useUploadFileMutation } from "@/services/upload";
import type { SendMessageMediaItem, SendMessageMediaUpload } from "@/services/chat";

const MAX_MEDIAS = 10;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPT: Record<string, string[]> = {
  "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
  "video/*": [".mp4", ".webm"],
  "application/pdf": [".pdf"],
};

export interface ChatInputProps {
  onSend: (payload: { content: string | null; medias?: SendMessageMediaItem[] }) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Type a message...",
  className,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const [pendingMedias, setPendingMedias] = useState<SendMessageMediaUpload[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFileMutation();

  const canSend = (text.trim().length > 0 || pendingMedias.length > 0) && !disabled;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    onSend({
      content: text.trim() || null,
      medias: pendingMedias.length > 0 ? pendingMedias : undefined,
    });
    setText("");
    setPendingMedias([]);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
        "flex flex-col gap-2 rounded-xl border bg-card p-2 shadow-sm ring-1 ring-foreground/5",
        className
      )}
    >
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
              onChange={(e) => setText(e.target.value)}
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
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 shrink-0"
              disabled={disabled || pendingMedias.length >= MAX_MEDIAS}
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
