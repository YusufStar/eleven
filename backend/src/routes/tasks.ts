import { Elysia } from "elysia";
import { prisma } from "../db/prisma";
import { authPlugin } from "../plugins/auth.plugin";
import { TaskStatus } from "../../prisma/generated/prisma/enums";

const orgScope = (activeOrganizationId: string) => ({ organizationId: activeOrganizationId });

export const tasksRoutes = new Elysia({ prefix: "/tasks" })
  .use(authPlugin)
  .get(
    "/",
    async ({ activeOrganizationId, activeMember, query }) => {
      const page = Math.max(1, Number(query?.page) || 1);
      const pageSize = Math.min(100, Math.max(1, Number(query?.pageSize) || 10));
      const projectId = typeof query?.projectId === "string" && query.projectId !== "" ? query.projectId : undefined;
      const mine = query?.mine === "true" || query?.mine === "1";
      const rawAssigneeIds = query?.assigneeId;
      const assigneeIds: string[] = Array.isArray(rawAssigneeIds)
        ? (rawAssigneeIds as string[]).filter((id) => typeof id === "string" && id !== "")
        : typeof rawAssigneeIds === "string" && rawAssigneeIds !== ""
          ? [rawAssigneeIds]
          : [];
      const useMine = mine && activeMember;
      const effectiveAssigneeIds = useMine ? [activeMember!.id] : assigneeIds.length > 0 ? assigneeIds : undefined;

      const search = typeof query?.search === "string" && query.search.trim() !== "" ? query.search.trim() : undefined;
      const rawStatus = query?.status;
      const statusStrings: string[] = Array.isArray(rawStatus)
        ? (rawStatus as string[]).filter((s) => typeof s === "string" && s !== "")
        : typeof rawStatus === "string" && rawStatus !== ""
          ? [rawStatus]
          : [];
      const validStatuses = Object.values(TaskStatus) as string[];
      const statuses = statusStrings.filter((s) => validStatuses.includes(s)) as (keyof typeof TaskStatus)[];

      if (projectId && activeMember) {
        const pm = await prisma.projectMember.findUnique({
          where: { projectId_memberId: { projectId, memberId: activeMember.id } },
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
        ...(effectiveAssigneeIds && effectiveAssigneeIds.length > 0 && { assigneeId: { in: effectiveAssigneeIds } }),
        ...(projectId && { projectId }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        }),
        ...(statuses.length > 0 && { status: { in: statuses } }),
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
