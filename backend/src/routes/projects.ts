import { Elysia } from "elysia";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "../db/prisma";
import { authPlugin } from "../plugins/auth.plugin";

const orgScope = (activeOrganizationId: string) => ({ organizationId: activeOrganizationId });

const s3 =
  process.env.R2_ENDPOINT && process.env.AWS_ACCESS_KEY_ID
    ? new S3Client({
        region: "auto",
        endpoint: process.env.R2_ENDPOINT,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      })
    : null;
const R2_BUCKET = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_BASE_URL = process.env.R2_PUBLIC_BASE_URL ?? "";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type ProjectLink = { title: string; url: string };

function parseLinks(v: unknown): ProjectLink[] {
  if (!Array.isArray(v)) return [];
  return v.filter(
    (x): x is ProjectLink =>
      x != null && typeof x === "object" && typeof (x as ProjectLink).title === "string" && typeof (x as ProjectLink).url === "string"
  );
}

async function ensureProjectMember(projectId: string, memberId: string): Promise<{ project: Awaited<ReturnType<typeof prisma.project.findFirst>>; isMember: boolean } | null> {
  const project = await prisma.project.findFirst({ where: { id: projectId } });
  if (!project) return null;
  const pm = await prisma.projectMember.findUnique({
    where: { projectId_memberId: { projectId, memberId } },
  });
  return { project, isMember: !!pm };
}

