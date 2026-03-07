import { Elysia } from "elysia";
import { prisma } from "../db/prisma";
import { authPlugin } from "../plugins/auth.plugin";
import { Prisma } from "../../prisma/generated/prisma/client";

export const metricsRoutes = new Elysia({ prefix: "/metrics" })
  .use(authPlugin)
  .get(
    "/deals-over-time",
    async ({ activeOrganizationId, query }) => {
      const days = Math.min(90, Math.max(7, Number(query?.days) || 30));
      const start = new Date();
      start.setDate(start.getDate() - days);
      start.setUTCHours(0, 0, 0, 0);

      const result = await prisma.$queryRaw<{ day: Date; count: bigint; value: unknown }[]>(
        Prisma.sql`
          SELECT
            date_trunc('day', "createdAt")::date AS day,
            count(*)::bigint AS count,
            coalesce(sum(value), 0) AS value
          FROM deals
          WHERE "organizationId" = ${activeOrganizationId!}
            AND "createdAt" >= ${start}
          GROUP BY 1
          ORDER BY 1 ASC
        `
      );

      const data = result.map((row) => ({
        date: row.day instanceof Date ? row.day.toISOString().slice(0, 10) : String(row.day),
        count: Number(row.count),
        value: row.value != null ? Number(row.value) : 0,
      }));

      return { data };
    },
    { requireAuth: true, requireActiveOrg: true }
  );
