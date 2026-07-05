"use client";

/**
 * Module-level handle to the active live WebSocket so non-provider code (e.g. the
 * chat composer) can push small client→server messages without prop drilling.
 * The LiveChannel provider owns the lifecycle and sets/clears this.
 */

let socket: WebSocket | null = null;

export function setLiveSocket(ws: WebSocket | null) {
  socket = ws;
}

function send(data: unknown) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    try {
      socket.send(JSON.stringify(data));
    } catch {
      // socket closing mid-send — ignore, HTTP fallback still covers it
    }
  }
}

export function liveSendTyping(chatId: string) {
  send({ type: "typing", chatId });
}

export function liveWsUrl(): string | null {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";
  try {
    const u = new URL(base);
    u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
    u.pathname = "/ws/live";
    return u.toString();
  } catch {
    return null;
  }
}
