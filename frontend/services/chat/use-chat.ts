"use client";

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "./api";
import { chatQueryKeys } from "./query-keys";
import type { ChatMessagesParams, Message, SendMessagePayload } from "./types";

const DEFAULT_PAGE_SIZE = 100;

export function useChat(chatId: string | null) {
  return useQuery({
    queryKey: chatQueryKeys.chat(chatId ?? ""),
    queryFn: () => chatApi.getChat(chatId!),
    enabled: !!chatId,
  });
}

const DEFAULT_POLL_INTERVAL_MS = 5000;

export function useChatMessagesInfinite(
  chatId: string | null,
  options?: { pageSize?: number; refetchIntervalMs?: number }
) {
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  const refetchIntervalMs = options?.refetchIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  return useInfiniteQuery({
    queryKey: [...chatQueryKeys.messages(chatId ?? ""), "infinite", pageSize],
    queryFn: ({ pageParam }) =>
      chatApi.getMessages(chatId!, { limit: pageSize, cursor: pageParam ?? undefined }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    enabled: !!chatId,
    refetchInterval: refetchIntervalMs,
  });
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
    refetchInterval: refetchIntervalMs ?? DEFAULT_POLL_INTERVAL_MS,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chatId, payload }: { chatId: string; payload: SendMessagePayload }) =>
      chatApi.sendMessage(chatId, payload),
    onSuccess: (_, { chatId }) => {
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.messages(chatId) });
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.chat(chatId) });
    },
  });
}
