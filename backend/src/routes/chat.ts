import { Elysia } from "elysia";
import { prisma } from "../db/prisma";
import { authPlugin } from "../plugins/auth.plugin";
import { ChatType } from "../../prisma/generated/prisma/enums";
import { notify } from "../lib/notify";

const R2_PUBLIC_BASE_URL = (process.env.R2_PUBLIC_BASE_URL ?? "").replace(/\/$/, "");
const ALLOWED_MEDIA_MIMETYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const;

function isAllowedMimetype(m: string): boolean {
  if (ALLOWED_MEDIA_MIMETYPES.includes(m as any)) return true;
  if (m.startsWith("image/") || m.startsWith("video/")) return true;
  return false;
}

function isAllowedMediaUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  if (R2_PUBLIC_BASE_URL && url.startsWith(R2_PUBLIC_BASE_URL)) return true;
  if (url.startsWith("/") && !url.startsWith("//")) return true;
  return false;
}

type ChatAccess =
  | { ok: true; chatId: string; type: "org"; organizationId: string }
  | { ok: true; chatId: string; type: "dm"; participant1Id: string; participant2Id: string }
  | { ok: false; status: 403 | 404; message: string };

async function resolveChatAccess(
  chatId: string,
  userId: string,
  activeOrganizationId: string | null
): Promise<ChatAccess> {
  if (!chatId || typeof chatId !== "string" || chatId.length > 200) {
    return { ok: false, status: 404, message: "Chat not found" };
  }
  const isDm = chatId.includes("-");
  if (isDm) {
    const parts = chatId.split("-").filter(Boolean);
    if (parts.length !== 2) {
      return { ok: false, status: 404, message: "Chat not found" };
    }
    const [p1, p2] = parts;
    if (p1 !== userId && p2 !== userId) {
      return { ok: false, status: 403, message: "Access denied" };
    }
    return {
      ok: true,
      chatId,
      type: "dm",
      participant1Id: p1,
      participant2Id: p2,
    };
  }
  const member = await prisma.member.findFirst({
    where: { userId, organizationId: chatId },
  });
  if (!member) {
    return { ok: false, status: 403, message: "Access denied" };
  }
  return {
    ok: true,
    chatId,
    type: "org",
    organizationId: chatId,
  };
}

async function ensureChatExists(access: Extract<ChatAccess, { ok: true }>) {
  let chat = await prisma.chat.findUnique({ where: { id: access.chatId } });
  if (chat) return chat;
  if (access.type === "org") {
    chat = await prisma.chat.create({
      data: {
        id: access.chatId,
        type: ChatType.ORG,
        organizationId: access.organizationId,
      },
    });
  } else {
    chat = await prisma.chat.create({
      data: {
        id: access.chatId,
        type: ChatType.DM,
        participant1Id: access.participant1Id,
        participant2Id: access.participant2Id,
      },
    });
  }
  return chat;
}

