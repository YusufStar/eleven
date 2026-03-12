import { Elysia } from "elysia";
import { prisma } from "../db/prisma";
import { authPlugin } from "../plugins/auth.plugin";
import { ChatType } from "../../prisma/generated/prisma/enums";

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

export const chatRoutes = new Elysia({ prefix: "/chat" })
  .use(authPlugin)
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
      const chat = await prisma.chat.findUnique({ where: { id: access.chatId } });
      if (!chat) {
        return { data: [], nextCursor: null };
      }
      const messages = await prisma.message.findMany({
        where: { chatId: chat.id },
        include: {
          sender: { select: { id: true, name: true, email: true, image: true } },
          medias: true,
        },
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
      const b = body as { content?: string; medias?: MediaInput[] };
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
      const message = await prisma.message.create({
        data: {
          chatId: chat.id,
          senderUserId: user.id,
          content,
          medias:
            medias.length > 0
              ? {
                create: medias.map((m) => ({ url: m.url, mimetype: m.mimetype, size: m.size })),
              }
              : undefined,
        },
        include: {
          sender: { select: { id: true, name: true, email: true, image: true } },
          medias: true,
        },
      });
      return message;
    },
    { requireAuth: true }
  );
