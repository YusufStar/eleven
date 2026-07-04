import { Elysia } from "elysia";
import { prisma } from "../db/prisma";
import { authPlugin } from "../plugins/auth.plugin";

// Org-wide file browsing across the projects the member belongs to.
// Upload/delete/download stay on /projects/:id/files — permissions live there.
export const filesRoutes = new Elysia({ prefix: "/files" })
  .use(authPlugin)
  .get(
    "/",
    async ({ activeOrganizationId, activeMember, query }) => {
      const memberships = await prisma.projectMember.findMany({
        where: { memberId: activeMember!.id, project: { organizationId: activeOrganizationId! } },
        select: { projectId: true },
      });
      const projectIds = memberships.map((m) => m.projectId);
      if (projectIds.length === 0) return { data: [], total: 0, folders: [] };

      const search = typeof query?.search === "string" ? query.search.trim() : "";
      const projectId =
        typeof query?.projectId === "string" && projectIds.includes(query.projectId) ? query.projectId : undefined;
      const folder = typeof query?.folder === "string" && query.folder.trim() !== "" ? query.folder.trim() : undefined;
      const page = Math.max(1, Number(query?.page) || 1);
      const pageSize = Math.min(100, Math.max(1, Number(query?.pageSize) || 50));

      const where = {
        projectId: projectId ? projectId : { in: projectIds },
        ...(folder && { folder }),
        ...(search && { fileName: { contains: search, mode: "insensitive" as const } }),
      };
      const [data, total, folderGroups] = await Promise.all([
        prisma.projectFile.findMany({
          where,
          include: {
            project: { select: { id: true, name: true, slug: true } },
            uploadedBy: { include: { user: { select: { id: true, name: true, image: true } } } },
          },
          orderBy: { updatedAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.projectFile.count({ where }),
        prisma.projectFile.groupBy({
          by: ["folder"],
          where: { projectId: projectId ? projectId : { in: projectIds } },
          _count: { _all: true },
        }),
      ]);
      return {
        data,
        total,
        page,
        pageSize,
        folders: folderGroups
          .map((g) => ({ folder: g.folder, count: g._count._all }))
          .sort((a, b) => a.folder.localeCompare(b.folder)),
      };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .get(
    "/recent",
    async ({ activeOrganizationId, activeMember }) => {
      const memberships = await prisma.projectMember.findMany({
        where: { memberId: activeMember!.id, project: { organizationId: activeOrganizationId! } },
        select: { projectId: true },
      });
      const projectIds = memberships.map((m) => m.projectId);
      if (projectIds.length === 0) return { data: [] };
      const data = await prisma.projectFile.findMany({
        where: { projectId: { in: projectIds } },
        include: {
          project: { select: { id: true, name: true, slug: true } },
          uploadedBy: { include: { user: { select: { id: true, name: true, image: true } } } },
        },
        orderBy: { updatedAt: "desc" },
        take: 8,
      });
      return { data };
    },
    { requireAuth: true, requireActiveOrg: true }
  );
