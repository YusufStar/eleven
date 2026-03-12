"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "./api";
import { chatQueryKeys } from "./query-keys";
import type { ChatMessagesParams, SendMessagePayload } from "./types";

export function useChat(chatId: string | null) {
  return useQuery({
    queryKey: chatQueryKeys.chat(chatId ?? ""),
    queryFn: () => chatApi.getChat(chatId!),
    enabled: !!chatId,
  });
}

const DEFAULT_POLL_INTERVAL_MS = 5000;

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