const jsonResponse = (body: object, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const messageInclude = {
  sender: { select: { id: true, name: true, email: true, image: true } },
  medias: true,
  reactions: { select: { emoji: true, userId: true, user: { select: { name: true } } } },
  replyTo: {
    select: {
      id: true,
      content: true,
      senderUserId: true,
      sender: { select: { id: true, name: true } },
    },
  },
  _count: { select: { replies: true } },
} as const;

// Typing indicators are ephemeral — in-memory is enough for a single-process backend.
// ponytail: moves to Redis/WebSocket if the backend ever runs multi-process
const typingState = new Map<string, Map<string, { name: string; at: number }>>();
const TYPING_TTL_MS = 5000;

function setTyping(chatId: string, userId: string, name: string) {
  let chat = typingState.get(chatId);
  if (!chat) {
    chat = new Map();
    typingState.set(chatId, chat);
  }
  chat.set(userId, { name, at: Date.now() });
}

function getTyping(chatId: string, excludeUserId: string): { userId: string; name: string }[] {
  const chat = typingState.get(chatId);
  if (!chat) return [];
  const now = Date.now();
  const out: { userId: string; name: string }[] = [];
  for (const [userId, v] of chat) {
    if (now - v.at > TYPING_TTL_MS) {
      chat.delete(userId);
      continue;
    }
    if (userId !== excludeUserId) out.push({ userId, name: v.name });
  }
  return out;
}

export const chatRoutes = new Elysia({ prefix: "/chat" })
  .use(authPlugin)
  // Unread counts across chats (for sidebar badges). chatIds is comma-separated.
  .get(
    "/unread-counts",
    async ({ user, query }) => {
      if (!user?.id) return jsonResponse({ message: "Unauthorized" }, 401);
      const raw = typeof query?.chatIds === "string" ? query.chatIds : "";
      const chatIds = raw.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 50);
      if (chatIds.length === 0) return {};
      const accessible: string[] = [];
      for (const chatId of chatIds) {
        const access = await resolveChatAccess(chatId, user.id, null);
        if (access.ok) accessible.push(chatId);
      }
      const reads = await prisma.chatRead.findMany({
        where: { userId: user.id, chatId: { in: accessible } },
      });
      const readAt = new Map(reads.map((r) => [r.chatId, r.lastReadAt]));
      const counts: Record<string, number> = {};
      await Promise.all(
        accessible.map(async (chatId) => {
          counts[chatId] = await prisma.message.count({
            where: {
              chatId,
              senderUserId: { not: user.id },
              replyToId: null, // thread replies don't bump the main unread badge
              ...(readAt.get(chatId) ? { createdAt: { gt: readAt.get(chatId)! } } : {}),
            },
          });
        })
      );
      return counts;
    },
    { requireAuth: true }
  )
  .get(
    "/:chatId",
    async ({ user, params }) => {
      if (!user?.id) {
        return jsonResponse({ message: "Unauthorized" }, 401);
      }
      const chatId = params?.chatId;
      const access = await resolveChatAccess(chatId, user.id, null);
      if (!access.ok) {
        return jsonResponse({ message: access.message }, access.status);
      }
      const chat = await prisma.chat.findUnique({
        where: { id: access.chatId },
        select: {
          id: true,
          type: true,
          organizationId: true,
          participant1Id: true,
          participant2Id: true,
          createdAt: true,
        },
      });
      if (!chat) {
        return jsonResponse({ message: "Chat not found" }, 404);
      }
      return chat;
    },
    { requireAuth: true }
  )
  .get(
    "/:chatId/messages",
    async ({ user, params, query }) => {
      if (!user?.id) {
        return jsonResponse({ message: "Unauthorized" }, 401);
      }
      const chatId = params?.chatId;
      const access = await resolveChatAccess(chatId, user.id, null);
      if (!access.ok) {
        return jsonResponse({ message: access.message }, access.status);
      }
      const limit = Math.min(100, Math.max(1, Number(query?.limit) || 100));
      const cursor = typeof query?.cursor === "string" && query.cursor.trim() !== "" ? query.cursor.trim() : undefined;
      // `after` = incremental polling: only messages newer than this id, ascending
      const after = typeof query?.after === "string" && query.after.trim() !== "" ? query.after.trim() : undefined;
      const chat = await prisma.chat.findUnique({ where: { id: access.chatId } });
      if (!chat) {
        return { data: [], nextCursor: null };
      }
      if (after) {
        const anchor = await prisma.message.findFirst({ where: { id: after, chatId: chat.id }, select: { createdAt: true } });
        const data = await prisma.message.findMany({
          where: { chatId: chat.id, ...(anchor ? { createdAt: { gt: anchor.createdAt } } : {}) },
          include: messageInclude,
          orderBy: { createdAt: "asc" },
          take: limit,
        });
        return { data, nextCursor: null };
      }
      const messages = await prisma.message.findMany({
        where: { chatId: chat.id },
        include: messageInclude,
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        ...(cursor
          ? {
            cursor: { id: cursor },
            skip: 1,
          }
          : {}),
      });
      const hasMore = messages.length > limit;
      const list = hasMore ? messages.slice(0, limit) : messages;
      const chronological = list.reverse();
      const nextCursor = hasMore && chronological.length > 0 ? chronological[0].id : null;
      return {
        data: chronological,
        nextCursor,
      };
    },
    { requireAuth: true }
  )
  .post(
    "/:chatId/messages",
    async ({ user, params, body }) => {
      if (!user?.id) {
        return jsonResponse({ message: "Unauthorized" }, 401);
      }
      const chatId = params?.chatId;
      const access = await resolveChatAccess(chatId, user.id, null);
      if (!access.ok) {
        return jsonResponse({ message: access.message }, access.status);
      }
      // Accept either upload response shape (url, fileName, fileType, fileSize) or (url, mimetype, size)
      type MediaInput =
        | { url: string; mimetype: string; size: number }
        | { url: string; fileName: string; fileType: string; fileSize: number };
      const b = body as { content?: string; medias?: MediaInput[]; replyToId?: string; mentionUserIds?: string[] };
      const content = typeof b.content === "string" ? b.content.trim() || null : null;
      const rawMedias = Array.isArray(b.medias) ? b.medias : [];
      const medias = rawMedias
        .filter((m): m is MediaInput => m != null && typeof m === "object" && typeof m.url === "string")
        .slice(0, 10)
        .map((m) => {
          const url = m.url;
          const mimetype = "mimetype" in m ? m.mimetype : m.fileType;
          const size = "size" in m ? m.size : m.fileSize;
          return { url, mimetype, size };
        })
        .filter(
          (m) =>
            isAllowedMediaUrl(m.url) &&
            isAllowedMimetype(m.mimetype) &&
            typeof m.size === "number" &&
            m.size >= 0 &&
            m.size <= 100 * 1024 * 1024
        )
        .map((m) => ({ url: m.url, mimetype: m.mimetype, size: Math.floor(m.size) }));
      if (!content && medias.length === 0) {
        return jsonResponse({ message: "Message must have content or at least one valid media" }, 400);
      }
      const chat = await ensureChatExists(access);
      let replyToId: string | null = null;
      if (typeof b.replyToId === "string" && b.replyToId.trim() !== "") {
        const parent = await prisma.message.findFirst({
          where: { id: b.replyToId.trim(), chatId: chat.id },
          select: { id: true, replyToId: true },
        });
        // one thread level: replying to a reply attaches to the thread root
        replyToId = parent ? parent.replyToId ?? parent.id : null;
      }
      const mentionUserIds = Array.isArray(b.mentionUserIds)
        ? [...new Set(b.mentionUserIds.filter((id): id is string => typeof id === "string"))].slice(0, 20)
        : [];
      const message = await prisma.message.create({
        data: {
          chatId: chat.id,
          senderUserId: user.id,
          content,
          replyToId,
          mentionUserIds,
          medias:
            medias.length > 0
              ? {
                create: medias.map((m) => ({ url: m.url, mimetype: m.mimetype, size: m.size })),
              }
              : undefined,
        },
        include: messageInclude,
      });
      // typing indicator is stale the moment a message lands
      typingState.get(chat.id)?.delete(user.id);
      if (mentionUserIds.length > 0 && access.type === "org") {
        const mentionedMembers = await prisma.member.findMany({
          where: { organizationId: access.organizationId, userId: { in: mentionUserIds } },
          select: { id: true },
        });
        const actor = await prisma.member.findFirst({
          where: { organizationId: access.organizationId, userId: user.id },
          select: { id: true },
        });
        if (mentionedMembers.length > 0) {
          await notify({
            prisma,
            organizationId: access.organizationId,
            recipientIds: mentionedMembers.map((m) => m.id),
            actorId: actor?.id ?? null,
            type: "MENTION",
            title: "You were mentioned in chat",
            body: content?.slice(0, 140) ?? "Shared a file",
            link: `/chat/${chat.id}`,
          });
        }
      }
      return message;
    },
    { requireAuth: true }
  )
  .patch(
    "/:chatId/messages/:messageId",
    async ({ user, params, body }) => {
      if (!user?.id) return jsonResponse({ message: "Unauthorized" }, 401);
      const access = await resolveChatAccess(params.chatId, user.id, null);
      if (!access.ok) return jsonResponse({ message: access.message }, access.status);
      const b = body as { content?: string };
      const content = typeof b.content === "string" ? b.content.trim() : "";
      if (!content) return jsonResponse({ message: "Content is required" }, 400);
      const message = await prisma.message.findFirst({
        where: { id: params.messageId, chatId: access.chatId },
      });
      if (!message) return jsonResponse({ message: "Message not found" }, 404);
      if (message.senderUserId !== user.id) return jsonResponse({ message: "You can only edit your own messages" }, 403);
      return prisma.message.update({
        where: { id: message.id },
        data: { content, editedAt: new Date() },
        include: messageInclude,
      });
    },
    { requireAuth: true }
  )
  .delete(
    "/:chatId/messages/:messageId",
    async ({ user, params }) => {
      if (!user?.id) return jsonResponse({ message: "Unauthorized" }, 401);
      const access = await resolveChatAccess(params.chatId, user.id, null);
      if (!access.ok) return jsonResponse({ message: access.message }, access.status);
      const message = await prisma.message.findFirst({
        where: { id: params.messageId, chatId: access.chatId },
      });
      if (!message) return jsonResponse({ message: "Message not found" }, 404);
      if (message.senderUserId !== user.id) return jsonResponse({ message: "You can only delete your own messages" }, 403);
      await prisma.message.delete({ where: { id: message.id } });
      return { ok: true };
    },
    { requireAuth: true }
  )
  // ─── Reactions ──────────────────────────────────
  .post(
    "/:chatId/messages/:messageId/reactions/toggle",
    async ({ user, params, body }) => {
      if (!user?.id) return jsonResponse({ message: "Unauthorized" }, 401);
      const access = await resolveChatAccess(params.chatId, user.id, null);
      if (!access.ok) return jsonResponse({ message: access.message }, access.status);
      const b = body as { emoji?: string };
      const emoji = typeof b.emoji === "string" ? b.emoji.trim().slice(0, 16) : "";
      if (!emoji) return jsonResponse({ message: "emoji is required" }, 400);
      const message = await prisma.message.findFirst({
        where: { id: params.messageId, chatId: access.chatId },
        select: { id: true },
      });
      if (!message) return jsonResponse({ message: "Message not found" }, 404);
      const existing = await prisma.messageReaction.findUnique({
        where: { messageId_userId_emoji: { messageId: message.id, userId: user.id, emoji } },
      });
      if (existing) {
        await prisma.messageReaction.delete({ where: { id: existing.id } });
        return { reacted: false, emoji };
      }
      await prisma.messageReaction.create({
        data: { messageId: message.id, userId: user.id, emoji },
      });
      return { reacted: true, emoji };
    },
    { requireAuth: true }
  )
  // ─── Pins ───────────────────────────────────────
  .post(
    "/:chatId/messages/:messageId/pin",
    async ({ user, params }) => {
      if (!user?.id) return jsonResponse({ message: "Unauthorized" }, 401);
      const access = await resolveChatAccess(params.chatId, user.id, null);
      if (!access.ok) return jsonResponse({ message: access.message }, access.status);
      const message = await prisma.message.findFirst({
        where: { id: params.messageId, chatId: access.chatId },
        select: { id: true, pinnedAt: true },
      });
      if (!message) return jsonResponse({ message: "Message not found" }, 404);
      const updated = await prisma.message.update({
        where: { id: message.id },
        data: { pinnedAt: message.pinnedAt ? null : new Date() },
        select: { id: true, pinnedAt: true },
      });
      return { pinned: updated.pinnedAt != null };
    },
    { requireAuth: true }
  )
  .get(
    "/:chatId/pinned",
    async ({ user, params }) => {
      if (!user?.id) return jsonResponse({ message: "Unauthorized" }, 401);
      const access = await resolveChatAccess(params.chatId, user.id, null);
      if (!access.ok) return jsonResponse({ message: access.message }, access.status);
      const data = await prisma.message.findMany({
        where: { chatId: access.chatId, pinnedAt: { not: null } },
        include: messageInclude,
        orderBy: { pinnedAt: "desc" },
        take: 50,
      });
      return { data };
    },
    { requireAuth: true }
  )
  // ─── Threads ────────────────────────────────────
  .get(
    "/:chatId/messages/:messageId/replies",
    async ({ user, params }) => {
      if (!user?.id) return jsonResponse({ message: "Unauthorized" }, 401);
      const access = await resolveChatAccess(params.chatId, user.id, null);
      if (!access.ok) return jsonResponse({ message: access.message }, access.status);
      const data = await prisma.message.findMany({
        where: { chatId: access.chatId, replyToId: params.messageId },
        include: messageInclude,
        orderBy: { createdAt: "asc" },
        take: 200,
      });
      return { data };
    },
    { requireAuth: true }
  )
  // ─── Read receipts ──────────────────────────────
  .post(
    "/:chatId/read",
    async ({ user, params }) => {
      if (!user?.id) return jsonResponse({ message: "Unauthorized" }, 401);
      const access = await resolveChatAccess(params.chatId, user.id, null);
      if (!access.ok) return jsonResponse({ message: access.message }, access.status);
      await ensureChatExists(access);
      const read = await prisma.chatRead.upsert({
        where: { chatId_userId: { chatId: access.chatId, userId: user.id } },
        update: { lastReadAt: new Date() },
        create: { chatId: access.chatId, userId: user.id },
      });
      return { ok: true, lastReadAt: read.lastReadAt };
    },
    { requireAuth: true }
  )
  .get(
    "/:chatId/reads",
    async ({ user, params }) => {
      if (!user?.id) return jsonResponse({ message: "Unauthorized" }, 401);
      const access = await resolveChatAccess(params.chatId, user.id, null);
      if (!access.ok) return jsonResponse({ message: access.message }, access.status);
      const data = await prisma.chatRead.findMany({
        where: { chatId: access.chatId },
        include: { user: { select: { id: true, name: true, image: true } } },
      });
      return { data };
    },
    { requireAuth: true }
  )
  // ─── Typing ─────────────────────────────────────
  .post(
    "/:chatId/typing",
    async ({ user, params }) => {
      if (!user?.id) return jsonResponse({ message: "Unauthorized" }, 401);
      const access = await resolveChatAccess(params.chatId, user.id, null);
      if (!access.ok) return jsonResponse({ message: access.message }, access.status);
      setTyping(access.chatId, user.id, user.name ?? "Someone");
      return { ok: true };
    },
    { requireAuth: true }
  )
  .get(
    "/:chatId/typing",
    async ({ user, params }) => {
      if (!user?.id) return jsonResponse({ message: "Unauthorized" }, 401);
      const access = await resolveChatAccess(params.chatId, user.id, null);
      if (!access.ok) return jsonResponse({ message: access.message }, access.status);
      return { data: getTyping(access.chatId, user.id) };
    },
    { requireAuth: true }
  )
  // ─── Search ─────────────────────────────────────
  .get(
    "/:chatId/search",
    async ({ user, params, query }) => {
      if (!user?.id) return jsonResponse({ message: "Unauthorized" }, 401);
      const access = await resolveChatAccess(params.chatId, user.id, null);
      if (!access.ok) return jsonResponse({ message: access.message }, access.status);
      const q = typeof query?.q === "string" ? query.q.trim() : "";
      if (q.length < 2) return { data: [] };
      const data = await prisma.message.findMany({
        where: { chatId: access.chatId, content: { contains: q, mode: "insensitive" } },
        include: messageInclude,
        orderBy: { createdAt: "desc" },
        take: 30,
      });
      return { data };
    },
    { requireAuth: true }
  );
