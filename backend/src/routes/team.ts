import { Elysia } from "elysia";
import { prisma } from "../db/prisma";
import { authPlugin } from "../plugins/auth.plugin";

export const teamRoutes = new Elysia({ prefix: "/team" })
  .use(authPlugin)
  .get(
    "/members",
    async ({ activeOrganizationId, query }) => {
      const page = Math.max(1, Number(query?.page) || 1);
      const pageSize = Math.min(100, Math.max(1, Number(query?.pageSize) || 10));
      const search = typeof query?.search === "string" ? query.search.trim() : "";
      const role = typeof query?.role === "string" && query.role !== "" && query.role !== "all" ? query.role : undefined;
      const skip = (page - 1) * pageSize;
      const where = {
        organizationId: activeOrganizationId!,
        ...(role && { role }),
        ...(search && {
          user: {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
          },
        }),
      };
      const [data, total] = await Promise.all([
        prisma.member.findMany({
          where,
          include: { user: { select: { id: true, name: true, email: true, image: true, githubProfile: { select: { githubLogin: true, avatarUrl: true } } } } },
          orderBy: { createdAt: "asc" },
          skip,
          take: pageSize,
        }),
        prisma.member.count({ where }),
      ]);
      return { data, total, page, pageSize };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  // Presence heartbeat — frontend pings every ~60s while the app is focused.
  .post(
    "/presence",
    async ({ activeMember }) => {
      await prisma.member.update({
        where: { id: activeMember!.id },
        data: { lastSeenAt: new Date() },
      });
      return { ok: true };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  // Self profile: status, working-on, timezone, skills
  .patch(
    "/me",
    async ({ activeMember, body }) => {
      const b = body as {
        statusEmoji?: string | null;
        statusText?: string | null;
        workingOn?: string | null;
        timezone?: string | null;
        skills?: string[];
      };
      const str = (v: unknown, max: number): string | null =>
        typeof v === "string" ? v.trim().slice(0, max) || null : null;
      const data: Record<string, unknown> = {};
      if (b.statusEmoji !== undefined) data.statusEmoji = str(b.statusEmoji, 8);
      if (b.statusText !== undefined) data.statusText = str(b.statusText, 100);
      if (b.workingOn !== undefined) data.workingOn = str(b.workingOn, 140);
      if (b.timezone !== undefined) data.timezone = str(b.timezone, 64);
      if (Array.isArray(b.skills)) {
        data.skills = [
          ...new Set(
            b.skills
              .filter((s): s is string => typeof s === "string")
              .map((s) => s.trim().toLowerCase().slice(0, 30))
              .filter(Boolean),
          ),
        ].slice(0, 15);
      }
      const updated = await prisma.member.update({
        where: { id: activeMember!.id },
        data,
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      });
      return updated;
    },
    { requireAuth: true, requireActiveOrg: true }
  );
