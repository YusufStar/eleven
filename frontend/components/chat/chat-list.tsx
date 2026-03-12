"use client";

import { useRef, useEffect, useCallback, useState, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useChatMessagesInfinite,
  flattenChatMessagesInfinite,
} from "@/services/chat";
import { QuestionCard } from "./question-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

const AT_BOTTOM_THRESHOLD = 80;
const LOAD_MORE_TOP_THRESHOLD = 120;

export interface ChatListProps {
  chatId: string;
  currentUserId: string | null;
  className?: string;
}

export function ChatList({
  chatId,
  currentUserId,
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

  const messages = data ? flattenChatMessagesInfinite(data) : [];
  const prevPagesLengthRef = useRef(0);
  const prevScrollHeightRef = useRef(0);
  const [atBottom, setAtBottom] = useState(true);
  const [showNewMessageButton, setShowNewMessageButton] = useState(false);
  const lastMessageCountRef = useRef(0);

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
        ) : (
          <div className="flex flex-col gap-4 px-2 py-1">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0.6 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
              >
                <QuestionCard
                  message={message}
                  isOwn={message.senderUserId === currentUserId}
                />
              </motion.div>
            ))}
          </div>
        )}
        {isFetchingNextPage ? (
          <div className="flex justify-center py-2">
            <Skeleton className="h-8 w-32" />
          </div>
        ) : null}
      </div>

      <AnimatePresence>
        {showNewMessageButton && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute bottom-6 right-6 z-10"
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
