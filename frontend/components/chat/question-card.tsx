"use client";

import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Message } from "@/services/chat";
import type { MessageMedia } from "@/services/chat/types";
import { initials } from "@/lib/string";
import { MarkdownView } from "@/components/ui/markdown-view";
import Image from "next/image";
import { getFileTypeConfig } from "@/lib/file-types";
import { HugeiconsIcon } from "@hugeicons/react";

export interface QuestionCardProps {
  message: Message;
  isOwn?: boolean;
  className?: string;
}

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
      <a
        href={m.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block overflow-hidden rounded-lg"
      >
        {useNextImage ? (
          <Image
            src={m.url}
            alt=""
            width={400}
            height={300}
            className="max-h-72 w-auto rounded-lg object-contain"
            unoptimized={false}
          />
        ) : (
          <img
            src={m.url}
            alt=""
            className="max-h-72 w-auto rounded-lg object-contain"
          />
        )}
      </a>
    );
  }

  if (isVideo) {
    return (
      <div className="overflow-hidden rounded-lg">
        <video
          src={m.url}
          controls
          className="max-h-72 max-w-full rounded-lg object-contain"
          preload="metadata"
        />
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

export function QuestionCard({ message, isOwn, className }: QuestionCardProps) {
  const { sender, content, createdAt, medias } = message;
  const displayName = sender.name ?? sender.email ?? "Unknown";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="w-full"
    >
      <Card
        size="sm"
        className={cn(
          "w-full max-w-[40%] shrink-0 gap-2!",
          isOwn && "ml-auto bg-primary/10 ring-primary/20",
          className
        )}
      >
        <CardHeader className="flex flex-row items-center gap-2 pb-0!">
          <Avatar className="size-7 shrink-0">
            <AvatarImage src={sender.image ?? undefined} alt="" />
            <AvatarFallback className="text-xs">
              {initials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="truncate text-sm font-medium">{displayName}</span>
            <span className="text-muted-foreground text-xs shrink-0">
              {new Date(createdAt).toLocaleString()}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {content ? (
            <MarkdownView className="text-sm [&_.prose]:text-sm" content={content} />
          ) : null}
          {medias?.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-3">
              {medias.map((m) => (
                <MediaBlock key={m.id} m={m} />
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}
