"use client";

import { authClient } from "@/lib/auth-client";

/** The current user's role in the active organization, with admin/owner helpers.
 *  Server routes (ours + better-auth) are the source of truth; this drives UI gating. */
export function useMyRole() {
  const { data } = authClient.useActiveMember();
  const raw = (data as { role?: string } | null)?.role ?? null;
  // better-auth may store comma-separated roles
  const roles = raw ? raw.split(",").map((r) => r.trim()) : [];
  const isOwner = roles.includes("owner");
  const isAdmin = isOwner || roles.includes("admin");
  return { role: raw, roles, isOwner, isAdmin };
}
