"use client";

import { usePresenceHeartbeat } from "@/services/team";

/** Invisible — keeps the member's lastSeenAt fresh while the app is open. */
export function PresenceHeartbeat() {
  usePresenceHeartbeat();
  return null;
}
