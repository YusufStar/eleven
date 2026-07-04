import { Elysia } from "elysia";
import { prisma } from "../db/prisma";
import { authPlugin } from "../plugins/auth.plugin";
import { logActivity } from "../lib/activity-log";
import { notify } from "../lib/notify";
import { ActivityAction, ActivityEntityType } from "../../prisma/generated/prisma/enums";
import { TaskStatus, TaskPriority } from "../../prisma/generated/prisma/enums";

const orgScope = (activeOrganizationId: string) => ({ organizationId: activeOrganizationId });

const validStatuses = Object.values(TaskStatus) as string[];
const validPriorities = Object.values(TaskPriority) as string[];

const json = (message: string, status: number) =>
  new Response(JSON.stringify({ message }), { status, headers: { "Content-Type": "application/json" } });

const cleanLabels = (v: unknown): string[] | undefined =>
  Array.isArray(v)
    ? [...new Set(v.filter((l): l is string => typeof l === "string").map((l) => l.trim().toLowerCase().slice(0, 40)).filter(Boolean))].slice(0, 10)
    : undefined;

const detailInclude = {
  assignee: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
  creator: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
  project: { select: { id: true, name: true, slug: true } },
  sprint: { select: { id: true, name: true, startsAt: true, endsAt: true } },
  milestone: { select: { id: true, name: true, dueAt: true } },
  parentTask: { select: { id: true, title: true, status: true } },
  subTasks: { select: { id: true, title: true, status: true, priority: true, assigneeId: true } },
  attachments: true,
  watchers: { include: { member: { include: { user: { select: { id: true, name: true, image: true } } } } } },
  comments: {
    orderBy: { createdAt: "asc" as const },
    include: { author: { include: { user: { select: { id: true, name: true, image: true } } } } },
  },
  dependsOn: { include: { dependsOn: { select: { id: true, title: true, status: true } } } },
  dependedOnBy: { include: { task: { select: { id: true, title: true, status: true } } } },
  timeEntries: {
    orderBy: { createdAt: "desc" as const },
    include: { member: { include: { user: { select: { id: true, name: true, image: true } } } } },
  },
} as const;

