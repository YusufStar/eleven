import { Elysia } from "elysia";
import { prisma } from "../db/prisma";
import { authPlugin } from "../plugins/auth.plugin";

const orgScope = (activeOrganizationId: string) => ({ organizationId: activeOrganizationId });

export const tasksRoutes = new Elysia({ prefix: "/tasks" })
  .use(authPlugin)
  .get(
    "/",
    async ({ activeOrganizationId, activeMember, query }) => {
      const page = Math.max(1, Number(query?.page) || 1);
      const pageSize = Math.min(100, Math.max(1, Number(query?.pageSize) || 10));
      const assigneeId = typeof query?.assigneeId === "string" && query.assigneeId !== "" ? query.assigneeId : undefined;
      const projectId = typeof query?.projectId === "string" && query.projectId !== "" ? query.projectId : undefined;
      const mine = query?.mine === "true" || query?.mine === "1";
      const memberId = mine && activeMember ? activeMember.id : assigneeId;

      if (projectId) {
        const pm = await prisma.projectMember.findUnique({
          where: { projectId_memberId: { projectId, memberId: activeMember!.id } },
        });
        if (!pm)
          return new Response(JSON.stringify({ message: "Access denied. Only project members can view project tasks." }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
          });
      }

      const skip = (page - 1) * pageSize;
      const where = {
        ...orgScope(activeOrganizationId!),
        ...(memberId && { assigneeId: memberId }),
        ...(projectId && { projectId }),
      };
      const [data, total] = await Promise.all([
        prisma.task.findMany({
          where,
          include: {
            assignee: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
            creator: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
            project: { select: { id: true, name: true, slug: true } },
          },
          orderBy: { updatedAt: "desc" },
          skip,
          take: pageSize,
        }),
        prisma.task.count({ where }),
      ]);
      return { data, total, page, pageSize };
    },
    { requireAuth: true, requireActiveOrg: true }
  );
