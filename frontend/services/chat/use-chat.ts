"use client";

import * as React from "react";
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { chatApi } from "./api";
import { chatQueryKeys } from "./query-keys";
import { liveSendTyping } from "@/services/live/socket";
import type { ChatMessagesParams, ChatMessagesResponse, Message, SendMessagePayload } from "./types";

const DEFAULT_PAGE_SIZE = 100;
// Incremental polling: history is fetched once via the infinite query, then a
// tiny `after=<lastId>` request every few seconds appends only new messages.
const LIVE_POLL_MS = 2500;

export function useChat(chatId: string | null) {
  return useQuery({
    queryKey: chatQueryKeys.chat(chatId ?? ""),
    queryFn: () => chatApi.getChat(chatId!),
    enabled: !!chatId,
  });
}

export const CHAT_DEFAULT_PAGE_SIZE = DEFAULT_PAGE_SIZE;

export function infiniteKey(chatId: string, pageSize: number = DEFAULT_PAGE_SIZE) {
  return [...chatQueryKeys.messages(chatId), "infinite", pageSize] as const;
}

/** Append new messages to the newest cached page, de-duping by id. Shared by the
 *  incremental poll and the WebSocket live channel so both stay idempotent. */
export function mergeChatMessages(
  queryClient: ReturnType<typeof useQueryClient>,
  chatId: string,
  incoming: Message[],
  pageSize: number = DEFAULT_PAGE_SIZE,
) {
  if (incoming.length === 0) return;
  queryClient.setQueryData<InfiniteData<ChatMessagesResponse>>(infiniteKey(chatId, pageSize), (old) => {
    if (!old || old.pages.length === 0) return old;
    const existing = new Set(old.pages.flatMap((p) => p.data.map((m) => m.id)));
    const fresh = incoming.filter((m) => !existing.has(m.id));
    if (fresh.length === 0) return old;
    const pages = [...old.pages];
    pages[0] = { ...pages[0], data: [...pages[0].data, ...fresh] };
    return { ...old, pages };
  });
}

export function useChatMessagesInfinite(
  chatId: string | null,
  options?: { pageSize?: number }
) {
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  const queryClient = useQueryClient();
  const query = useInfiniteQuery({
    queryKey: infiniteKey(chatId ?? "", pageSize),
    queryFn: ({ pageParam }) =>
      chatApi.getMessages(chatId!, { limit: pageSize, cursor: pageParam ?? undefined }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    enabled: !!chatId,
  });

  // newest message id across cached pages (pages[0] is the newest page)
  const latestId = React.useMemo(() => {
    const first = query.data?.pages[0]?.data;
    return first && first.length > 0 ? first[first.length - 1].id : null;
  }, [query.data]);

  // live tail: poll only messages after the newest cached id and merge them in
  React.useEffect(() => {
    if (!chatId) return;
    let stopped = false;
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await chatApi.getMessages(chatId, latestId ? { after: latestId, limit: 100 } : { limit: 1 });
        if (stopped || res.data.length === 0) return;
        mergeChatMessages(queryClient, chatId, res.data, pageSize);
      } catch {
        // transient poll errors are ignored; the next tick retries
      }
    };
    const timer = setInterval(tick, LIVE_POLL_MS);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [chatId, latestId, pageSize, queryClient]);

  return query;
}

/** Chronological list (oldest first) from infinite query. */
export function flattenChatMessagesInfinite(data: { pages: { data: Message[] }[] }): Message[] {
  return [...data.pages].reverse().flatMap((p) => p.data);
}

export function useChatMessages(
  chatId: string | null,
  params?: ChatMessagesParams & { refetchIntervalMs?: number }
) {
  const { refetchIntervalMs, ...apiParams } = params ?? {};
  return useQuery({
    queryKey: chatQueryKeys.messages(chatId ?? "", apiParams),
    queryFn: () => chatApi.getMessages(chatId!, apiParams),
    enabled: !!chatId,
    refetchInterval: refetchIntervalMs ?? 5000,
  });
}

function useInvalidateMessages() {
  const queryClient = useQueryClient();
  return (chatId: string) => {
    queryClient.invalidateQueries({ queryKey: chatQueryKeys.messages(chatId) });
  };
}