/** assignee + creator + watchers of a task, for fan-out notifications */
async function taskAudience(taskId: string): Promise<string[]> {
  const t = await prisma.task.findUnique({
    where: { id: taskId },
    select: { assigneeId: true, creatorId: true, watchers: { select: { memberId: true } } },
  });
  if (!t) return [];
  return [t.assigneeId, t.creatorId, ...t.watchers.map((w) => w.memberId)].filter((id): id is string => !!id);
}

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
        sprintId?: string | null;
        milestoneId?: string | null;
        parentTaskId?: string | null;
        status?: string;
        priority?: string;
        labels?: string[];
        estimate?: number | null;
        dueAt?: string | null;
        detailsMarkdown?: string | null;
      };
      const title = typeof b.title === "string" ? b.title.trim() : "";
      if (!title) return json("Title is required", 400);
      const status = typeof b.status === "string" && validStatuses.includes(b.status) ? (b.status as TaskStatus) : TaskStatus.TODO;
      const priority = typeof b.priority === "string" && validPriorities.includes(b.priority) ? (b.priority as TaskPriority) : TaskPriority.MEDIUM;
      const dueAt = b.dueAt != null && b.dueAt !== "" ? new Date(b.dueAt as string) : null;
      if (b.projectId && activeMember) {
        const pm = await prisma.projectMember.findUnique({
          where: { projectId_memberId: { projectId: b.projectId, memberId: activeMember.id } },
        });
        if (!pm) return json("Access denied. Only project members can add tasks to this project.", 403);
      }
      const created = await prisma.task.create({
        data: {
          organizationId: activeOrganizationId!,
          title,
          description: typeof b.description === "string" ? b.description.trim() || null : null,
          status,
          priority,
          labels: cleanLabels(b.labels) ?? [],
          estimate: typeof b.estimate === "number" && Number.isFinite(b.estimate) && b.estimate >= 0 ? Math.round(b.estimate) : null,
          dueAt,
          assigneeId: b.assigneeId ?? null,
          creatorId: activeMember?.id ?? null,
          projectId: b.projectId ?? null,
          sprintId: b.sprintId ?? null,
          milestoneId: b.milestoneId ?? null,
          parentTaskId: b.parentTaskId ?? null,
          detailsMarkdown: typeof b.detailsMarkdown === "string" ? b.detailsMarkdown.trim() || null : null,
        },
        include: {
          assignee: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
          creator: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
          project: { select: { id: true, name: true, slug: true } },
        },
      });
      if (activeMember) {
        await logActivity({
          prisma,
          organizationId: activeOrganizationId!,
          memberId: activeMember.id,
          action: ActivityAction.CREATE,
          entityType: ActivityEntityType.TASK,
          entityId: created.id,
          entityTitle: created.title,
        });
      }
      if (created.assigneeId) {
        await notify({
          prisma,
          organizationId: activeOrganizationId!,
          recipientIds: [created.assigneeId],
          actorId: activeMember?.id ?? null,
          type: "TASK_ASSIGNED",
          title: "You were assigned a task",
          body: created.title,
          link: `/dashboard/tasks/${created.id}`,
        });
      }
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
      const sprintId = typeof query?.sprintId === "string" && query.sprintId !== "" ? query.sprintId : undefined;
      const label = typeof query?.label === "string" && query.label !== "" ? query.label : undefined;
      const mine = query?.mine === "true" || query?.mine === "1";
      const rawAssigneeIds = query?.assigneeIds;
      const assigneeIds: string[] =
        typeof rawAssigneeIds === "string" && rawAssigneeIds.trim() !== ""
          ? rawAssigneeIds.split(",").map((id) => id.trim()).filter((id) => id !== "")
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
      const statuses = statusStrings.filter((s) => validStatuses.includes(s)) as (keyof typeof TaskStatus)[];

      if (projectId && activeMember) {
        const pm = await prisma.projectMember.findUnique({
          where: { projectId_memberId: { projectId, memberId: activeMember.id } },
        });
        if (!pm) return json("Access denied. Only project members can view project tasks.", 403);
      }

      const skip = (page - 1) * pageSize;
      const where = {
        ...orgScope(activeOrganizationId!),
        ...(effectiveAssigneeIds && effectiveAssigneeIds.length > 0 && { assigneeId: { in: effectiveAssigneeIds } }),
        ...(projectId && { projectId }),
        ...(sprintId && { sprintId }),
        ...(label && { labels: { has: label } }),
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
            sprint: { select: { id: true, name: true } },
            _count: { select: { subTasks: true, comments: true } },
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
  // Bulk actions — declared before /:id so the static segment wins.
  .patch(
    "/bulk",
    async ({ activeOrganizationId, activeMember, body }) => {
      const b = body as { ids?: string[]; status?: string; priority?: string; assigneeId?: string | null; sprintId?: string | null };
      const ids = Array.isArray(b.ids) ? b.ids.filter((id): id is string => typeof id === "string").slice(0, 200) : [];
      if (ids.length === 0) return json("ids is required", 400);
      const data: Record<string, unknown> = {};
      if (typeof b.status === "string" && validStatuses.includes(b.status)) {
        data.status = b.status;
        data.completedAt = b.status === "DONE" ? new Date() : null;
      }
      if (typeof b.priority === "string" && validPriorities.includes(b.priority)) data.priority = b.priority;
      if (b.assigneeId !== undefined) data.assigneeId = b.assigneeId ?? null;
      if (b.sprintId !== undefined) data.sprintId = b.sprintId ?? null;
      if (Object.keys(data).length === 0) return json("Nothing to update", 400);
      const result = await prisma.task.updateMany({
        where: { id: { in: ids }, ...orgScope(activeOrganizationId!) },
        data,
      });
      if (activeMember) {
        await logActivity({
          prisma,
          organizationId: activeOrganizationId!,
          memberId: activeMember.id,
          action: ActivityAction.UPDATE,
          entityType: ActivityEntityType.TASK,
          entityId: ids[0],
          entityTitle: `Bulk update (${result.count} tasks)`,
          metadata: { ids, ...data },
        });
      }
      return { ok: true, count: result.count };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .post(
    "/bulk-delete",
    async ({ activeOrganizationId, activeMember, body }) => {
      const b = body as { ids?: string[] };
      const ids = Array.isArray(b.ids) ? b.ids.filter((id): id is string => typeof id === "string").slice(0, 200) : [];
      if (ids.length === 0) return json("ids is required", 400);
      const result = await prisma.task.deleteMany({
        where: { id: { in: ids }, ...orgScope(activeOrganizationId!) },
      });
      if (activeMember) {
        await logActivity({
          prisma,
          organizationId: activeOrganizationId!,
          memberId: activeMember.id,
          action: ActivityAction.DELETE,
          entityType: ActivityEntityType.TASK,
          entityId: ids[0],
          entityTitle: `Bulk delete (${result.count} tasks)`,
          metadata: { ids },
        });
      }
      return { ok: true, count: result.count };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .get(
    "/:id",
    async ({ activeOrganizationId, activeMember, params }) => {
      const id = params?.id;
      if (!id || typeof id !== "string") return json("Invalid task id", 400);
      const task = await prisma.task.findFirst({
        where: { id, ...orgScope(activeOrganizationId!) },
        include: detailInclude,
      });
      if (!task) return json("Task not found", 404);
      if (activeMember) {
        await logActivity({
          prisma,
          organizationId: activeOrganizationId!,
          memberId: activeMember.id,
          action: ActivityAction.VIEW,
          entityType: ActivityEntityType.TASK,
          entityId: task.id,
          entityTitle: task.title,
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
      if (!id || typeof id !== "string") return json("Invalid task id", 400);
      const b = body as {
        status?: string;
        title?: string;
        description?: string | null;
        assigneeId?: string | null;
        projectId?: string | null;
        sprintId?: string | null;
        milestoneId?: string | null;
        parentTaskId?: string | null;
        priority?: string;
        labels?: string[];
        estimate?: number | null;
        dueAt?: string | null;
        detailsMarkdown?: string | null;
      };
      const existing = await prisma.task.findFirst({
        where: { id, ...orgScope(activeOrganizationId!) },
      });
      if (!existing) return json("Task not found", 404);
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
      if (b.sprintId !== undefined) data.sprintId = b.sprintId ?? null;
      if (b.milestoneId !== undefined) data.milestoneId = b.milestoneId ?? null;
      if (b.parentTaskId !== undefined) data.parentTaskId = b.parentTaskId ?? null;
      if (typeof b.priority === "string" && validPriorities.includes(b.priority)) data.priority = b.priority as TaskPriority;
      const labels = cleanLabels(b.labels);
      if (labels !== undefined) data.labels = labels;
      if (b.estimate !== undefined)
        data.estimate = typeof b.estimate === "number" && Number.isFinite(b.estimate) && b.estimate >= 0 ? Math.round(b.estimate) : null;
      if (b.dueAt !== undefined) data.dueAt = b.dueAt != null && b.dueAt !== "" ? new Date(b.dueAt as string) : null;
      if (b.detailsMarkdown !== undefined) data.detailsMarkdown = typeof b.detailsMarkdown === "string" ? b.detailsMarkdown.trim() || null : null;
      const updated = await prisma.task.update({
        where: { id },
        data,
        include: detailInclude,
      });
      if (activeMember) {
        await logActivity({
          prisma,
          organizationId: activeOrganizationId!,
          memberId: activeMember.id,
          action: status === "DONE" && existing.status !== "DONE" ? ActivityAction.COMPLETE : ActivityAction.UPDATE,
          entityType: ActivityEntityType.TASK,
          entityId: updated.id,
          entityTitle: updated.title,
          metadata: { changed: Object.keys(data) },
        });
      }
      if (updated.assigneeId && updated.assigneeId !== existing.assigneeId) {
        await notify({
          prisma,
          organizationId: activeOrganizationId!,
          recipientIds: [updated.assigneeId],
          actorId: activeMember?.id ?? null,
          type: "TASK_ASSIGNED",
          title: "You were assigned a task",
          body: updated.title,
          link: `/dashboard/tasks/${updated.id}`,
        });
      }
      if (updated.status === "DONE" && existing.status !== "DONE") {
        const audience = await taskAudience(updated.id);
        await notify({
          prisma,
          organizationId: activeOrganizationId!,
          recipientIds: audience,
          actorId: activeMember?.id ?? null,
          type: "TASK_COMPLETED",
          title: "Task completed",
          body: updated.title,
          link: `/dashboard/tasks/${updated.id}`,
        });
      }
      return updated;
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .delete(
    "/:id",
    async ({ activeOrganizationId, activeMember, params, set }) => {
      const task = await prisma.task.findFirst({
        where: { id: params.id, ...orgScope(activeOrganizationId!) },
        select: { id: true, title: true },
      });
      if (!task) {
        set.status = 404;
        return { message: "Task not found" };
      }
      await prisma.task.delete({ where: { id: task.id } });
      if (activeMember) {
        await logActivity({
          prisma,
          organizationId: activeOrganizationId!,
          memberId: activeMember.id,
          action: ActivityAction.DELETE,
          entityType: ActivityEntityType.TASK,
          entityId: task.id,
          entityTitle: task.title,
        });
      }
      return { ok: true };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  // ─── Comments ───────────────────────────────────
  .post(
    "/:id/comments",
    async ({ activeOrganizationId, activeMember, params, body }) => {
      if (!activeMember) return json("Member required", 403);
      const b = body as { body?: string; mentionMemberIds?: string[] };
      const text = typeof b.body === "string" ? b.body.trim().slice(0, 5000) : "";
      if (!text) return json("Comment body is required", 400);
      const task = await prisma.task.findFirst({
        where: { id: params.id, ...orgScope(activeOrganizationId!) },
        select: { id: true, title: true },
      });
      if (!task) return json("Task not found", 404);
      const comment = await prisma.taskComment.create({
        data: { taskId: task.id, authorId: activeMember.id, body: text },
        include: { author: { include: { user: { select: { id: true, name: true, image: true } } } } },
      });
      await logActivity({
        prisma,
        organizationId: activeOrganizationId!,
        memberId: activeMember.id,
        action: ActivityAction.COMMENT,
        entityType: ActivityEntityType.TASK,
        entityId: task.id,
        entityTitle: task.title,
      });
      const audience = await taskAudience(task.id);
      await notify({
        prisma,
        organizationId: activeOrganizationId!,
        recipientIds: audience,
        actorId: activeMember.id,
        type: "TASK_COMMENT",
        title: "New comment",
        body: `${task.title}: ${text.slice(0, 120)}`,
        link: `/dashboard/tasks/${task.id}`,
      });
      const mentioned = Array.isArray(b.mentionMemberIds)
        ? b.mentionMemberIds.filter((m): m is string => typeof m === "string")
        : [];
      if (mentioned.length > 0) {
        await notify({
          prisma,
          organizationId: activeOrganizationId!,
          recipientIds: mentioned,
          actorId: activeMember.id,
          type: "MENTION",
          title: "You were mentioned",
          body: `${task.title}: ${text.slice(0, 120)}`,
          link: `/dashboard/tasks/${task.id}`,
        });
      }
      return comment;
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .delete(
    "/:id/comments/:commentId",
    async ({ activeOrganizationId, activeMember, params, set }) => {
      const task = await prisma.task.findFirst({
        where: { id: params.id, ...orgScope(activeOrganizationId!) },
        select: { id: true },
      });
      if (!task) {
        set.status = 404;
        return { message: "Task not found" };
      }
      const comment = await prisma.taskComment.findFirst({
        where: { id: params.commentId, taskId: task.id },
      });
      if (!comment) {
        set.status = 404;
        return { message: "Comment not found" };
      }
      const isAdmin = activeMember?.role === "owner" || activeMember?.role === "admin";
      if (comment.authorId !== activeMember?.id && !isAdmin) {
        set.status = 403;
        return { message: "You can only delete your own comments" };
      }
      await prisma.taskComment.delete({ where: { id: comment.id } });
      return { ok: true };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  // ─── Watchers ───────────────────────────────────
  .post(
    "/:id/watchers/toggle",
    async ({ activeOrganizationId, activeMember, params }) => {
      if (!activeMember) return json("Member required", 403);
      const task = await prisma.task.findFirst({
        where: { id: params.id, ...orgScope(activeOrganizationId!) },
        select: { id: true },
      });
      if (!task) return json("Task not found", 404);
      const existing = await prisma.taskWatcher.findUnique({
        where: { taskId_memberId: { taskId: task.id, memberId: activeMember.id } },
      });
      if (existing) {
        await prisma.taskWatcher.delete({ where: { id: existing.id } });
        return { watching: false };
      }
      await prisma.taskWatcher.create({ data: { taskId: task.id, memberId: activeMember.id } });
      return { watching: true };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  // ─── Dependencies ───────────────────────────────
  .post(
    "/:id/dependencies",
    async ({ activeOrganizationId, params, body }) => {
      const b = body as { dependsOnId?: string };
      const dependsOnId = typeof b.dependsOnId === "string" ? b.dependsOnId : "";
      if (!dependsOnId) return json("dependsOnId is required", 400);
      if (dependsOnId === params.id) return json("A task cannot depend on itself", 400);
      const [task, dep] = await Promise.all([
        prisma.task.findFirst({ where: { id: params.id, ...orgScope(activeOrganizationId!) }, select: { id: true } }),
        prisma.task.findFirst({ where: { id: dependsOnId, ...orgScope(activeOrganizationId!) }, select: { id: true } }),
      ]);
      if (!task || !dep) return json("Task not found", 404);
      // ponytail: no deep cycle detection — only direct A<->B guarded; revisit if graphs get deep
      const reverse = await prisma.taskDependency.findUnique({
        where: { taskId_dependsOnId: { taskId: dependsOnId, dependsOnId: params.id } },
      });
      if (reverse) return json("These tasks already depend on each other", 400);
      const created = await prisma.taskDependency.upsert({
        where: { taskId_dependsOnId: { taskId: task.id, dependsOnId } },
        update: {},
        create: { taskId: task.id, dependsOnId },
        include: { dependsOn: { select: { id: true, title: true, status: true } } },
      });
      return created;
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .delete(
    "/:id/dependencies/:depId",
    async ({ activeOrganizationId, params, set }) => {
      const task = await prisma.task.findFirst({
        where: { id: params.id, ...orgScope(activeOrganizationId!) },
        select: { id: true },
      });
      if (!task) {
        set.status = 404;
        return { message: "Task not found" };
      }
      await prisma.taskDependency.deleteMany({ where: { id: params.depId, taskId: task.id } });
      return { ok: true };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  // ─── Time tracking ──────────────────────────────
  .post(
    "/:id/time",
    async ({ activeOrganizationId, activeMember, params, body }) => {
      if (!activeMember) return json("Member required", 403);
      const b = body as { minutes?: number; note?: string | null };
      const minutes = typeof b.minutes === "number" && Number.isFinite(b.minutes) ? Math.round(b.minutes) : 0;
      if (minutes <= 0 || minutes > 24 * 60) return json("minutes must be between 1 and 1440", 400);
      const task = await prisma.task.findFirst({
        where: { id: params.id, ...orgScope(activeOrganizationId!) },
        select: { id: true },
      });
      if (!task) return json("Task not found", 404);
      const [entry] = await prisma.$transaction([
        prisma.timeEntry.create({
          data: {
            taskId: task.id,
            memberId: activeMember.id,
            minutes,
            note: typeof b.note === "string" ? b.note.trim().slice(0, 500) || null : null,
          },
          include: { member: { include: { user: { select: { id: true, name: true, image: true } } } } },
        }),
        prisma.task.update({ where: { id: task.id }, data: { timeSpentMinutes: { increment: minutes } } }),
      ]);
      return entry;
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  // ─── Attachments (unchanged) ────────────────────
  .post(
    "/:id/attachments",
    async ({ activeOrganizationId, activeMember, params, body }) => {
      const id = params?.id;
      if (!id || typeof id !== "string") return json("Invalid task id", 400);
      const b = body as { fileUrl?: string; fileName?: string; fileType?: string | null; fileSize?: number | null };
      const fileUrl = typeof b.fileUrl === "string" ? b.fileUrl.trim().slice(0, 2000) : "";
      const fileName = (typeof b.fileName === "string" ? b.fileName.trim() : "").slice(0, 255) || "file";
      if (!fileUrl) return json("fileUrl is required", 400);
      // only http(s) targets — no javascript:, data:, file: schemes
      let parsed: URL;
      try {
        parsed = new URL(fileUrl);
      } catch {
        return json("fileUrl must be a valid URL", 400);
      }
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return json("Only http(s) links are allowed", 400);
      }
      const task = await prisma.task.findFirst({
        where: { id, ...orgScope(activeOrganizationId!) },
      });
      if (!task) return json("Task not found", 404);
      const attachment = await prisma.taskAttachment.create({
        data: {
          taskId: id,
          fileUrl,
          fileName,
          fileType: typeof b.fileType === "string" ? b.fileType.slice(0, 100) : null,
          fileSize:
            typeof b.fileSize === "number" && Number.isFinite(b.fileSize) && b.fileSize >= 0
              ? Math.round(b.fileSize)
              : null,
        },
      });
      if (activeMember) {
        await logActivity({
          prisma,
          organizationId: activeOrganizationId!,
          memberId: activeMember.id,
          action: ActivityAction.CREATE,
          entityType: ActivityEntityType.TASK_ATTACHMENT,
          entityId: attachment.id,
          entityTitle: attachment.fileName,
          metadata: { taskId: id },
        });
      }
      return attachment;
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .delete(
    "/:id/attachments/:attachmentId",
    async ({ activeOrganizationId, activeMember, params, set }) => {
      const task = await prisma.task.findFirst({
        where: { id: params.id, ...orgScope(activeOrganizationId!) },
        select: { id: true },
      });
      if (!task) {
        set.status = 404;
        return { message: "Task not found" };
      }
      const attachment = await prisma.taskAttachment.findFirst({
        where: { id: params.attachmentId, taskId: task.id },
      });
      if (!attachment) {
        set.status = 404;
        return { message: "Attachment not found" };
      }
      await prisma.taskAttachment.delete({ where: { id: attachment.id } });
      if (activeMember) {
        await logActivity({
          prisma,
          organizationId: activeOrganizationId!,
          memberId: activeMember.id,
          action: ActivityAction.DELETE,
          entityType: ActivityEntityType.TASK_ATTACHMENT,
          entityId: attachment.id,
          entityTitle: attachment.fileName,
          metadata: { taskId: task.id },
        });
      }
      return { ok: true };
    },
    { requireAuth: true, requireActiveOrg: true }
  );
