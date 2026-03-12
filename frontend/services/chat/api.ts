import type {
  Chat,
  ChatMessagesParams,
  ChatMessagesResponse,
  Message,
  SendMessagePayload,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers as HeadersInit) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

function messagesPath(chatId: string, params?: ChatMessagesParams): string {
  const u = new URL(`/chat/${chatId}/messages`, "http://_");
  if (params?.limit != null) u.searchParams.set("limit", String(params.limit));
  if (params?.cursor != null && params.cursor !== "") u.searchParams.set("cursor", params.cursor);
  const search = u.search;
  return search ? `/chat/${chatId}/messages${search}` : `/chat/${chatId}/messages`;
}

export const chatApi = {
  getChat: (chatId: string) => request<Chat>(`/chat/${chatId}`),

  getMessages: (chatId: string, params?: ChatMessagesParams) =>
    request<ChatMessagesResponse>(messagesPath(chatId, params)),

  sendMessage: (chatId: string, payload: SendMessagePayload) =>
    request<Message>(`/chat/${chatId}/messages`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