export function useSendMessage() {
  const invalidate = useInvalidateMessages();
  return useMutation({
    mutationFn: ({ chatId, payload }: { chatId: string; payload: SendMessagePayload }) =>
      chatApi.sendMessage(chatId, payload),
    onSuccess: (_, { chatId }) => invalidate(chatId),
  });
}

export function useEditMessage() {
  const invalidate = useInvalidateMessages();
  return useMutation({
    mutationFn: ({ chatId, messageId, content }: { chatId: string; messageId: string; content: string }) =>
      chatApi.editMessage(chatId, messageId, content),
    onSuccess: (_, { chatId }) => invalidate(chatId),
  });
}

export function useDeleteMessage() {
  const invalidate = useInvalidateMessages();
  return useMutation({
    mutationFn: ({ chatId, messageId }: { chatId: string; messageId: string }) =>
      chatApi.deleteMessage(chatId, messageId),
    onSuccess: (_, { chatId }) => invalidate(chatId),
  });
}

export function useToggleReaction() {
  const invalidate = useInvalidateMessages();
  return useMutation({
    mutationFn: ({ chatId, messageId, emoji }: { chatId: string; messageId: string; emoji: string }) =>
      chatApi.toggleReaction(chatId, messageId, emoji),
    onSuccess: (_, { chatId }) => invalidate(chatId),
  });
}

export function useTogglePin() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateMessages();
  return useMutation({
    mutationFn: ({ chatId, messageId }: { chatId: string; messageId: string }) =>
      chatApi.togglePin(chatId, messageId),
    onSuccess: (_, { chatId }) => {
      invalidate(chatId);
      queryClient.invalidateQueries({ queryKey: [...chatQueryKeys.all, "pinned", chatId] });
    },
  });
}

export function usePinnedMessages(chatId: string | null, enabled = true) {
  return useQuery({
    queryKey: [...chatQueryKeys.all, "pinned", chatId],
    queryFn: () => chatApi.getPinned(chatId!),
    enabled: !!chatId && enabled,
  });
}

export function useReplies(chatId: string | null, messageId: string | null) {
  return useQuery({
    queryKey: [...chatQueryKeys.all, "replies", chatId, messageId],
    queryFn: () => chatApi.getReplies(chatId!, messageId!),
    enabled: !!chatId && !!messageId,
    refetchInterval: 4000,
  });
}

export function useChatReads(chatId: string | null) {
  return useQuery({
    queryKey: [...chatQueryKeys.all, "reads", chatId],
    queryFn: () => chatApi.getReads(chatId!),
    enabled: !!chatId,
    refetchInterval: 15_000,
  });
}

export function useMarkChatRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chatId: string) => chatApi.markRead(chatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...chatQueryKeys.all, "unread-counts"] });
    },
  });
}

export function useTypingUsers(chatId: string | null) {
  return useQuery({
    queryKey: [...chatQueryKeys.all, "typing", chatId],
    queryFn: () => chatApi.getTyping(chatId!),
    enabled: !!chatId,
    refetchInterval: 2000,
  });
}

/** Returns a throttled "I am typing" notifier for the composer. */
export function useTypingNotifier(chatId: string | null) {
  const lastSent = React.useRef(0);
  return React.useCallback(() => {
    if (!chatId) return;
    const now = Date.now();
    if (now - lastSent.current < 2500) return;
    lastSent.current = now;
    liveSendTyping(chatId); // instant when the socket is up
    chatApi.postTyping(chatId).catch(() => {}); // HTTP fallback / cross-instance
  }, [chatId]);
}

export function useChatSearch(chatId: string | null, q: string) {
  return useQuery({
    queryKey: [...chatQueryKeys.all, "search", chatId, q],
    queryFn: () => chatApi.search(chatId!, q),
    enabled: !!chatId && q.trim().length >= 2,
  });
}

export function useUnreadCounts(chatIds: string[]) {
  return useQuery({
    queryKey: [...chatQueryKeys.all, "unread-counts", chatIds],
    queryFn: () => chatApi.unreadCounts(chatIds),
    enabled: chatIds.length > 0,
    refetchInterval: 10_000,
  });
}
