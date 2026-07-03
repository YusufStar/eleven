import { Elysia } from "elysia";
import { prisma } from "../db/prisma";
import { authPlugin } from "../plugins/auth.plugin";

export const notificationsRoutes = new Elysia({ prefix: "/notifications" })
  .use(authPlugin)
  .get(
    "/",
    async ({ activeMember, query }) => {
      const page = Math.max(1, Number(query?.page) || 1);
      const pageSize = Math.min(50, Math.max(1, Number(query?.pageSize) || 20));
      const unreadOnly = query?.unreadOnly === "true";
      const where = {
        recipientId: activeMember!.id,
        ...(unreadOnly && { readAt: null }),
      };
      const [data, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          include: {
            actor: {
              select: { id: true, user: { select: { name: true, image: true } } },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.notification.count({ where }),
      ]);
      return { data, total, page, pageSize };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .get(
    "/unread-count",
    async ({ activeMember }) => {
      const count = await prisma.notification.count({
        where: { recipientId: activeMember!.id, readAt: null },
      });
      return { count };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .post(
    "/:id/read",
    async ({ activeMember, params, set }) => {
      const { count } = await prisma.notification.updateMany({
        where: { id: params.id, recipientId: activeMember!.id, readAt: null },
        data: { readAt: new Date() },
      });
      if (count === 0) {
        set.status = 404;
        return { message: "Notification not found" };
      }
      return { ok: true };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .post(
    "/read-all",
    async ({ activeMember }) => {
      await prisma.notification.updateMany({
        where: { recipientId: activeMember!.id, readAt: null },
        data: { readAt: new Date() },
      });
      return { ok: true };
    },
    { requireAuth: true, requireActiveOrg: true }
  );
