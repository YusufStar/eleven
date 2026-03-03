import { Elysia } from "elysia";
import { prisma } from "../db/prisma";
import type { Prisma } from "../../prisma/generated/prisma/client";
import { authPlugin } from "../plugins/auth.plugin";

type ContactCreateBody = Omit<Prisma.ContactUncheckedCreateInput, "organizationId">;
type ContactUpdateBody = Omit<Prisma.ContactUncheckedUpdateInput, "organizationId">;
const orgScope = (activeOrganizationId: string) => ({ organizationId: activeOrganizationId });

export const contactsRoutes = new Elysia({ prefix: "/contacts" })
  .use(authPlugin)
  .get(
    "/people",
    async ({ activeOrganizationId, query }) => {
      const page = Math.max(1, Number(query?.page) || 1);
      const pageSize = Math.min(100, Math.max(1, Number(query?.pageSize) || 10));
      const search = typeof query?.search === "string" ? query.search.trim() : "";
      const status = typeof query?.status === "string" && query.status !== "" && query.status !== "all"
        ? (query.status as "LEAD" | "PROSPECT" | "CUSTOMER" | "CHURNED" | "PARTNER")
        : undefined;
      const skip = (page - 1) * pageSize;
      const where = {
        ...orgScope(activeOrganizationId!),
        type: "PERSON" as const,
        ...(status && { status }),
        ...(search && {
          OR: [
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }),
      };
      const [data, total] = await Promise.all([
        prisma.contact.findMany({
          where,
          orderBy: { updatedAt: "desc" },
          skip,
          take: pageSize,
        }),
        prisma.contact.count({ where }),
      ]);
      return { data, total, page, pageSize };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .get(
    "/companies",
    async ({ activeOrganizationId, query }) => {
      const page = Math.max(1, Number(query?.page) || 1);
      const pageSize = Math.min(100, Math.max(1, Number(query?.pageSize) || 10));
      const search = typeof query?.search === "string" ? query.search.trim() : "";
      const status = typeof query?.status === "string" && query.status !== "" && query.status !== "all"
        ? (query.status as "LEAD" | "PROSPECT" | "CUSTOMER" | "CHURNED" | "PARTNER")
        : undefined;
      const skip = (page - 1) * pageSize;
      const where = {
        ...orgScope(activeOrganizationId!),
        type: "COMPANY" as const,
        ...(search && { companyName: { contains: search, mode: "insensitive" as const } }),
        ...(status && { status }),
      };
      const [data, total] = await Promise.all([
        prisma.contact.findMany({
          where,
          orderBy: { updatedAt: "desc" },
          skip,
          take: pageSize,
        }),
        prisma.contact.count({ where }),
      ]);
      return { data, total, page, pageSize };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .get(
    "/people/:id",
    async ({ params, activeOrganizationId, set }) => {
      const contact = await prisma.contact.findFirst({
        where: { id: params.id, ...orgScope(activeOrganizationId!), type: "PERSON" },
        include: {
          company: { select: { id: true, companyName: true, website: true, industry: true, status: true, avatar: true } },
          deals: {
            select: {
              id: true,
              title: true,
              value: true,
              currency: true,
              status: true,
              stageId: true,
              expectedClose: true,
              stage: { select: { name: true, color: true } },
              pipeline: { select: { name: true } },
            },
          },
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
      if (!contact) {
        set.status = 404;
        return { message: "Not found" };
      }
      return {
        contact: {
          ...contact,
          company: contact.company,
          deals: contact.deals,
          activities: contact.activities,
          tasks: contact.tasks,
        },
        company: contact.company,
        deals: contact.deals,
        activities: contact.activities,
        tasks: contact.tasks,
      };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .get(
    "/companies/:id",
    async ({ params, activeOrganizationId, set }) => {
      const contact = await prisma.contact.findFirst({
        where: { id: params.id, ...orgScope(activeOrganizationId!), type: "COMPANY" },
        include: {
          employees: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              title: true,
              phone: true,
              status: true,
              avatar: true,
            },
          },
          deals: {
            select: {
              id: true,
              title: true,
              value: true,
              currency: true,
              status: true,
              stageId: true,
              expectedClose: true,
              stage: { select: { name: true, color: true } },
              pipeline: { select: { name: true } },
            },
          },
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
      if (!contact) {
        set.status = 404;
        return { message: "Not found" };
      }
      return {
        contact: {
          ...contact,
          employees: contact.employees,
          deals: contact.deals,
          activities: contact.activities,
          tasks: contact.tasks,
        },
        employees: contact.employees,
        deals: contact.deals,
        activities: contact.activities,
        tasks: contact.tasks,
      };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .get(
    "/get/:id",
    async ({ params, activeOrganizationId }) => {
      const contact = await prisma.contact.findFirst({
        where: { id: params.id, ...orgScope(activeOrganizationId!) },
      });
      if (!contact) return new Response(JSON.stringify({ message: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
      return contact;
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .post(
    "/create",
    async ({ body, activeOrganizationId }) => {
      const b = body as ContactCreateBody & {
        type?: string;
        firstName?: string;
        lastName?: string;
        email?: string;
        title?: string;
        companyName?: string;
      };
      const type = (b?.type === "COMPANY" ? "COMPANY" : "PERSON") as "PERSON" | "COMPANY";

      if (type === "COMPANY") {
        const companyName = typeof b?.companyName === "string" ? b.companyName.trim() : "";
        if (!companyName) {
          return new Response(
            JSON.stringify({ message: "companyName is required for company" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        const data: Prisma.ContactUncheckedCreateInput = {
          ...(body as ContactCreateBody),
          type: "COMPANY",
          organizationId: activeOrganizationId!,
          firstName: "",
          companyName: companyName || null,
        };
        const contact = await prisma.contact.create({ data });
        return contact;
      }

      const firstName = typeof b?.firstName === "string" ? b.firstName.trim() : "";
      const lastName = typeof b?.lastName === "string" ? b.lastName.trim() : "";
      const email = typeof b?.email === "string" ? b.email.trim() : "";
      const title = typeof b?.title === "string" ? b.title.trim() : "";
      if (!firstName || !lastName || !email || !title) {
        return new Response(
          JSON.stringify({ message: "firstName, lastName, email and title are required" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return new Response(
          JSON.stringify({ message: "Invalid email format" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      const data: Prisma.ContactUncheckedCreateInput = {
        ...(body as ContactCreateBody),
        organizationId: activeOrganizationId!,
      };
      const contact = await prisma.contact.create({ data });
      return contact;
    },
    { requireAuth: true, requireActiveOrg: true, requireAdmin: true }
  )
  .patch(
    "/update/:id",
    async ({ params, body, activeOrganizationId }) => {
      const existing = await prisma.contact.findFirst({
        where: { id: params.id, ...orgScope(activeOrganizationId!) },
      });
      if (!existing) return new Response(JSON.stringify({ message: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
      const { organizationId: _o, ...rest } = body as ContactUpdateBody & { organizationId?: string };
      const contact = await prisma.contact.update({
        where: { id: params.id },
        data: rest,
      });
      return contact;
    },
    { requireAuth: true, requireActiveOrg: true, requireAdmin: true }
  )
  .delete(
    "/delete/:id",
    async ({ params, activeOrganizationId }) => {
      const existing = await prisma.contact.findFirst({
        where: { id: params.id, ...orgScope(activeOrganizationId!) },
      });
      if (!existing) return new Response(JSON.stringify({ message: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
      await prisma.contact.delete({ where: { id: params.id } });
      return { ok: true };
    },
    { requireAuth: true, requireActiveOrg: true, requireAdmin: true }
  );
