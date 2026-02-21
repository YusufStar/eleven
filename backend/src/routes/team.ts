import { Elysia } from "elysia";
import { prisma } from "../db/prisma";
import { authPlugin } from "../plugins/auth.plugin";

export const teamRoutes = new Elysia({ prefix: "/team" })
  .use(authPlugin)
  .get(
    "/members",
    async ({ activeOrganizationId, query }) => {
      const page = Math.max(1, Number(query?.page) || 1);
      const pageSize = Math.min(100, Math.max(1, Number(query?.pageSize) || 10));
      const search = typeof query?.search === "string" ? query.search.trim() : "";
      const role = typeof query?.role === "string" && query.role !== "" && query.role !== "all" ? query.role : undefined;
      const skip = (page - 1) * pageSize;
      const where = {
        organizationId: activeOrganizationId!,
        ...(role && { role }),
        ...(search && {
          user: {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
          },
        }),
      };
      const [data, total] = await Promise.all([
        prisma.member.findMany({
          where,
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
          orderBy: { createdAt: "asc" },
          skip,
          take: pageSize,
        }),
        prisma.member.count({ where }),
      ]);
      return { data, total, page, pageSize };
    },
    { requireAuth: true, requireActiveOrg: true }
  );
