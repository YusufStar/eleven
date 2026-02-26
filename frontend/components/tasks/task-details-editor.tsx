"use client";

import * as React from "react";
import { useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadModal } from "@/components/ui/upload-modal";
import { MarkdownView } from "@/components/ui/markdown-view";
import { HugeiconsIcon } from "@hugeicons/react";
import { Image01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

export type TaskDetailsEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
  disabled?: boolean;
};

function insertAtCursor(textarea: HTMLTextAreaElement | null, insert: string) {
  if (!textarea) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const before = textarea.value.slice(0, start);
  const after = textarea.value.slice(end);
  const newValue = before + insert + after;
  textarea.value = newValue;
  textarea.setSelectionRange(start + insert.length, start + insert.length);
  textarea.focus();
  return newValue;
}

export function TaskDetailsEditor({
  value,
  onChange,
  placeholder = "Write task details in Markdown. You can add **bold**, lists, and images.",
  minHeight = "12rem",
  className,
  disabled,
}: TaskDetailsEditorProps) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInsertImage = (url: string) => {
    const insert = `\n![image](${url})\n`;
    const newValue = insertAtCursor(textareaRef.current, insert);
    if (newValue !== undefined) onChange(newValue);
  };

  return (
    <>
      <UploadModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        title="Upload image for task details"
        onDrop={(_, __, url) => {
          if (url) handleInsertImage(url);
        }}
        accept={{ "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp"] }}
        maxFiles={1}
        maxSize={10 * 1024 * 1024}
      />
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">Task details (Markdown)</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setUploadOpen(true)}
            disabled={disabled}
          >
            <HugeiconsIcon icon={Image01Icon} className="size-4" strokeWidth={2} />
            Insert image
          </Button>
        </div>
        <Tabs defaultValue="write" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-[200px]">
            <TabsTrigger value="write">Write</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="write" className="mt-2">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              className="resize-y font-mono text-sm"
              style={{ minHeight }}
            />
          </TabsContent>
          <TabsContent value="preview" className="mt-2">
            <div
              className="rounded-lg border border-border bg-muted/30 p-3"
              style={{ minHeight }}
            >
              <MarkdownView content={value || ""} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
