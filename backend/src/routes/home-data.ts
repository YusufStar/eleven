import { Elysia } from "elysia";
import { prisma } from "../db/prisma";
import { authPlugin } from "../plugins/auth.plugin";

const orgScope = (activeOrganizationId: string) => ({ organizationId: activeOrganizationId });

export const homeDataRoutes = new Elysia()
  .use(authPlugin)
  .get(
    "/home-data",
    async ({ activeOrganizationId }) => {
      const orgId = activeOrganizationId!;

      const [
        contactsCount,
        dealsCount,
        openDealsAgg,
        tasksCounts,
        projectsCount,
        recentActivities,
        recentDeals,
        recentTasks,
      ] = await Promise.all([
        prisma.contact.count({ where: orgScope(orgId) }),
        prisma.deal.count({ where: orgScope(orgId) }),
        prisma.deal.aggregate({
          where: { ...orgScope(orgId), status: "OPEN" },
          _sum: { value: true },
        }),
        prisma.task.groupBy({
          by: ["status"],
          where: orgScope(orgId),
          _count: true,
        }),
        prisma.project.count({ where: orgScope(orgId) }),
        prisma.activity.findMany({
          where: orgScope(orgId),
          orderBy: { createdAt: "desc" },
          take: 8,
          include: {
            member: { select: { user: { select: { name: true } } } },
          },
        }),
        prisma.deal.findMany({
          where: orgScope(orgId),
          orderBy: { updatedAt: "desc" },
          take: 3,
          include: {
            stage: { select: { name: true, color: true } },
            contact: { select: { firstName: true, lastName: true, companyName: true } },
          },
        }),
        prisma.task.findMany({
          where: orgScope(orgId),
          orderBy: { updatedAt: "desc" },
          take: 3,
          include: {
            assignee: { select: { user: { select: { name: true } } } },
            project: { select: { name: true, slug: true } },
          },
        }),
      ]);

      const tasksTodo =
        (tasksCounts.find((t) => t.status === "TODO")?._count ?? 0) +
        (tasksCounts.find((t) => t.status === "IN_PROGRESS")?._count ?? 0);
      const tasksDone = tasksCounts.find((t) => t.status === "DONE")?._count ?? 0;
      const openValue = openDealsAgg._sum.value != null ? Number(openDealsAgg._sum.value) : 0;

      return {
        stats: {
          contactsCount,
          dealsCount,
          openDealsValue: openValue,
          tasksTodo,
          tasksDone,
          projectsCount,
        },
        recentActivities: recentActivities.map((a) => ({
          id: a.id,
          action: String(a.action),
          entityType: String(a.entityType),
          entityTitle: a.entityTitle,
          memberName: a.member?.user?.name ?? "Unknown",
          createdAt: a.createdAt.toISOString(),
        })),
        recentDeals: recentDeals.map((d) => ({
          id: d.id,
          title: d.title,
          value: d.value != null ? Number(d.value) : null,
          currency: d.currency,
          stageName: d.stage.name,
          stageColor: d.stage.color,
          contactName:
            d.contact?.firstName || d.contact?.lastName
              ? [d.contact.firstName, d.contact.lastName].filter(Boolean).join(" ")
              : d.contact?.companyName ?? null,
          updatedAt: d.updatedAt,
        })),
        recentTasks: recentTasks.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          dueAt: t.dueAt,
          assigneeName: t.assignee?.user.name ?? null,
          projectName: t.project?.name ?? null,
          projectSlug: t.project?.slug ?? null,
          updatedAt: t.updatedAt,
        })),
      };
    },
    { requireAuth: true, requireActiveOrg: true }
  );
