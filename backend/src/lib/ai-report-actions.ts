import type { PrismaClient } from "../../prisma/generated/prisma/client";
import {
  AiReportActionStatus,
  AiReportActionType,
  TaskPriority,
  TaskStatus,
} from "../../prisma/generated/prisma/enums";

type ApplyCtx = {
  prisma: PrismaClient;
  organizationId: string;
  memberId: string;
};

const validStatuses = Object.values(TaskStatus) as string[];
const validPriorities = Object.values(TaskPriority) as string[];

async function resolveMemberId(
  prisma: PrismaClient,
  organizationId: string,
  payload: Record<string, unknown>,
): Promise<string | null> {
  if (typeof payload.assigneeId === "string" && payload.assigneeId) return payload.assigneeId;
  const name = typeof payload.assigneeName === "string" ? payload.assigneeName.trim() : "";
  if (!name) return null;
  const members = await prisma.member.findMany({
    where: { organizationId },
    select: { id: true, user: { select: { name: true } } },
  });
  const exact = members.find((m) => m.user.name.toLowerCase() === name.toLowerCase());
  if (exact) return exact.id;
  const partial = members.find((m) => m.user.name.toLowerCase().includes(name.toLowerCase()));
  return partial?.id ?? null;
}

async function resolveTaskId(
  prisma: PrismaClient,
  organizationId: string,
  payload: Record<string, unknown>,
): Promise<string | null> {
  if (typeof payload.taskId === "string" && payload.taskId) {
    const task = await prisma.task.findFirst({
      where: { id: payload.taskId, organizationId },
      select: { id: true },
    });
    return task?.id ?? null;
  }
  const title = typeof payload.taskTitle === "string" ? payload.taskTitle.trim() : "";
  if (!title) return null;
  const task = await prisma.task.findFirst({
    where: { organizationId, title: { equals: title, mode: "insensitive" } },
    select: { id: true },
    orderBy: { updatedAt: "desc" },
  });
  return task?.id ?? null;
}

export async function applyAiReportAction(
  action: {
    id: string;
    type: AiReportActionType;
    payload: unknown;
    status: AiReportActionStatus;
  },
  ctx: ApplyCtx,
): Promise<{ ok: true; message: string; entityId?: string } | { ok: false; message: string }> {
  if (action.status === AiReportActionStatus.APPLIED) {
    return { ok: false, message: "Action already applied" };
  }
  if (action.status === AiReportActionStatus.DISMISSED) {
    return { ok: false, message: "Action was dismissed" };
  }

  const payload = (action.payload ?? {}) as Record<string, unknown>;

  switch (action.type) {
    case AiReportActionType.CREATE_TASK: {
      const title = typeof payload.title === "string" ? payload.title.trim() : "";
      if (!title) return { ok: false, message: "Task title is required" };
      const status =
        typeof payload.status === "string" && validStatuses.includes(payload.status)
          ? (payload.status as TaskStatus)
          : TaskStatus.TODO;
      const priority =
        typeof payload.priority === "string" && validPriorities.includes(payload.priority)
          ? (payload.priority as TaskPriority)
          : TaskPriority.MEDIUM;
      const assigneeId = await resolveMemberId(ctx.prisma, ctx.organizationId, payload);
      const created = await ctx.prisma.task.create({
        data: {
          organizationId: ctx.organizationId,
          title,
          description: typeof payload.description === "string" ? payload.description.trim() || null : null,
          status,
          priority,
          assigneeId,
          creatorId: ctx.memberId,
          projectId: typeof payload.projectId === "string" ? payload.projectId : null,
          sprintId: typeof payload.sprintId === "string" ? payload.sprintId : null,
        },
      });
      return { ok: true, message: `Task "${created.title}" created`, entityId: created.id };
    }
    case AiReportActionType.UPDATE_TASK_STATUS: {
      const taskId = await resolveTaskId(ctx.prisma, ctx.organizationId, payload);
      if (!taskId) return { ok: false, message: "Task not found" };
      const status = typeof payload.status === "string" && validStatuses.includes(payload.status)
        ? (payload.status as TaskStatus)
        : null;
      if (!status) return { ok: false, message: "Valid status is required" };
      const updated = await ctx.prisma.task.update({
        where: { id: taskId },
        data: {
          status,
          completedAt: status === TaskStatus.DONE ? new Date() : null,
        },
      });
      return { ok: true, message: `Task "${updated.title}" moved to ${status}`, entityId: updated.id };
    }
    case AiReportActionType.UPDATE_TASK_PRIORITY: {
      const taskId = await resolveTaskId(ctx.prisma, ctx.organizationId, payload);
      if (!taskId) return { ok: false, message: "Task not found" };
      const priority = typeof payload.priority === "string" && validPriorities.includes(payload.priority)
        ? (payload.priority as TaskPriority)
        : null;
      if (!priority) return { ok: false, message: "Valid priority is required" };
      const updated = await ctx.prisma.task.update({
        where: { id: taskId },
        data: { priority },
      });
      return { ok: true, message: `Task "${updated.title}" priority set to ${priority}`, entityId: updated.id };
    }
    case AiReportActionType.REASSIGN_TASK: {
      const taskId = await resolveTaskId(ctx.prisma, ctx.organizationId, payload);
      if (!taskId) return { ok: false, message: "Task not found" };
      const assigneeId = await resolveMemberId(ctx.prisma, ctx.organizationId, payload);
      if (!assigneeId) return { ok: false, message: "Assignee not found" };
      const updated = await ctx.prisma.task.update({
        where: { id: taskId },
        data: { assigneeId },
      });
      return { ok: true, message: `Task "${updated.title}" reassigned`, entityId: updated.id };
    }
    case AiReportActionType.ADD_TASK_COMMENT: {
      const taskId = await resolveTaskId(ctx.prisma, ctx.organizationId, payload);
      if (!taskId) return { ok: false, message: "Task not found" };
      const body = typeof payload.body === "string" ? payload.body.trim() : "";
      if (!body) return { ok: false, message: "Comment body is required" };
      const comment = await ctx.prisma.taskComment.create({
        data: { taskId, authorId: ctx.memberId, body },
      });
      return { ok: true, message: "Comment added", entityId: comment.id };
    }
    default:
      return { ok: false, message: "Unsupported action type" };
  }
}