export const projectsRoutes = new Elysia({ prefix: "/projects" })
  .use(authPlugin)
  .get(
    "/",
    async ({ activeOrganizationId, activeMember, query }) => {
      const page = Math.max(1, Number(query?.page) || 1);
      const pageSize = Math.min(100, Math.max(1, Number(query?.pageSize) || 10));
      const search = typeof query?.search === "string" ? query.search.trim() : "";
      const skip = (page - 1) * pageSize;
      const where = {
        ...orgScope(activeOrganizationId!),
        members: { some: { memberId: activeMember!.id } },
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { slug: { contains: search, mode: "insensitive" as const } },
          ],
        }),
      };
      const [data, total] = await Promise.all([
        prisma.project.findMany({
          where,
          orderBy: { updatedAt: "desc" },
          skip,
          take: pageSize,
        }),
        prisma.project.count({ where }),
      ]);
      return { data, total, page, pageSize };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .get(
    "/:id",
    async ({ params, activeOrganizationId, activeMember, set }) => {
      const project = await prisma.project.findFirst({
        where: { id: params.id, ...orgScope(activeOrganizationId!) },
        include: {
          tasks: true,
          members: { include: { member: { include: { user: { select: { id: true, name: true, email: true, image: true } } } } } },
          files: { include: { uploadedBy: { include: { user: { select: { id: true, name: true } } } } } },
        },
      });
      if (!project)
        return new Response(JSON.stringify({ message: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
      const isMember = project.members.some((m) => m.memberId === activeMember!.id);
      if (!isMember)
        return new Response(JSON.stringify({ message: "Access denied. Only project members can view this project." }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      return project;
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .post(
    "/",
    async ({ body, activeOrganizationId, activeMember }) => {
      const b = body as { name?: string; description?: string };
      const name = typeof b?.name === "string" ? b.name.trim() : "";
      if (!name) {
        return new Response(JSON.stringify({ message: "name is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      let slug = slugify(name);
      const existing = await prisma.project.findFirst({
        where: { organizationId: activeOrganizationId!, slug },
      });
      if (existing) slug = `${slug}-${Date.now().toString(36)}`;
      const project = await prisma.project.create({
        data: {
          organizationId: activeOrganizationId!,
          name,
          slug,
          description: typeof b?.description === "string" ? b.description.trim() || null : null,
          members: { create: { memberId: activeMember!.id } },
        },
      });
      return project;
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .patch(
    "/:id",
    async ({ params, body, activeOrganizationId, activeMember }) => {
      const result = await ensureProjectMember(params.id, activeMember!.id);
      if (!result)
        return new Response(JSON.stringify({ message: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
      if (!result.isMember)
        return new Response(JSON.stringify({ message: "Access denied. Only project members can edit." }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      const b = body as { name?: string; description?: string; links?: unknown };
      const updates: { name?: string; slug?: string; description?: string | null; links?: ProjectLink[] } = {};
      if (typeof b?.name === "string" && b.name.trim()) {
        updates.name = b.name.trim();
        updates.slug = slugify(updates.name);
      }
      if ("description" in b) updates.description = typeof b.description === "string" ? b.description.trim() || null : null;
      if (b?.links !== undefined) updates.links = parseLinks(b.links);
      const updated = await prisma.project.update({
        where: { id: params.id },
        data: updates,
      });
      return updated;
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .delete(
    "/:id",
    async ({ params, activeOrganizationId, activeMember }) => {
      const project = await prisma.project.findFirst({
        where: { id: params.id, ...orgScope(activeOrganizationId!) },
        include: { members: { where: { memberId: activeMember!.id } } },
      });
      if (!project)
        return new Response(JSON.stringify({ message: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
      const isMember = project.members.length > 0;
      if (!isMember)
        return new Response(JSON.stringify({ message: "Access denied" }), { status: 403, headers: { "Content-Type": "application/json" } });
      await prisma.project.delete({ where: { id: params.id } });
      return { ok: true };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .get(
    "/:id/members",
    async ({ params, activeOrganizationId, activeMember }) => {
      const project = await prisma.project.findFirst({
        where: { id: params.id, ...orgScope(activeOrganizationId!) },
        include: { members: { include: { member: { include: { user: { select: { id: true, name: true, email: true, image: true } } } } } } },
      });
      if (!project)
        return new Response(JSON.stringify({ message: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
      if (!project.members.some((m) => m.memberId === activeMember!.id))
        return new Response(JSON.stringify({ message: "Access denied" }), { status: 403, headers: { "Content-Type": "application/json" } });
      return project.members;
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .post(
    "/:id/members",
    async ({ params, body, activeOrganizationId, activeMember }) => {
      const result = await ensureProjectMember(params.id, activeMember!.id);
      if (!result)
        return new Response(JSON.stringify({ message: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
      if (!result.isMember)
        return new Response(JSON.stringify({ message: "Access denied" }), { status: 403, headers: { "Content-Type": "application/json" } });
      const memberId = (body as { memberId?: string })?.memberId;
      if (typeof memberId !== "string" || !memberId) {
        return new Response(JSON.stringify({ message: "memberId is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      const orgMember = await prisma.member.findFirst({
        where: { id: memberId, organizationId: activeOrganizationId! },
      });
      if (!orgMember)
        return new Response(JSON.stringify({ message: "Member not found in organization" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      const existing = await prisma.projectMember.findUnique({
        where: { projectId_memberId: { projectId: params.id, memberId } },
      });
      if (existing) return existing;
      const pm = await prisma.projectMember.create({
        data: { projectId: params.id, memberId },
        include: { member: { include: { user: { select: { id: true, name: true, email: true, image: true } } } } },
      });
      return pm;
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .delete(
    "/:id/members/:memberId",
    async ({ params, activeOrganizationId, activeMember }) => {
      const result = await ensureProjectMember(params.id, activeMember!.id);
      if (!result)
        return new Response(JSON.stringify({ message: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
      if (!result.isMember)
        return new Response(JSON.stringify({ message: "Access denied" }), { status: 403, headers: { "Content-Type": "application/json" } });
      await prisma.projectMember.deleteMany({
        where: { projectId: params.id, memberId: params.memberId },
      });
      return { ok: true };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .get(
    "/:id/files",
    async ({ params, activeOrganizationId, activeMember }) => {
      const result = await ensureProjectMember(params.id, activeMember!.id);
      if (!result)
        return new Response(JSON.stringify({ message: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
      if (!result.isMember)
        return new Response(JSON.stringify({ message: "Access denied" }), { status: 403, headers: { "Content-Type": "application/json" } });
      const files = await prisma.projectFile.findMany({
        where: { projectId: params.id },
        include: { uploadedBy: { include: { user: { select: { id: true, name: true } } } } },
        orderBy: { createdAt: "desc" },
      });
      return files;
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .post(
    "/:id/files",
    async ({ params, request, activeOrganizationId, activeMember }) => {
      const result = await ensureProjectMember(params.id, activeMember!.id);
      if (!result)
        return new Response(JSON.stringify({ message: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
      if (!result.isMember)
        return new Response(JSON.stringify({ message: "Access denied" }), { status: 403, headers: { "Content-Type": "application/json" } });
      const contentType = request.headers.get("content-type") ?? "";
      let fileName: string;
      let fileUrl: string;
      let fileType: string | null = null;
      let fileSize: number | null = null;

      if (contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        const file = formData.get("file");
        if (!file || typeof file === "string") {
          return new Response(JSON.stringify({ message: "file is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        const f = file as File;
        fileName = f.name || `file-${Date.now()}`;
        const body = await f.arrayBuffer();
        fileSize = body.byteLength;
        fileType = f.type || null;
        if (s3 && R2_BUCKET) {
          const ext = fileName.includes(".") ? fileName.slice(fileName.lastIndexOf(".")) : "";
          const key = `projects/${params.id}/${Date.now()}${ext}`;
          await s3.send(
            new PutObjectCommand({
              Bucket: R2_BUCKET,
              Key: key,
              Body: new Uint8Array(body),
              ContentType: fileType || "application/octet-stream",
            })
          );
          fileUrl = R2_PUBLIC_BASE_URL ? `${R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}` : key;
        } else {
          fileUrl = "";
        }
      } else {
        const b = (await request.json()) as { fileName?: string; fileUrl?: string; fileType?: string; fileSize?: number };
        fileName = typeof b?.fileName === "string" ? b.fileName : "";
        fileUrl = typeof b?.fileUrl === "string" ? b.fileUrl : "";
        if (!fileName || !fileUrl) {
          return new Response(JSON.stringify({ message: "fileName and fileUrl are required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        fileType = typeof b?.fileType === "string" ? b.fileType : null;
        fileSize = typeof b?.fileSize === "number" ? b.fileSize : null;
      }

      const pf = await prisma.projectFile.create({
        data: {
          projectId: params.id,
          fileName,
          fileUrl,
          fileType,
          fileSize,
          uploadedById: activeMember!.id,
        },
      });
      return pf;
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .delete(
    "/:id/files/:fileId",
    async ({ params, activeOrganizationId, activeMember }) => {
      const result = await ensureProjectMember(params.id, activeMember!.id);
      if (!result)
        return new Response(JSON.stringify({ message: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
      if (!result.isMember)
        return new Response(JSON.stringify({ message: "Access denied" }), { status: 403, headers: { "Content-Type": "application/json" } });
      const file = await prisma.projectFile.findFirst({
        where: { id: params.fileId, projectId: params.id },
      });
      if (!file)
        return new Response(JSON.stringify({ message: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
      await prisma.projectFile.delete({ where: { id: params.fileId } });
      return { ok: true };
    },
    { requireAuth: true, requireActiveOrg: true }
  );
