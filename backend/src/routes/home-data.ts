import { Elysia } from "elysia";
import { prisma } from "../db/prisma";
import { authPlugin } from "../plugins/auth.plugin";

const orgScope = (activeOrganizationId: string) => ({ organizationId: activeOrganizationId });

const OPEN_STATUSES = ["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED"] as const;

export const homeDataRoutes = new Elysia()
  .use(authPlugin)
  .get(
    "/home-data",
    async ({ activeOrganizationId, activeMember }) => {
      const orgId = activeOrganizationId!;
      const memberId = activeMember?.id ?? "";

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);

      const [
        tasksCounts,
        myTasks,
        projects,
        recentActivities,
        teamMembers,
        todayMeetings,
        unreadNotifications,
        mentions,
      ] = await Promise.all([
        prisma.task.groupBy({
          by: ["status"],
          where: orgScope(orgId),
          _count: true,
        }),
        prisma.task.findMany({
          where: {
            ...orgScope(orgId),
            assigneeId: memberId,
            status: { in: [...OPEN_STATUSES] },
          },
          orderBy: [{ dueAt: { sort: "asc", nulls: "last" } }, { priority: "desc" }],
          take: 8,
          include: { project: { select: { name: true, slug: true } } },
        }),
        prisma.project.findMany({
          where: orgScope(orgId),
          orderBy: { updatedAt: "desc" },
          take: 6,
          include: {
            _count: { select: { members: true } },
            tasks: { select: { status: true } },
          },
        }),
        prisma.activity.findMany({
          where: orgScope(orgId),
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            member: { select: { user: { select: { name: true, image: true } } } },
          },
        }),
        prisma.member.findMany({
          where: orgScope(orgId),
          select: {
            id: true,
            statusEmoji: true,
            statusText: true,
            workingOn: true,
            lastSeenAt: true,
            user: { select: { name: true, image: true } },
          },
          take: 20,
        }),
        prisma.meeting.findMany({
          where: { ...orgScope(orgId), startsAt: { gte: startOfDay, lt: endOfDay } },
          orderBy: { startsAt: "asc" },
          take: 5,
          select: { id: true, code: true, title: true, startsAt: true, endsAt: true },
        }),
        memberId
          ? prisma.notification.count({
              where: { recipientId: memberId, readAt: null, archivedAt: null },
            })
          : 0,
        memberId
          ? prisma.notification.findMany({
              where: { recipientId: memberId, type: "MENTION", archivedAt: null },
              orderBy: { createdAt: "desc" },
              take: 4,
              select: { id: true, title: true, body: true, link: true, readAt: true, createdAt: true },
            })
          : [],
      ]);

      const countOf = (status: string) => tasksCounts.find((t) => t.status === status)?._count ?? 0;

      return {
        stats: {
          tasksTodo: countOf("TODO"),
          tasksInProgress: countOf("IN_PROGRESS"),
          tasksInReview: countOf("IN_REVIEW"),
          tasksBlocked: countOf("BLOCKED"),
          tasksDone: countOf("DONE"),
          projectsCount: projects.length,
          unreadNotifications,
        },
        myTasks: myTasks.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          labels: t.labels,
          dueAt: t.dueAt,
          projectName: t.project?.name ?? null,
          projectSlug: t.project?.slug ?? null,
        })),
        todaysFocus: myTasks
          .filter((t) => t.dueAt && t.dueAt < endOfDay)
          .map((t) => ({ id: t.id, title: t.title, status: t.status, priority: t.priority, dueAt: t.dueAt })),
        projects: projects.map((p) => {
          const total = p.tasks.length;
          const done = p.tasks.filter((t) => t.status === "DONE").length;
          return {
            id: p.id,
            name: p.name,
            slug: p.slug,
            memberCount: p._count.members,
            taskCount: total,
            doneCount: done,
            progress: total > 0 ? Math.round((done / total) * 100) : 0,
          };
        }),
        recentActivities: recentActivities.map((a) => ({
          id: a.id,
          action: String(a.action),
          entityType: String(a.entityType),
          entityTitle: a.entityTitle,
          memberName: a.member?.user?.name ?? "Unknown",
          memberImage: a.member?.user?.image ?? null,
          createdAt: a.createdAt.toISOString(),
        })),
        team: teamMembers.map((m) => ({
          id: m.id,
          name: m.user.name,
          image: m.user.image,
          statusEmoji: m.statusEmoji,
          statusText: m.statusText,
          workingOn: m.workingOn,
          lastSeenAt: m.lastSeenAt,
        })),
        todayMeetings,
        mentions,
      };
    },
    { requireAuth: true, requireActiveOrg: true }
  );
