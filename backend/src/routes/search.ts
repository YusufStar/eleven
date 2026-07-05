import { Elysia } from "elysia";
import { prisma } from "../db/prisma";
import { authPlugin } from "../plugins/auth.plugin";

/** Lightweight cross-entity search for the ⌘K palette. Org-scoped, capped per group. */
export const searchRoutes = new Elysia({ prefix: "/search" })
  .use(authPlugin)
  .get(
    "/",
    async ({ activeOrganizationId, query }) => {
      const q = typeof query?.q === "string" ? query.q.trim() : "";
      if (q.length < 2) {
        return { tasks: [], projects: [], sprints: [], files: [], people: [] };
      }
      const orgId = activeOrganizationId!;
      const like = { contains: q, mode: "insensitive" as const };

      const [tasks, projects, sprints, files, people] = await Promise.all([
        prisma.task.findMany({
          where: { organizationId: orgId, title: like },
          select: { id: true, title: true, status: true, priority: true },
          orderBy: { updatedAt: "desc" },
          take: 6,
        }),
        prisma.project.findMany({
          where: { organizationId: orgId, OR: [{ name: like }, { description: like }] },
          select: { id: true, name: true },
          orderBy: { updatedAt: "desc" },
          take: 5,
        }),
        prisma.sprint.findMany({
          where: { organizationId: orgId, OR: [{ name: like }, { goal: like }] },
          select: { id: true, name: true, startsAt: true, endsAt: true },
          orderBy: { startsAt: "desc" },
          take: 4,
        }),
        prisma.projectFile.findMany({
          where: { project: { organizationId: orgId }, fileName: like },
          select: { id: true, fileName: true, fileUrl: true, projectId: true },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
        prisma.member.findMany({
          where: {
            organizationId: orgId,
            user: { OR: [{ name: like }, { email: like }] },
          },
          select: { id: true, user: { select: { id: true, name: true, email: true, image: true } } },
          take: 5,
        }),
      ]);

      return { tasks, projects, sprints, files, people };
    },
    { requireAuth: true, requireActiveOrg: true }
  );
