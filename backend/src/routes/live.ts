import { Elysia } from "elysia";
import { prisma } from "../db/prisma";
import { authPlugin } from "../plugins/auth.plugin";
import { addConn, broadcastPresence, onlineUserIds, publishToOrg, publishToUsers } from "../lib/ws-hub";

/**
 * Single realtime channel for the app: chat messages, typing, notifications
 * and presence. Auth is derived from the session cookie by authPlugin (same as
 * the meet signaling socket). Clients that can't hold a socket fall back to the
 * existing HTTP polling — nothing here is the only source of truth.
 */

type ClientMessage = { type: "typing"; chatId: string };

const MAX_MESSAGE_BYTES = 4 * 1024;

/** Who should hear typing in this chat? org chat → the org; DM → the two users. */
function typingTargets(
  chatId: string,
  conn: { userId: string; orgId: string | null },
  name: string,
): void {
  if (chatId.includes("-")) {
    const parts = chatId.split("-").filter(Boolean);
    if (parts.length !== 2 || !parts.includes(conn.userId)) return;
    publishToUsers(parts, { type: "chat:typing", chatId, userId: conn.userId, name }, conn.userId);
    return;
  }
  // org chat: chatId is the organization id — only the user's own org
  if (chatId !== conn.orgId) return;
  publishToOrg(chatId, { type: "chat:typing", chatId, userId: conn.userId, name }, conn.userId);
}

export const liveRoutes = new Elysia()
  .use(authPlugin)
  .ws("/ws/live", {
    open(ws) {
      const { user, activeOrganizationId, activeMember } = ws.data as unknown as {
        user: { id: string; name: string } | null;
        activeOrganizationId: string | null;
        activeMember: { id: string } | null;
      };
      if (!user) {
        ws.close(4401, "Unauthorized");
        return;
      }
      const conn = {
        userId: user.id,
        orgId: activeOrganizationId,
        name: user.name ?? "Someone",
        send: (data: string) => ws.send(data),
      };
      (ws.data as Record<string, unknown>).conn = conn;
      (ws.data as Record<string, unknown>).remove = addConn(conn);

      if (activeOrganizationId) {
        // this socket gets the current snapshot; everyone else learns this user is online
        ws.send(JSON.stringify({ type: "presence", online: onlineUserIds(activeOrganizationId) }));
        broadcastPresence(activeOrganizationId);
      }
      if (activeMember) {
        prisma.member
          .update({ where: { id: activeMember.id }, data: { lastSeenAt: new Date() } })
          .catch(() => {});
      }
    },

    message(ws, raw) {
      const data = ws.data as unknown as {
        conn?: { userId: string; orgId: string | null; name: string };
      };
      const conn = data.conn;
      if (!conn) return;
      const text = typeof raw === "string" ? raw : JSON.stringify(raw);
      if (text.length > MAX_MESSAGE_BYTES) return;
      let msg: ClientMessage;
      try {
        msg = (typeof raw === "string" ? JSON.parse(raw) : raw) as ClientMessage;
      } catch {
        return;
      }
      if (msg.type === "typing" && typeof msg.chatId === "string" && msg.chatId.length <= 200) {
        typingTargets(msg.chatId, conn, conn.name);
      }
    },

    close(ws) {
      const data = ws.data as unknown as {
        remove?: () => void;
        conn?: { orgId: string | null };
      };
      data.remove?.();
      if (data.conn?.orgId) broadcastPresence(data.conn.orgId);
    },
  });
