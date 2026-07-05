"use client";

import { useLiveChannel } from "@/services/live";

/** Invisible — owns the app's realtime WebSocket (chat, notifications, presence, typing). */
export function LiveChannel() {
  useLiveChannel(true);
  return null;
}
