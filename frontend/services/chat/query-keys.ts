import type { ChatMessagesParams } from "./types";

export const chatQueryKeys = {
  all: ["chat"] as const,
  chat: (chatId: string) => [...chatQueryKeys.all, "detail", chatId] as const,
  messages: (chatId: string, params?: ChatMessagesParams) =>
    [...chatQueryKeys.all, "messages", chatId, params] as const,
};
