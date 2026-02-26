import { Elysia } from "elysia";
import { prisma } from "../db/prisma";
import { authPlugin } from "../plugins/auth.plugin";
import { TaskStatus, TaskPriority } from "../../prisma/generated/prisma/enums";

const orgScope = (activeOrganizationId: string) => ({ organizationId: activeOrganizationId });

const validStatuses = Object.values(TaskStatus) as string[];
const validPriorities = Object.values(TaskPriority) as string[];

export const tasksRoutes = new Elysia({ prefix: "/tasks" })
  .use(authPlugin)
  .post(
    "/",
    async ({ activeOrganizationId, activeMember, body }) => {
      const b = body as {
        title?: string;
        description?: string | null;
        assigneeId?: string | null;
        projectId?: string | null;
        contactId?: string | null;
        parentTaskId?: string | null;
        status?: string;
        priority?: string;
        dueAt?: string | null;
        detailsMarkdown?: string | null;
      };
      const title = typeof b.title === "string" ? b.title.trim() : "";
      if (!title) {
        return new Response(JSON.stringify({ message: "Title is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      const status = typeof b.status === "string" && validStatuses.includes(b.status) ? (b.status as TaskStatus) : TaskStatus.TODO;
      const priority = typeof b.priority === "string" && validPriorities.includes(b.priority) ? (b.priority as TaskPriority) : TaskPriority.MEDIUM;
      const dueAt = b.dueAt != null && b.dueAt !== "" ? new Date(b.dueAt as string) : null;
      if (b.projectId && activeMember) {
        const pm = await prisma.projectMember.findUnique({
          where: { projectId_memberId: { projectId: b.projectId, memberId: activeMember.id } },
        });
        if (!pm) {
          return new Response(JSON.stringify({ message: "Access denied. Only project members can add tasks to this project." }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
          });
        }
      }
      const created = await prisma.task.create({
        data: {
          organizationId: activeOrganizationId!,
          title,
          description: typeof b.description === "string" ? b.description.trim() || null : null,
          status,
          priority,
          dueAt,
          assigneeId: b.assigneeId ?? null,
          creatorId: activeMember?.id ?? null,
          projectId: b.projectId ?? null,
          contactId: b.contactId ?? null,
          parentTaskId: b.parentTaskId ?? null,
          detailsMarkdown: typeof b.detailsMarkdown === "string" ? b.detailsMarkdown.trim() || null : null,
        },
        include: {
          assignee: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
          creator: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
          project: { select: { id: true, name: true, slug: true } },
        },
      });
      return created;
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .get(
    "/",
    async ({ activeOrganizationId, activeMember, query }) => {
      const fetchAll = query?.all === "true" || query?.all === "1";
      const page = fetchAll ? 1 : Math.max(1, Number(query?.page) || 1);
      const pageSize = fetchAll
        ? 2000
        : Math.min(100, Math.max(1, Number(query?.pageSize) || 10));
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
  )
  .get(
    "/:id",
    async ({ activeOrganizationId, params }) => {
      const id = params?.id;
      if (!id || typeof id !== "string") {
        return new Response(JSON.stringify({ message: "Invalid task id" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      const task = await prisma.task.findFirst({
        where: { id, ...orgScope(activeOrganizationId!) },
        include: {
          assignee: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
          creator: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
          project: { select: { id: true, name: true, slug: true } },
          contact: { select: { id: true, firstName: true, lastName: true, companyName: true, email: true, phone: true } },
          deal: { select: { id: true, title: true, value: true, status: true, currency: true } },
          parentTask: { select: { id: true, title: true, status: true } },
          subTasks: { select: { id: true, title: true, status: true } },
          attachments: true,
        },
      });
      if (!task) {
        return new Response(JSON.stringify({ message: "Task not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      return task;
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .patch(
    "/:id",
    async ({ activeOrganizationId, activeMember, params, body }) => {
      const id = params?.id;
      if (!id || typeof id !== "string") {
        return new Response(JSON.stringify({ message: "Invalid task id" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      const b = body as {
        status?: string;
        title?: string;
        description?: string | null;
        assigneeId?: string | null;
        projectId?: string | null;
        contactId?: string | null;
        parentTaskId?: string | null;
        priority?: string;
        dueAt?: string | null;
        detailsMarkdown?: string | null;
      };
      const existing = await prisma.task.findFirst({
        where: { id, ...orgScope(activeOrganizationId!) },
      });
      if (!existing) {
        return new Response(JSON.stringify({ message: "Task not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      const status = typeof b.status === "string" && validStatuses.includes(b.status) ? (b.status as TaskStatus) : undefined;
      const data: Record<string, unknown> = {};
      if (status !== undefined) {
        data.status = status;
        data.completedAt = status === "DONE" ? new Date() : null;
      }
      if (typeof b.title === "string" && b.title.trim()) data.title = b.title.trim();
      if (b.description !== undefined) data.description = typeof b.description === "string" ? b.description.trim() || null : null;
      if (b.assigneeId !== undefined) data.assigneeId = b.assigneeId ?? null;
      if (b.projectId !== undefined) data.projectId = b.projectId ?? null;
      if (b.contactId !== undefined) data.contactId = b.contactId ?? null;
      if (b.parentTaskId !== undefined) data.parentTaskId = b.parentTaskId ?? null;
      if (typeof b.priority === "string" && validPriorities.includes(b.priority)) data.priority = b.priority as TaskPriority;
      if (b.dueAt !== undefined) data.dueAt = b.dueAt != null && b.dueAt !== "" ? new Date(b.dueAt as string) : null;
      if (b.detailsMarkdown !== undefined) data.detailsMarkdown = typeof b.detailsMarkdown === "string" ? b.detailsMarkdown.trim() || null : null;
      const updated = await prisma.task.update({
        where: { id },
        data,
        include: {
          assignee: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
          creator: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
          project: { select: { id: true, name: true, slug: true } },
          contact: { select: { id: true, firstName: true, lastName: true, companyName: true, email: true, phone: true } },
          parentTask: { select: { id: true, title: true, status: true } },
          subTasks: { select: { id: true, title: true, status: true } },
          attachments: true,
        },
      });
      return updated;
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .post(
    "/:id/attachments",
    async ({ activeOrganizationId, params, body }) => {
      const id = params?.id;
      if (!id || typeof id !== "string") {
        return new Response(JSON.stringify({ message: "Invalid task id" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      const b = body as { fileUrl?: string; fileName?: string; fileType?: string | null; fileSize?: number | null };
      const fileUrl = typeof b.fileUrl === "string" ? b.fileUrl.trim() : "";
      const fileName = typeof b.fileName === "string" ? b.fileName.trim() : "file";
      if (!fileUrl) {
        return new Response(JSON.stringify({ message: "fileUrl is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      const task = await prisma.task.findFirst({
        where: { id, ...orgScope(activeOrganizationId!) },
      });
      if (!task) {
        return new Response(JSON.stringify({ message: "Task not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      const attachment = await prisma.taskAttachment.create({
        data: {
          taskId: id,
          fileUrl,
          fileName,
          fileType: typeof b.fileType === "string" ? b.fileType : null,
          fileSize: typeof b.fileSize === "number" ? b.fileSize : null,
        },
      });
      return attachment;
    },
    { requireAuth: true, requireActiveOrg: true }
  );
