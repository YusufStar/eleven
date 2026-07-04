"use client";

import { useRef, useEffect, useCallback, useState, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useChatMessagesInfinite,
  flattenChatMessagesInfinite,
  useMarkChatRead,
  useTypingUsers,
  useChatReads,
  type Message,
} from "@/services/chat";
import { MessageItem } from "./message-item";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { initials } from "@/lib/string";
import { cn } from "@/lib/utils";

const AT_BOTTOM_THRESHOLD = 80;
const LOAD_MORE_TOP_THRESHOLD = 120;

export interface ChatListProps {
  chatId: string;
  currentUserId: string | null;
  onOpenThread?: (message: Message) => void;
  className?: string;
}

export function ChatList({
  chatId,
  currentUserId,
  onOpenThread,
  className,
}: ChatListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const {
    data,
    isPending,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useChatMessagesInfinite(chatId, { pageSize: 100 });
  const markRead = useMarkChatRead();
  const { data: typingData } = useTypingUsers(chatId);
  const { data: readsData } = useChatReads(chatId);

  // thread replies live in the thread panel, not the main stream
  const messages = (data ? flattenChatMessagesInfinite(data) : []).filter((m) => !m.replyToId);
  const typingUsers = typingData?.data ?? [];
  const prevPagesLengthRef = useRef(0);
  const prevScrollHeightRef = useRef(0);
  const [atBottom, setAtBottom] = useState(true);
  const [showNewMessageButton, setShowNewMessageButton] = useState(false);
  const lastMessageCountRef = useRef(0);
  const lastMarkedIdRef = useRef<string | null>(null);

  const checkAtBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const nearBottom =
      scrollHeight - scrollTop - clientHeight < AT_BOTTOM_THRESHOLD;
    setAtBottom(nearBottom);
    if (nearBottom) setShowNewMessageButton(false);
  }, []);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
    setShowNewMessageButton(false);
    setAtBottom(true);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      checkAtBottom();
      if (hasNextPage && !isFetchingNextPage) {
        const { scrollTop } = el;
        if (scrollTop < LOAD_MORE_TOP_THRESHOLD) fetchNextPage();
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, checkAtBottom]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || !data?.pages.length) return;
    const newPagesLength = data.pages.length;
    if (newPagesLength > prevPagesLengthRef.current && prevPagesLengthRef.current > 0) {
      const added = el.scrollHeight - prevScrollHeightRef.current;
      if (added > 0) el.scrollTop += added;
    }
    prevPagesLengthRef.current = newPagesLength;
    prevScrollHeightRef.current = el.scrollHeight;
  }, [data?.pages.length]);


  useEffect(() => {
    const count = messages.length;
    if (count > lastMessageCountRef.current) {
      if (lastMessageCountRef.current > 0) {
        if (atBottom) scrollToBottom();
        else setShowNewMessageButton(true);
      }
      lastMessageCountRef.current = count;
    }
  }, [messages.length, atBottom, scrollToBottom]);

  useEffect(() => {
    if (atBottom && messages.length > 0)
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length, atBottom]);

  // read receipt: mark read when viewing the latest message at the bottom
  useEffect(() => {
    if (!atBottom || messages.length === 0) return;
    const lastId = messages[messages.length - 1].id;
    if (lastMarkedIdRef.current === lastId) return;
    lastMarkedIdRef.current = lastId;
    markRead.mutate(chatId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atBottom, messages.length, chatId]);

  // who has read the latest message (excluding me)
  const lastMessage = messages[messages.length - 1];
  const seenBy = (readsData?.data ?? []).filter(
    (r) =>
      r.userId !== currentUserId &&
      lastMessage &&
      new Date(r.lastReadAt) >= new Date(lastMessage.createdAt),
  );

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 text-destructive text-sm">
        {String((error as Error).message)}
      </div>
    );
  }

  return (
    <div className={cn("relative flex min-h-0 flex-1 flex-col overflow-hidden", className)}>
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-4">
        {isPending ? (
          <div className="flex flex-col gap-4 p-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full max-w-[85%]" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <span className="text-3xl">👋</span>
            <p className="text-sm text-muted-foreground">No messages yet — say hi!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 px-2 py-1">
            {messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                isOwn={message.senderUserId === currentUserId}
                currentUserId={currentUserId}
                onReply={onOpenThread}
                onOpenThread={onOpenThread}
              />
            ))}
          </div>
        )}
        {isFetchingNextPage ? (
          <div className="flex justify-center py-2">
            <Skeleton className="h-8 w-32" />
          </div>
        ) : null}
      </div>

      {/* typing indicator + read receipts */}
      <div className="flex h-6 shrink-0 items-center justify-between px-3 text-xs text-muted-foreground">
        <AnimatePresence>
          {typingUsers.length > 0 && (
            <motion.span
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="flex items-center gap-1.5"
            >
              <span className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="size-1 rounded-full bg-muted-foreground"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </span>
              {typingUsers.map((u) => u.name).join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing…
            </motion.span>
          )}
        </AnimatePresence>
        {seenBy.length > 0 && (
          <span className="ml-auto flex items-center gap-1">
            Seen by
            <span className="flex -space-x-1">
              {seenBy.slice(0, 5).map((r) => (
                <Avatar key={r.id} className="size-4 ring-1 ring-background" title={r.user.name}>
                  <AvatarImage src={r.user.image ?? undefined} alt={r.user.name} />
                  <AvatarFallback className="text-[7px]">{initials(r.user.name)}</AvatarFallback>
                </Avatar>
              ))}
            </span>
          </span>
        )}
      </div>

      <AnimatePresence>
        {showNewMessageButton && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute bottom-10 right-6 z-10"
          >
            <Button
              size="sm"
              onClick={scrollToBottom}
              className="shadow-md"
            >
              <HugeiconsIcon icon={ArrowDown01Icon} className="mr-1 size-4" />
              New messages
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
