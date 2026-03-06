import { Elysia } from "elysia";
import { prisma } from "../db/prisma";
import { authPlugin } from "../plugins/auth.plugin";
import { ActivityAction, ActivityEntityType } from "../../prisma/generated/prisma/enums";

const orgScope = (activeOrganizationId: string) => ({ organizationId: activeOrganizationId });

const validActions = Object.values(ActivityAction) as string[];
const validEntityTypes = Object.values(ActivityEntityType) as string[];

export const activitiesRoutes = new Elysia({ prefix: "/activities" })
  .use(authPlugin)
  .get(
    "/",
    async ({ activeOrganizationId, query }) => {
      const page = Math.max(1, Number(query?.page) || 1);
      const pageSize = Math.min(100, Math.max(1, Number(query?.pageSize) || 20));
      const skip = (page - 1) * pageSize;

      const action = typeof query?.action === "string" && validActions.includes(query.action) ? query.action : undefined;
      const entityType = typeof query?.entityType === "string" && validEntityTypes.includes(query.entityType) ? query.entityType : undefined;
      const memberId = typeof query?.memberId === "string" && query.memberId.trim() !== "" ? query.memberId.trim() : undefined;
      const entityId = typeof query?.entityId === "string" && query.entityId.trim() !== "" ? query.entityId.trim() : undefined;
      const search = typeof query?.search === "string" ? query.search.trim() : "";
      const dateFrom = typeof query?.dateFrom === "string" && query.dateFrom.trim() !== "" ? new Date(query.dateFrom) : undefined;
      const dateTo = typeof query?.dateTo === "string" && query.dateTo.trim() !== "" ? new Date(query.dateTo) : undefined;

      const where = {
        ...orgScope(activeOrganizationId!),
        ...(action && { action: action as (typeof ActivityAction)[keyof typeof ActivityAction] }),
        ...(entityType && { entityType: entityType as (typeof ActivityEntityType)[keyof typeof ActivityEntityType] }),
        ...(memberId && { memberId }),
        ...(entityId && { entityId }),
        ...(search && {
          OR: [
            { entityId: { contains: search, mode: "insensitive" as const } },
            { entityTitle: { contains: search, mode: "insensitive" as const } },
          ],
        }),
        ...((dateFrom || dateTo) && {
          createdAt: {
            ...(dateFrom && { gte: dateFrom }),
            ...(dateTo && { lte: dateTo }),
          },
        }),
      };

      const [data, total] = await Promise.all([
        prisma.activity.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: pageSize,
          include: {
            member: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
          },
        }),
        prisma.activity.count({ where }),
      ]);

      return { data, total, page, pageSize };
    },
    { requireAuth: true, requireActiveOrg: true }
  );
