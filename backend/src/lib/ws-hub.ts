/**
 * Org-scoped realtime hub. A single in-memory registry of open sockets keyed by
 * user; publishers fan out chat messages, typing, notifications and presence.
 * ponytail: single-process only — swap the Set for Redis pub/sub to scale out
 * (each instance would subscribe and relay to its own local sockets).
 */

export type LiveEvent =
  | { type: "chat:message"; chatId: string; message: unknown }
  | { type: "chat:typing"; chatId: string; userId: string; name: string }
  | { type: "chat:read"; chatId: string; userId: string }
  | { type: "notification" }
  | { type: "presence"; online: string[] };

type Conn = {
  userId: string;
  orgId: string | null;
  send: (data: string) => void;
};

const conns = new Set<Conn>();

export function addConn(conn: Conn): () => void {
  conns.add(conn);
  return () => {
    conns.delete(conn);
  };
}

export function publishToUsers(userIds: Iterable<string>, event: LiveEvent, exceptUserId?: string): void {
  const targets = new Set(userIds);
  const payload = JSON.stringify(event);
  for (const c of conns) {
    if (c.userId !== exceptUserId && targets.has(c.userId)) c.send(payload);
  }
}

export function publishToOrg(orgId: string, event: LiveEvent, exceptUserId?: string): void {
  const payload = JSON.stringify(event);
  for (const c of conns) {
    if (c.orgId === orgId && c.userId !== exceptUserId) c.send(payload);
  }
}

/** Distinct user ids that currently hold at least one open socket in the org. */
export function onlineUserIds(orgId: string): string[] {
  const set = new Set<string>();
  for (const c of conns) {
    if (c.orgId === orgId) set.add(c.userId);
  }
  return [...set];
}

/** Broadcast the current online snapshot to everyone in the org. */
export function broadcastPresence(orgId: string): void {
  publishToOrg(orgId, { type: "presence", online: onlineUserIds(orgId) });
}
