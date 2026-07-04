import { Elysia } from "elysia";
import { prisma } from "../db/prisma";
import { authPlugin } from "../plugins/auth.plugin";
import { Prisma } from "../../prisma/generated/prisma/client";

const num = (v: unknown) => (v == null ? 0 : Number(v));

export const metricsRoutes = new Elysia({ prefix: "/metrics" })
  .use(authPlugin)
  .get(
    "/overview",
    async ({ activeOrganizationId }) => {
      const orgId = activeOrganizationId!;
      const org = { organizationId: orgId };

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);

      const [statusGroups, doneThisWeek, donePrevWeek, createdLast30, doneLast30, cycle, overdue] =
        await Promise.all([
          prisma.task.groupBy({ by: ["status"], where: org, _count: { _all: true } }),
          prisma.task.count({ where: { ...org, completedAt: { gte: weekAgo } } }),
          prisma.task.count({ where: { ...org, completedAt: { gte: twoWeeksAgo, lt: weekAgo } } }),
          prisma.task.count({ where: { ...org, createdAt: { gte: monthAgo } } }),
          prisma.task.count({ where: { ...org, completedAt: { gte: monthAgo } } }),
          prisma.$queryRaw<{ days: unknown }[]>(
            Prisma.sql`
              SELECT avg(extract(epoch FROM ("completedAt" - "createdAt")) / 86400) AS days
              FROM tasks
              WHERE "organizationId" = ${orgId}
                AND "completedAt" IS NOT NULL
                AND "completedAt" >= ${monthAgo}
            `
          ),
          prisma.task.count({
            where: {
              ...org,
              dueAt: { lt: new Date() },
              status: { in: ["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED"] },
            },
          }),
        ]);

      const byStatus = Object.fromEntries(statusGroups.map((g) => [g.status, g._count._all])) as Record<
        string,
        number
      >;

      return {
        byStatus,
        openTasks:
          (byStatus.TODO ?? 0) + (byStatus.IN_PROGRESS ?? 0) + (byStatus.IN_REVIEW ?? 0) + (byStatus.BLOCKED ?? 0),
        blocked: byStatus.BLOCKED ?? 0,
        overdue,
        doneThisWeek,
        donePrevWeek,
        completionRate30d: createdLast30 > 0 ? doneLast30 / createdLast30 : null,
        avgCycleDays: cycle[0]?.days != null ? Math.round(num(cycle[0].days) * 10) / 10 : null,
      };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .get(
    "/tasks-throughput",
    async ({ activeOrganizationId, query }) => {
      const weeks = Math.min(26, Math.max(4, Number(query?.weeks) || 8));
      const start = new Date();
      start.setDate(start.getDate() - weeks * 7);
      start.setUTCHours(0, 0, 0, 0);

      const [perWeek, workloadGroups] = await Promise.all([
        prisma.$queryRaw<{ week: Date; count: bigint }[]>(
          Prisma.sql`
            SELECT date_trunc('week', "completedAt")::date AS week, count(*)::bigint AS count
            FROM tasks
            WHERE "organizationId" = ${activeOrganizationId!}
              AND "completedAt" IS NOT NULL
              AND "completedAt" >= ${start}
            GROUP BY 1
            ORDER BY 1 ASC
          `
        ),
        prisma.task.groupBy({
          by: ["assigneeId", "status"],
          where: { organizationId: activeOrganizationId!, assigneeId: { not: null } },
          _count: { _all: true },
        }),
      ]);

      const memberIds = [...new Set(workloadGroups.map((g) => g.assigneeId).filter((id): id is string => !!id))];
      const members = await prisma.member.findMany({
        where: { id: { in: memberIds } },
        select: { id: true, user: { select: { name: true } } },
      });
      const memberName = new Map(members.map((m) => [m.id, m.user.name]));

      const workload = new Map<
        string,
        { memberId: string; name: string; todo: number; inProgress: number; inReview: number; blocked: number; done: number }
      >();
      for (const g of workloadGroups) {
        if (!g.assigneeId) continue;
        const row = workload.get(g.assigneeId) ?? {
          memberId: g.assigneeId,
          name: memberName.get(g.assigneeId) ?? "Unknown",
          todo: 0,
          inProgress: 0,
          inReview: 0,
          blocked: 0,
          done: 0,
        };
        if (g.status === "TODO") row.todo += g._count._all;
        else if (g.status === "IN_PROGRESS") row.inProgress += g._count._all;
        else if (g.status === "IN_REVIEW") row.inReview += g._count._all;
        else if (g.status === "BLOCKED") row.blocked += g._count._all;
        else if (g.status === "DONE") row.done += g._count._all;
        workload.set(g.assigneeId, row);
      }

      return {
        completedPerWeek: perWeek.map((r) => ({
          week: r.week instanceof Date ? r.week.toISOString().slice(0, 10) : String(r.week),
          count: Number(r.count),
        })),
        workload: [...workload.values()].sort(
          (a, b) => b.todo + b.inProgress + b.inReview + b.blocked - (a.todo + a.inProgress + a.inReview + a.blocked)
        ),
      };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .get(
    "/sprint-velocity",
    async ({ activeOrganizationId }) => {
      const sprints = await prisma.sprint.findMany({
        where: { organizationId: activeOrganizationId! },
        orderBy: { startsAt: "asc" },
        take: 12,
        include: { tasks: { select: { status: true, estimate: true } } },
      });
      return {
        data: sprints.map((s) => {
          const committed = s.tasks.reduce((sum, t) => sum + (t.estimate ?? 0), 0);
          const completed = s.tasks
            .filter((t) => t.status === "DONE")
            .reduce((sum, t) => sum + (t.estimate ?? 0), 0);
          return {
            id: s.id,
            name: s.name,
            startsAt: s.startsAt,
            endsAt: s.endsAt,
            committedPoints: committed,
            completedPoints: completed,
            taskCount: s.tasks.length,
            doneCount: s.tasks.filter((t) => t.status === "DONE").length,
          };
        }),
      };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .get(
    "/cycle-time",
    async ({ activeOrganizationId, query }) => {
      const weeks = Math.min(26, Math.max(4, Number(query?.weeks) || 8));
      const start = new Date();
      start.setDate(start.getDate() - weeks * 7);
      start.setUTCHours(0, 0, 0, 0);

      const rows = await prisma.$queryRaw<{ week: Date; days: unknown }[]>(
        Prisma.sql`
          SELECT date_trunc('week', "completedAt")::date AS week,
                 avg(extract(epoch FROM ("completedAt" - "createdAt")) / 86400) AS days
          FROM tasks
          WHERE "organizationId" = ${activeOrganizationId!}
            AND "completedAt" IS NOT NULL
            AND "completedAt" >= ${start}
          GROUP BY 1
          ORDER BY 1 ASC
        `
      );
      return {
        data: rows.map((r) => ({
          week: r.week instanceof Date ? r.week.toISOString().slice(0, 10) : String(r.week),
          days: Math.round(num(r.days) * 10) / 10,
        })),
      };
    },
    { requireAuth: true, requireActiveOrg: true }
  );
