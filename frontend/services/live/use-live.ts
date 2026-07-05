"use client";

import * as React from "react";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { chatQueryKeys, mergeChatMessages, type Message } from "@/services/chat";
import { setLiveSocket, liveWsUrl } from "./socket";

type LiveEvent =
  | { type: "chat:message"; chatId: string; message: Message }
  | { type: "chat:typing"; chatId: string; userId: string; name: string }
  | { type: "chat:read"; chatId: string; userId: string }
  | { type: "notification" }
  | { type: "presence"; online: string[] };

const PRESENCE_KEY = ["presence", "online"] as const;
const TYPING_TTL_MS = 4000;

/** Live online-user snapshot pushed over the socket. Empty until first event.
 *  Reads straight from the cache key the channel writes; re-renders on update. */
export function useOnlineUsers(): Set<string> {
  const { data } = useQuery<string[]>({
    queryKey: PRESENCE_KEY,
    queryFn: () => [],
    enabled: false,
    initialData: [],
    staleTime: Infinity,
  });
  return React.useMemo(() => new Set(data), [data]);
}

function injectTyping(queryClient: QueryClient, chatId: string, userId: string, name: string) {
  const key = [...chatQueryKeys.all, "typing", chatId];
  type Typing = { data: { userId: string; name: string }[] };
  queryClient.setQueryData<Typing>(key, (old) => {
    const others = (old?.data ?? []).filter((t) => t.userId !== userId);
    return { data: [...others, { userId, name }] };
  });
  const timers = typingTimers();
  const tk = `${chatId}:${userId}`;
  if (timers.has(tk)) clearTimeout(timers.get(tk)!);
  timers.set(
    tk,
    setTimeout(() => {
      queryClient.setQueryData<Typing>(key, (old) =>
        old ? { data: old.data.filter((t) => t.userId !== userId) } : old,
      );
      timers.delete(tk);
    }, TYPING_TTL_MS),
  );
}

let _typingTimers: Map<string, ReturnType<typeof setTimeout>> | null = null;
function typingTimers() {
  if (!_typingTimers) _typingTimers = new Map();
  return _typingTimers;
}

function handleEvent(queryClient: QueryClient, ev: LiveEvent) {
  switch (ev.type) {
    case "chat:message":
      mergeChatMessages(queryClient, ev.chatId, [ev.message]);
      queryClient.invalidateQueries({ queryKey: [...chatQueryKeys.all, "unread-counts"] });
      break;
    case "chat:typing":
      injectTyping(queryClient, ev.chatId, ev.userId, ev.name);
      break;
    case "chat:read":
      queryClient.invalidateQueries({ queryKey: [...chatQueryKeys.all, "reads", ev.chatId] });
      break;
    case "notification":
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      break;
    case "presence":
      queryClient.setQueryData(PRESENCE_KEY, ev.online);
      break;
  }
}

/**
 * Opens the app's realtime socket and routes events into the query cache.
 * Reconnects with backoff. HTTP polling stays in place as a fallback, so a
 * dropped socket only costs latency, never correctness.
 */
export function useLiveChannel(enabled: boolean) {
  const queryClient = useQueryClient();
  React.useEffect(() => {
    if (!enabled) return;
    const url = liveWsUrl();
    if (!url || typeof window === "undefined") return;

    let ws: WebSocket | null = null;
    let closed = false;
    let retry = 0;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (closed) return;
      ws = new WebSocket(url);
      setLiveSocket(ws);
      ws.onopen = () => {
        retry = 0;
      };
      ws.onmessage = (e) => {
        try {
          handleEvent(queryClient, JSON.parse(e.data) as LiveEvent);
        } catch {
          // malformed frame — ignore
        }
      };
      ws.onclose = () => {
        setLiveSocket(null);
        if (closed) return;
        // exponential backoff capped at 15s
        const delay = Math.min(15_000, 1000 * 2 ** retry);
        retry += 1;
        reconnectTimer = setTimeout(connect, delay);
      };
      ws.onerror = () => {
        ws?.close();
      };
    };

    connect();
    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      setLiveSocket(null);
      ws?.close();
    };
  }, [enabled, queryClient]);
}
