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
import { initials } from "@/lib/string";
import { MarkdownView } from "@/components/ui/markdown-view";

export interface QuestionCardProps {
  message: Message;
  isOwn?: boolean;
  className?: string;
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
          "w-full max-w-[40%] shrink-0",
          isOwn && "ml-auto bg-primary/10 ring-primary/20",
          className
        )}
      >
        <CardHeader className="flex flex-row items-center gap-2 pb-1">
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
            <div className="mt-2 flex flex-wrap gap-2">
              {medias.map((m) => (
                <a
                  key={m.id}
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground text-xs underline"
                >
                  {m.mimetype?.startsWith("image/") ? (
                    <img
                      src={m.url}
                      alt=""
                      className="max-h-40 rounded object-cover"
                    />
                  ) : (
                    "Attachment"
                  )}
                </a>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}
