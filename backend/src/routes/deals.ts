import { Elysia } from "elysia";
import { prisma } from "../db/prisma";
import { authPlugin } from "../plugins/auth.plugin";

const orgScope = (activeOrganizationId: string) => ({ organizationId: activeOrganizationId });

export const dealsRoutes = new Elysia({ prefix: "/deals" })
  .use(authPlugin)
  .get(
    "/pipelines",
    async ({ activeOrganizationId }) => {
      const pipelines = await prisma.pipeline.findMany({
        where: orgScope(activeOrganizationId!),
        orderBy: { createdAt: "asc" },
        include: { stages: { orderBy: { order: "asc" } } },
      });
      return { data: pipelines };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .post(
    "/pipelines",
    async ({ body, activeOrganizationId }) => {
      const name = typeof (body as { name?: string })?.name === "string"
        ? (body as { name: string }).name.trim()
        : "Sales";
      const pipeline = await prisma.pipeline.create({
        data: {
          organizationId: activeOrganizationId!,
          name,
          isDefault: false,
          stages: { create: { name: "New", order: 0 } },
        },
        include: { stages: true },
      });
      return pipeline;
    },
    { requireAuth: true, requireActiveOrg: true, requireAdmin: true }
  )
  .get(
    "/pipelines/:id",
    async ({ params, activeOrganizationId, set }) => {
      const pipeline = await prisma.pipeline.findFirst({
        where: { id: params.id, ...orgScope(activeOrganizationId!) },
        include: { stages: { orderBy: { order: "asc" } } },
      });
      if (!pipeline) {
        set.status = 404;
        return { message: "Not found" };
      }
      return pipeline;
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .post(
    "/pipelines/:id/stages",
    async ({ params, body, activeOrganizationId, set }) => {
      const pipeline = await prisma.pipeline.findFirst({
        where: { id: params.id, ...orgScope(activeOrganizationId!) },
        include: { stages: { orderBy: { order: "desc" }, take: 1 } },
      });
      if (!pipeline) {
        set.status = 404;
        return { message: "Pipeline not found" };
      }
      const b = body as { name?: string; color?: string };
      const name = typeof b?.name === "string" ? b.name.trim() : "New stage";
      const order = pipeline.stages[0] ? pipeline.stages[0].order + 1 : 0;
      const color = typeof b?.color === "string" ? b.color.trim() || null : null;
      const stage = await prisma.stage.create({
        data: { pipelineId: params.id, name, order, color },
      });
      return stage;
    },
    { requireAuth: true, requireActiveOrg: true, requireAdmin: true }
  )
  .patch(
    "/stages/:id",
    async ({ params, body, activeOrganizationId, set }) => {
      const stage = await prisma.stage.findFirst({
        where: { id: params.id, pipeline: orgScope(activeOrganizationId!) },
      });
      if (!stage) {
        set.status = 404;
        return { message: "Not found" };
      }
      const b = body as { name?: string; order?: number; color?: string | null };
      const updates: { name?: string; order?: number; color?: string | null } = {};
      if (typeof b?.name === "string") updates.name = b.name.trim();
      if (typeof b?.order === "number") updates.order = b.order;
      if ("color" in b) updates.color = typeof b.color === "string" ? b.color.trim() || null : null;
      const updated = await prisma.stage.update({
        where: { id: params.id },
        data: updates,
      });
      return updated;
    },
    { requireAuth: true, requireActiveOrg: true, requireAdmin: true }
  )
  .delete(
    "/stages/:id",
    async ({ params, activeOrganizationId, set }) => {
      const stage = await prisma.stage.findFirst({
        where: { id: params.id, pipeline: orgScope(activeOrganizationId!) },
        include: { _count: { select: { deals: true } } },
      });
      if (!stage) {
        set.status = 404;
        return { message: "Not found" };
      }
      if (stage._count.deals > 0) {
        set.status = 400;
        return { message: "Cannot delete stage with deals. Move deals first." };
      }
      await prisma.stage.delete({ where: { id: params.id } });
      return { ok: true };
    },
    { requireAuth: true, requireActiveOrg: true, requireAdmin: true }
  )
  .get(
    "/",
    async ({ activeOrganizationId, query }) => {
      const page = Math.max(1, Number(query?.page) || 1);
      const pageSize = Math.min(100, Math.max(1, Number(query?.pageSize) || 10));
      const pipelineId = typeof query?.pipelineId === "string" ? query.pipelineId : undefined;
      const stageId = typeof query?.stageId === "string" ? query.stageId : undefined;
      const contactId = typeof query?.contactId === "string" ? query.contactId : undefined;
      const status = typeof query?.status === "string" ? query.status : undefined;
      const search = typeof query?.search === "string" ? query.search.trim() : "";
      const skip = (page - 1) * pageSize;
      const validStatuses = ["OPEN", "WON", "LOST"] as const;
      const where = {
        ...orgScope(activeOrganizationId!),
        ...(pipelineId && { pipelineId }),
        ...(stageId && { stageId }),
        ...(contactId && { contactId }),
        ...(status && validStatuses.includes(status as (typeof validStatuses)[number]) && { status }),
        ...(search && { title: { contains: search, mode: "insensitive" as const } }),
      };
      const [data, total] = await Promise.all([
        prisma.deal.findMany({
          where,
          include: {
            stage: { select: { id: true, name: true, order: true, color: true } },
            pipeline: { select: { id: true, name: true } },
            contact: { select: { id: true, firstName: true, lastName: true, companyName: true, email: true } },
            owner: { select: { id: true, user: { select: { id: true, name: true } } } },
          },
          orderBy: { updatedAt: "desc" },
          skip,
          take: pageSize,
        }),
        prisma.deal.count({ where }),
      ]);
      return { data, total, page, pageSize };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .get(
    "/:id",
    async ({ params, activeOrganizationId, set }) => {
      const deal = await prisma.deal.findFirst({
        where: { id: params.id, ...orgScope(activeOrganizationId!) },
        include: {
          stage: true,
          pipeline: true,
          contact: true,
          owner: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
          activities: {
            select: {
              id: true,
              type: true,
              title: true,
              description: true,
              dueAt: true,
              isDone: true,
              completedAt: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 50,
          },
          tasks: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              dueAt: true,
              completedAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 50,
          },
        },
      });
      if (!deal) {
        set.status = 404;
        return { message: "Not found" };
      }
      return deal;
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .post(
    "/",
    async ({ body, activeOrganizationId, set }) => {
      const b = body as {
        title?: string;
        value?: number;
        currency?: string;
        probability?: number;
        expectedClose?: string;
        contactId?: string | null;
        stageId?: string;
        pipelineId?: string;
        ownerId?: string | null;
      };
      const title = typeof b?.title === "string" ? b.title.trim() : "";
      if (!title) {
        set.status = 400;
        return { message: "title is required" };
      }
      let stageId = typeof b?.stageId === "string" ? b.stageId : null;
      let pipelineId = typeof b?.pipelineId === "string" ? b.pipelineId : null;
      if (!stageId || !pipelineId) {
        const defaultPipeline = await prisma.pipeline.findFirst({
          where: orgScope(activeOrganizationId!),
          include: { stages: { orderBy: { order: "asc" }, take: 1 } },
        });
        if (!defaultPipeline || defaultPipeline.stages.length === 0) {
          set.status = 400;
          return { message: "No pipeline or stages. Create a pipeline with at least one stage first." };
        }
        pipelineId = pipelineId ?? defaultPipeline.id;
        stageId = stageId ?? defaultPipeline.stages[0].id;
      }
      const deal = await prisma.deal.create({
        data: {
          organizationId: activeOrganizationId!,
          title,
          stageId: stageId!,
          pipelineId: pipelineId!,
          value: typeof b?.value === "number" ? b.value : null,
          currency: typeof b?.currency === "string" ? b.currency : "TRY",
          probability: typeof b?.probability === "number" ? b.probability : 50,
          expectedClose: b?.expectedClose ? new Date(b.expectedClose) : null,
          contactId: b?.contactId ?? null,
          ownerId: b?.ownerId ?? null,
        },
      });
      return deal;
    },
    { requireAuth: true, requireActiveOrg: true, requireAdmin: true }
  )
  .patch(
    "/:id",
    async ({ params, body, activeOrganizationId, set }) => {
      const existing = await prisma.deal.findFirst({
        where: { id: params.id, ...orgScope(activeOrganizationId!) },
      });
      if (!existing) {
        set.status = 404;
        return { message: "Not found" };
      }
      const b = body as {
        title?: string;
        value?: number | null;
        currency?: string;
        probability?: number | null;
        expectedClose?: string | null;
        contactId?: string | null;
        stageId?: string;
        ownerId?: string | null;
        status?: string;
        lostReason?: string | null;
      };
      const updates: Record<string, unknown> = {};
      if (typeof b?.title === "string") updates.title = b.title.trim();
      if ("value" in b) updates.value = b.value;
      if (typeof b?.currency === "string") updates.currency = b.currency;
      if ("probability" in b) updates.probability = b.probability;
      if ("expectedClose" in b) updates.expectedClose = b.expectedClose ? new Date(b.expectedClose) : null;
      if ("contactId" in b) updates.contactId = b.contactId;
      if (typeof b?.stageId === "string") updates.stageId = b.stageId;
      if ("ownerId" in b) updates.ownerId = b.ownerId;
      if (typeof b?.status === "string") updates.status = b.status;
      if ("lostReason" in b) updates.lostReason = b.lostReason;
      const updated = await prisma.deal.update({
        where: { id: params.id },
        data: updates,
      });
      return updated;
    },
    { requireAuth: true, requireActiveOrg: true, requireAdmin: true }
  )
  .delete(
    "/:id",
    async ({ params, activeOrganizationId, set }) => {
      const existing = await prisma.deal.findFirst({
        where: { id: params.id, ...orgScope(activeOrganizationId!) },
      });
      if (!existing) {
        set.status = 404;
        return { message: "Not found" };
      }
      await prisma.deal.delete({ where: { id: params.id } });
      return { ok: true };
    },
    { requireAuth: true, requireActiveOrg: true, requireAdmin: true }
  );
