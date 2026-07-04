import type {
  Chat,
  ChatMessagesParams,
  ChatMessagesResponse,
  ChatRead,
  Message,
  SendMessagePayload,
  TypingUser,
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
  if (params?.after != null && params.after !== "") u.searchParams.set("after", params.after);
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

  editMessage: (chatId: string, messageId: string, content: string) =>
    request<Message>(`/chat/${chatId}/messages/${messageId}`, {
      method: "PATCH",
      body: JSON.stringify({ content }),
    }),

  deleteMessage: (chatId: string, messageId: string) =>
    request<{ ok: boolean }>(`/chat/${chatId}/messages/${messageId}`, { method: "DELETE" }),

  toggleReaction: (chatId: string, messageId: string, emoji: string) =>
    request<{ reacted: boolean; emoji: string }>(`/chat/${chatId}/messages/${messageId}/reactions/toggle`, {
      method: "POST",
      body: JSON.stringify({ emoji }),
    }),

  togglePin: (chatId: string, messageId: string) =>
    request<{ pinned: boolean }>(`/chat/${chatId}/messages/${messageId}/pin`, { method: "POST" }),

  getPinned: (chatId: string) => request<{ data: Message[] }>(`/chat/${chatId}/pinned`),

  getReplies: (chatId: string, messageId: string) =>
    request<{ data: Message[] }>(`/chat/${chatId}/messages/${messageId}/replies`),

  markRead: (chatId: string) =>
    request<{ ok: boolean; lastReadAt: string }>(`/chat/${chatId}/read`, { method: "POST" }),

  getReads: (chatId: string) => request<{ data: ChatRead[] }>(`/chat/${chatId}/reads`),

  postTyping: (chatId: string) => request<{ ok: boolean }>(`/chat/${chatId}/typing`, { method: "POST" }),

  getTyping: (chatId: string) => request<{ data: TypingUser[] }>(`/chat/${chatId}/typing`),

  search: (chatId: string, q: string) =>
    request<{ data: Message[] }>(`/chat/${chatId}/search?q=${encodeURIComponent(q)}`),

  unreadCounts: (chatIds: string[]) =>
    request<Record<string, number>>(`/chat/unread-counts?chatIds=${encodeURIComponent(chatIds.join(","))}`),
};
