import { Elysia } from "elysia";
import { prisma } from "../db/prisma";
import { authPlugin } from "../plugins/auth.plugin";

const CATEGORIES = ["task", "mention", "project", "meeting", "system"] as const;

export const notificationsRoutes = new Elysia({ prefix: "/notifications" })
  .use(authPlugin)
  .get(
    "/",
    async ({ activeMember, query }) => {
      const page = Math.max(1, Number(query?.page) || 1);
      const pageSize = Math.min(50, Math.max(1, Number(query?.pageSize) || 20));
      const unreadOnly = query?.unreadOnly === "true";
      const archived = query?.archived === "true";
      const category =
        typeof query?.category === "string" && (CATEGORIES as readonly string[]).includes(query.category)
          ? query.category
          : undefined;
      const where = {
        recipientId: activeMember!.id,
        ...(unreadOnly && { readAt: null }),
        ...(archived ? { archivedAt: { not: null } } : { archivedAt: null }),
        ...(category && { category }),
        // snoozed items stay hidden until their snooze expires
        ...(!archived && { OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: new Date() } }] }),
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
        where: {
          recipientId: activeMember!.id,
          readAt: null,
          archivedAt: null,
          OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: new Date() } }],
        },
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
  )
  .post(
    "/:id/archive",
    async ({ activeMember, params, body }) => {
      const b = body as { archived?: boolean } | undefined;
      const archive = b?.archived !== false;
      await prisma.notification.updateMany({
        where: { id: params.id, recipientId: activeMember!.id },
        data: { archivedAt: archive ? new Date() : null, ...(archive && { readAt: new Date() }) },
      });
      return { ok: true };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .post(
    "/:id/snooze",
    async ({ activeMember, params, body, set }) => {
      const b = body as { until?: string } | undefined;
      const until = b?.until ? new Date(b.until) : null;
      if (!until || isNaN(+until) || until <= new Date()) {
        set.status = 400;
        return { message: "until must be a future date" };
      }
      await prisma.notification.updateMany({
        where: { id: params.id, recipientId: activeMember!.id },
        data: { snoozedUntil: until, readAt: null },
      });
      return { ok: true };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  // ─── Preferences ────────────────────────────────
  .get(
    "/preferences",
    async ({ activeMember }) => {
      const pref = await prisma.notificationPreference.findUnique({
        where: { memberId: activeMember!.id },
      });
      return (
        pref ?? {
          memberId: activeMember!.id,
          categories: {},
          emailEnabled: true,
          pushEnabled: false,
          quietHoursStart: null,
          quietHoursEnd: null,
          digest: "off",
        }
      );
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .put(
    "/preferences",
    async ({ activeMember, body, set }) => {
      const b = body as {
        categories?: Record<string, { inApp?: boolean; email?: boolean }>;
        emailEnabled?: boolean;
        pushEnabled?: boolean;
        quietHoursStart?: number | null;
        quietHoursEnd?: number | null;
        digest?: string;
      };
      const hour = (v: unknown): number | null =>
        typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 23 ? v : null;
      const categories: Record<string, { inApp: boolean; email: boolean }> = {};
      if (b.categories && typeof b.categories === "object") {
        for (const cat of CATEGORIES) {
          const c = b.categories[cat];
          if (c && typeof c === "object") {
            categories[cat] = { inApp: c.inApp !== false, email: c.email !== false };
          }
        }
      }
      const digest = ["off", "daily", "weekly"].includes(b.digest ?? "") ? b.digest! : "off";
      if ((b.quietHoursStart == null) !== (b.quietHoursEnd == null)) {
        set.status = 400;
        return { message: "quietHoursStart and quietHoursEnd must be set together" };
      }
      const data = {
        categories,
        emailEnabled: b.emailEnabled !== false,
        pushEnabled: b.pushEnabled === true,
        quietHoursStart: hour(b.quietHoursStart),
        quietHoursEnd: hour(b.quietHoursEnd),
        digest,
      };
      const pref = await prisma.notificationPreference.upsert({
        where: { memberId: activeMember!.id },
        update: data,
        create: { memberId: activeMember!.id, ...data },
      });
      return pref;
    },
    { requireAuth: true, requireActiveOrg: true }
  );
