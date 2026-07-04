"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageItem } from "@/components/chat/message-item";
import { ChatInput } from "@/components/chat/chat-input";
import { useReplies, useSendMessage, type Message, type SendMessagePayload } from "@/services/chat";

export function ThreadPanel({
  chatId,
  rootMessage,
  currentUserId,
  onClose,
}: {
  chatId: string;
  rootMessage: Message | null;
  currentUserId: string | null;
  onClose: () => void;
}) {
  // replies attach to the thread root, so resolve it if we opened from a reply
  const rootId = rootMessage ? rootMessage.replyToId ?? rootMessage.id : null;
  const { data, isPending } = useReplies(chatId, rootId);
  const sendMessage = useSendMessage();

  const handleSend = (payload: SendMessagePayload) => {
    if (!rootId) return;
    sendMessage.mutate({ chatId, payload: { ...payload, replyToId: rootId } });
  };

  return (
    <Sheet open={!!rootMessage} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="text-base">Thread</SheetTitle>
          <SheetDescription className="sr-only">Replies to this message</SheetDescription>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
          {rootMessage && (
            <MessageItem
              message={rootMessage.replyToId && rootMessage.replyTo ? rootMessage : rootMessage}
              isOwn={rootMessage.senderUserId === currentUserId}
              currentUserId={currentUserId}
              inThread
            />
          )}
          <div className="my-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            {data?.data.length ?? 0} {(data?.data.length ?? 0) === 1 ? "reply" : "replies"}
            <span className="h-px flex-1 bg-border" />
          </div>
          {isPending ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            (data?.data ?? []).map((m) => (
              <MessageItem
                key={m.id}
                message={m}
                isOwn={m.senderUserId === currentUserId}
                currentUserId={currentUserId}
                inThread
              />
            ))
          )}
        </div>
        <div className="border-t p-3">
          <ChatInput
            chatId={chatId}
            onSend={handleSend}
            disabled={sendMessage.isPending}
            placeholder="Reply in thread…"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
