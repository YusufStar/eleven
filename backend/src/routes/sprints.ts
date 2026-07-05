import { Elysia } from "elysia";
import { prisma } from "../db/prisma";
import { authPlugin } from "../plugins/auth.plugin";
import { logActivity } from "../lib/activity-log";
import { notifyOrganization } from "../lib/notify";
import { ActivityAction, ActivityEntityType } from "../../prisma/generated/prisma/enums";

const json = (message: string, status: number) =>
  new Response(JSON.stringify({ message }), { status, headers: { "Content-Type": "application/json" } });

export const sprintsRoutes = new Elysia({ prefix: "/sprints" })
  .use(authPlugin)
  .get(
    "/",
    async ({ activeOrganizationId }) => {
      const sprints = await prisma.sprint.findMany({
        where: { organizationId: activeOrganizationId! },
        orderBy: { startsAt: "desc" },
        include: { tasks: { select: { status: true, estimate: true } } },
      });
      const now = new Date();
      return sprints.map((s) => ({
        id: s.id,
        name: s.name,
        goal: s.goal,
        startsAt: s.startsAt,
        endsAt: s.endsAt,
        state: now < s.startsAt ? "upcoming" : now > s.endsAt ? "done" : "active",
        taskCount: s.tasks.length,
        doneCount: s.tasks.filter((t) => t.status === "DONE").length,
        committedPoints: s.tasks.reduce((sum, t) => sum + (t.estimate ?? 0), 0),
        completedPoints: s.tasks.filter((t) => t.status === "DONE").reduce((sum, t) => sum + (t.estimate ?? 0), 0),
      }));
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .post(
    "/",
    async ({ activeOrganizationId, activeMember, body }) => {
      const b = body as { name?: string; goal?: string | null; startsAt?: string; endsAt?: string };
      const name = typeof b.name === "string" ? b.name.trim().slice(0, 100) : "";
      if (!name) return json("Name is required", 400);
      const startsAt = b.startsAt ? new Date(b.startsAt) : null;
      const endsAt = b.endsAt ? new Date(b.endsAt) : null;
      if (!startsAt || !endsAt || isNaN(+startsAt) || isNaN(+endsAt) || endsAt <= startsAt) {
        return json("Valid startsAt and endsAt are required", 400);
      }
      const sprint = await prisma.sprint.create({
        data: {
          organizationId: activeOrganizationId!,
          name,
          goal: typeof b.goal === "string" ? b.goal.trim().slice(0, 500) || null : null,
          startsAt,
          endsAt,
        },
      });
      if (activeMember) {
        await logActivity({
          prisma,
          organizationId: activeOrganizationId!,
          memberId: activeMember.id,
          action: ActivityAction.CREATE,
          entityType: ActivityEntityType.SPRINT,
          entityId: sprint.id,
          entityTitle: sprint.name,
        });
      }
      await notifyOrganization({
        prisma,
        organizationId: activeOrganizationId!,
        actorId: activeMember?.id ?? null,
        type: "SPRINT_STARTED",
        title: `Sprint created: ${sprint.name}`,
        body: sprint.goal,
        link: "/dashboard/sprints",
      });
      return sprint;
    },
    { requireAuth: true, requireActiveOrg: true, requirePaidOrg: true }
  )
  .patch(
    "/:id",
    async ({ activeOrganizationId, activeMember, params, body }) => {
      const existing = await prisma.sprint.findFirst({
        where: { id: params.id, organizationId: activeOrganizationId! },
      });
      if (!existing) return json("Sprint not found", 404);
      const b = body as { name?: string; goal?: string | null; startsAt?: string; endsAt?: string };
      const data: Record<string, unknown> = {};
      if (typeof b.name === "string" && b.name.trim()) data.name = b.name.trim().slice(0, 100);
      if (b.goal !== undefined) data.goal = typeof b.goal === "string" ? b.goal.trim().slice(0, 500) || null : null;
      if (b.startsAt) data.startsAt = new Date(b.startsAt);
      if (b.endsAt) data.endsAt = new Date(b.endsAt);
      const sprint = await prisma.sprint.update({ where: { id: existing.id }, data });
      if (activeMember) {
        await logActivity({
          prisma,
          organizationId: activeOrganizationId!,
          memberId: activeMember.id,
          action: ActivityAction.UPDATE,
          entityType: ActivityEntityType.SPRINT,
          entityId: sprint.id,
          entityTitle: sprint.name,
        });
      }
      return sprint;
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .delete(
    "/:id",
    async ({ activeOrganizationId, activeMember, params, set }) => {
      const existing = await prisma.sprint.findFirst({
        where: { id: params.id, organizationId: activeOrganizationId! },
      });
      if (!existing) {
        set.status = 404;
        return { message: "Sprint not found" };
      }
      await prisma.sprint.delete({ where: { id: existing.id } });
      if (activeMember) {
        await logActivity({
          prisma,
          organizationId: activeOrganizationId!,
          memberId: activeMember.id,
          action: ActivityAction.DELETE,
          entityType: ActivityEntityType.SPRINT,
          entityId: existing.id,
          entityTitle: existing.name,
        });
      }
      return { ok: true };
    },
    { requireAuth: true, requireActiveOrg: true }
  );
