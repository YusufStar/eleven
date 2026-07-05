import { Elysia } from "elysia";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "../db/prisma";
import { authPlugin } from "../plugins/auth.plugin";
import { logActivity } from "../lib/activity-log";
import { notify } from "../lib/notify";
import { ActivityAction, ActivityEntityType } from "../../prisma/generated/prisma/enums";

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

const EXT_TO_MIME: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  zip: "application/zip",
  json: "application/json",
  txt: "text/plain",
  md: "text/markdown",
};

function inferFileType(fileName: string, existingType: string | null): string | null {
  if (existingType?.trim()) return existingType.trim();
  if (!fileName?.includes(".")) return null;
  const ext = fileName.slice(fileName.lastIndexOf(".") + 1).toLowerCase();
  return EXT_TO_MIME[ext] ?? null;
}

async function ensureProjectMember(
  projectId: string,
  memberId: string,
  organizationId: string | null | undefined
): Promise<{ project: Awaited<ReturnType<typeof prisma.project.findFirst>>; isMember: boolean } | null> {
  if (!projectId?.trim()) return null;
  const project = await prisma.project.findFirst({
    where: {
      id: projectId.trim(),
      ...(organizationId ? orgScope(organizationId) : {}),
    },
  });
  if (!project) return null;
  const pm = await prisma.projectMember.findUnique({
    where: { projectId_memberId: { projectId: project.id, memberId } },
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
    "/detail/:idOrSlug",
    async ({ params, activeOrganizationId, activeMember, set }) => {
      const idOrSlug = decodeURIComponent(params.idOrSlug);
      const project = await prisma.project.findFirst({
        where: {
          ...orgScope(activeOrganizationId!),
          OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        },
        include: {
          tasks: { select: { id: true, title: true, status: true, priority: true, dueAt: true, completedAt: true }, orderBy: { createdAt: "desc" }, take: 50 },
          members: { include: { member: { include: { user: { select: { id: true, name: true, email: true, image: true } } } } } },
          files: { include: { uploadedBy: { include: { user: { select: { id: true, name: true } } } } }, orderBy: { createdAt: "desc" }, take: 50 },
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
      await logActivity({
        prisma,
        organizationId: activeOrganizationId!,
        memberId: activeMember!.id,
        action: ActivityAction.VIEW,
        entityType: ActivityEntityType.PROJECT,
        entityId: project.id,
        entityTitle: project.name,
      });
      return project;
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .get(
    "/:id",
    async ({ params, activeOrganizationId, activeMember, set }) => {
      const project = await prisma.project.findFirst({
        where: { id: params.id, ...orgScope(activeOrganizationId!) },
        include: {
          tasks: { select: { id: true, title: true, status: true, priority: true, dueAt: true, completedAt: true }, orderBy: { createdAt: "desc" }, take: 50 },
          members: { include: { member: { include: { user: { select: { id: true, name: true, email: true, image: true } } } } } },
          files: { include: { uploadedBy: { include: { user: { select: { id: true, name: true } } } } }, orderBy: { createdAt: "desc" }, take: 50 },
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
      await logActivity({
        prisma,
        organizationId: activeOrganizationId!,
        memberId: activeMember!.id,
        action: ActivityAction.VIEW,
        entityType: ActivityEntityType.PROJECT,
        entityId: project.id,
        entityTitle: project.name,
      });
      return project;
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .post(
    "/",
    async ({ body, activeOrganizationId, activeMember }) => {
      const b = body as { name?: string; description?: string; links?: unknown; githubRepoFullName?: string; githubRepoUrl?: string };
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
      const links = parseLinks(b?.links);
      const githubRepoFullName = typeof b?.githubRepoFullName === "string" ? b.githubRepoFullName.trim() || null : null;
      const githubRepoUrl = typeof b?.githubRepoUrl === "string" ? b.githubRepoUrl.trim() || null : null;
      const project = await prisma.project.create({
        data: {
          organizationId: activeOrganizationId!,
          name,
          slug,
          description: typeof b?.description === "string" ? b.description.trim() || null : null,
          links: links.length ? links : undefined,
          githubRepoFullName: githubRepoFullName || undefined,
          githubRepoUrl: githubRepoUrl || undefined,
          members: { create: { memberId: activeMember!.id } },
        },
      });
      await logActivity({
        prisma,
        organizationId: activeOrganizationId!,
        memberId: activeMember!.id,
        action: ActivityAction.CREATE,
        entityType: ActivityEntityType.PROJECT,
        entityId: project.id,
        entityTitle: project.name,
      });
      return project;
    },
    { requireAuth: true, requireActiveOrg: true, requirePaidOrg: true }
  )
  .patch(
    "/:id",
    async ({ params, body, activeMember, activeOrganizationId }) => {
      const result = await ensureProjectMember(params.id, activeMember!.id, activeOrganizationId);
      if (!result)
        return new Response(JSON.stringify({ message: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
      if (!result.isMember)
        return new Response(JSON.stringify({ message: "Access denied. Only project members can edit." }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      const b = body as { name?: string; description?: string; links?: unknown; githubRepoFullName?: string; githubRepoUrl?: string };
      const updates: { name?: string; slug?: string; description?: string | null; links?: ProjectLink[]; githubRepoFullName?: string | null; githubRepoUrl?: string | null } = {};
      if (typeof b?.name === "string" && b.name.trim()) {
        updates.name = b.name.trim();
        updates.slug = slugify(updates.name);
      }
      if ("description" in b) updates.description = typeof b.description === "string" ? b.description.trim() || null : null;
      if (b?.links !== undefined) updates.links = parseLinks(b.links);
      if ("githubRepoFullName" in b) updates.githubRepoFullName = typeof b.githubRepoFullName === "string" ? b.githubRepoFullName.trim() || null : null;
      if ("githubRepoUrl" in b) updates.githubRepoUrl = typeof b.githubRepoUrl === "string" ? b.githubRepoUrl.trim() || null : null;
      const updated = await prisma.project.update({
        where: { id: params.id },
        data: updates,
      });
      await logActivity({
        prisma,
        organizationId: activeOrganizationId!,
        memberId: activeMember!.id,
        action: ActivityAction.UPDATE,
        entityType: ActivityEntityType.PROJECT,
        entityId: updated.id,
        entityTitle: updated.name,
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
      const entityTitle = project.name;
      await prisma.project.delete({ where: { id: params.id } });
      await logActivity({
        prisma,
        organizationId: activeOrganizationId!,
        memberId: activeMember!.id,
        action: ActivityAction.DELETE,
        entityType: ActivityEntityType.PROJECT,
        entityId: params.id,
        entityTitle,
        metadata: { deleted: entityTitle },
      });
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
      const result = await ensureProjectMember(params.id, activeMember!.id, activeOrganizationId);
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
      await logActivity({
        prisma,
        organizationId: activeOrganizationId!,
        memberId: activeMember!.id,
        action: ActivityAction.CREATE,
        entityType: ActivityEntityType.PROJECT_MEMBER,
        entityId: pm.id,
        entityTitle: null,
        metadata: { projectId: params.id, memberId },
      });
      const project = await prisma.project.findUnique({
        where: { id: params.id },
        select: { name: true, slug: true },
      });
      await notify({
        prisma,
        organizationId: activeOrganizationId!,
        recipientIds: [memberId],
        actorId: activeMember!.id,
        type: "PROJECT_MEMBER_ADDED",
        title: "You were added to a project",
        body: project?.name ?? null,
        link: project ? `/dashboard/projects/${project.slug}` : "/dashboard/projects",
      });
      return pm;
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .delete(
    "/:id/members/:memberId",
    async ({ params, activeOrganizationId, activeMember }) => {
      const result = await ensureProjectMember(params.id, activeMember!.id, activeOrganizationId);
      if (!result)
        return new Response(JSON.stringify({ message: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
      if (!result.isMember)
        return new Response(JSON.stringify({ message: "Access denied" }), { status: 403, headers: { "Content-Type": "application/json" } });
      await prisma.projectMember.deleteMany({
        where: { projectId: params.id, memberId: params.memberId },
      });
      await logActivity({
        prisma,
        organizationId: activeOrganizationId!,
        memberId: activeMember!.id,
        action: ActivityAction.DELETE,
        entityType: ActivityEntityType.PROJECT_MEMBER,
        entityId: params.memberId,
        metadata: { projectId: params.id },
      });
      return { ok: true };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .get(
    "/:id/files",
    async ({ params, query, activeOrganizationId, activeMember }) => {
      const result = await ensureProjectMember(params.id, activeMember!.id, activeOrganizationId);
      if (!result)
        return new Response(JSON.stringify({ message: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
      if (!result.isMember)
        return new Response(JSON.stringify({ message: "Access denied" }), { status: 403, headers: { "Content-Type": "application/json" } });
      const search = typeof query?.search === "string" ? query.search.trim() : "";
      const files = await prisma.projectFile.findMany({
        where: {
          projectId: params.id,
          ...(search ? { fileName: { contains: search, mode: "insensitive" } } : {}),
        },
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
      if (!params.id?.trim()) {
        return new Response(JSON.stringify({ message: "Project ID is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
      const result = await ensureProjectMember(params.id, activeMember!.id, activeOrganizationId ?? undefined);
      if (!result)
        return new Response(JSON.stringify({ message: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
      if (!result.isMember)
        return new Response(JSON.stringify({ message: "Access denied" }), { status: 403, headers: { "Content-Type": "application/json" } });
      const contentType = request.headers.get("content-type") ?? "";
      let fileName: string;
      let fileUrl: string;
      let fileType: string | null = null;
      let fileSize: number | null = null;
      let folder = "/";

      if (contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        const file = formData.get("file");
        const rawFolder = formData.get("folder");
        if (typeof rawFolder === "string") folder = rawFolder;
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
        const b = (await request.json()) as { fileName?: string; fileUrl?: string; fileType?: string; fileSize?: number; folder?: string };
        fileName = typeof b?.fileName === "string" ? b.fileName : "";
        fileUrl = typeof b?.fileUrl === "string" ? b.fileUrl : "";
        if (typeof b?.folder === "string") folder = b.folder;
        if (!fileName || !fileUrl) {
          return new Response(JSON.stringify({ message: "fileName and fileUrl are required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        fileType = typeof b?.fileType === "string" ? b.fileType : null;
        fileSize = typeof b?.fileSize === "number" ? b.fileSize : null;
      }

      // normalize folder path: "/design/specs" style, no trailing slash (except root)
      folder = "/" + folder.split("/").map((s) => s.trim()).filter(Boolean).join("/");
      folder = folder.slice(0, 255);

      const normalizedType = inferFileType(fileName, fileType);
      // Same name in the same folder = new version: keep one row, push the old file into versionHistory.
      const previous = await prisma.projectFile.findFirst({
        where: { projectId: params.id, fileName, folder },
      });
      const pf = previous
        ? await prisma.projectFile.update({
            where: { id: previous.id },
            data: {
              fileUrl,
              fileType: normalizedType,
              fileSize,
              uploadedById: activeMember!.id,
              versionHistory: [
                ...(Array.isArray(previous.versionHistory) ? previous.versionHistory : []),
                {
                  fileUrl: previous.fileUrl,
                  fileSize: previous.fileSize,
                  uploadedById: previous.uploadedById,
                  uploadedAt: previous.updatedAt.toISOString(),
                },
              ] as object[],
            },
          })
        : await prisma.projectFile.create({
            data: {
              projectId: params.id,
              fileName,
              fileUrl,
              fileType: normalizedType,
              fileSize,
              folder,
              uploadedById: activeMember!.id,
            },
          });
      await logActivity({
        prisma,
        organizationId: activeOrganizationId!,
        memberId: activeMember!.id,
        action: ActivityAction.CREATE,
        entityType: ActivityEntityType.PROJECT_FILE,
        entityId: pf.id,
        entityTitle: pf.fileName,
        metadata: { projectId: params.id },
      });
      const [projectMembers, project] = await Promise.all([
        prisma.projectMember.findMany({ where: { projectId: params.id }, select: { memberId: true } }),
        prisma.project.findUnique({ where: { id: params.id }, select: { name: true, slug: true } }),
      ]);
      await notify({
        prisma,
        organizationId: activeOrganizationId!,
        recipientIds: projectMembers.map((m) => m.memberId),
        actorId: activeMember!.id,
        type: "PROJECT_FILE_ADDED",
        title: `New file in ${project?.name ?? "your project"}`,
        body: pf.fileName,
        link: project ? `/dashboard/projects/${project.slug}` : "/dashboard/projects",
      });
      return pf;
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .get(
    "/:id/files/:fileId/download",
    async ({ params, activeOrganizationId, activeMember }) => {
      const result = await ensureProjectMember(params.id, activeMember!.id, activeOrganizationId);
      if (!result)
        return new Response(JSON.stringify({ message: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
      if (!result.isMember)
        return new Response(JSON.stringify({ message: "Access denied" }), { status: 403, headers: { "Content-Type": "application/json" } });
      const file = await prisma.projectFile.findFirst({
        where: { id: params.fileId, projectId: params.id },
      });
      if (!file)
        return new Response(JSON.stringify({ message: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
      await logActivity({
        prisma,
        organizationId: activeOrganizationId!,
        memberId: activeMember!.id,
        action: ActivityAction.VIEW,
        entityType: ActivityEntityType.PROJECT_FILE,
        entityId: file.id,
        entityTitle: file.fileName,
        metadata: { projectId: params.id },
      });
      try {
        const res = await fetch(file.fileUrl, { redirect: "follow" });
        if (!res.ok)
          return new Response(JSON.stringify({ message: "Failed to fetch file" }), { status: 502, headers: { "Content-Type": "application/json" } });
        const filename = file.fileName.replace(/[^\w.\- ]/g, "_");
        const disposition = `attachment; filename="${filename}"`;
        return new Response(res.body, {
          status: 200,
          headers: {
            "Content-Disposition": disposition,
            "Content-Type": res.headers.get("Content-Type") ?? "application/octet-stream",
          },
        });
      } catch {
        return new Response(JSON.stringify({ message: "Failed to fetch file" }), { status: 502, headers: { "Content-Type": "application/json" } });
      }
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .delete(
    "/:id/files/:fileId",
    async ({ params, activeOrganizationId, activeMember }) => {
      const result = await ensureProjectMember(params.id, activeMember!.id, activeOrganizationId);
      if (!result)
        return new Response(JSON.stringify({ message: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
      if (!result.isMember)
        return new Response(JSON.stringify({ message: "Access denied" }), { status: 403, headers: { "Content-Type": "application/json" } });
      const file = await prisma.projectFile.findFirst({
        where: { id: params.fileId, projectId: params.id },
      });
      if (!file)
        return new Response(JSON.stringify({ message: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
      const entityTitle = file.fileName;
      await prisma.projectFile.delete({ where: { id: params.fileId } });
      await logActivity({
        prisma,
        organizationId: activeOrganizationId!,
        memberId: activeMember!.id,
        action: ActivityAction.DELETE,
        entityType: ActivityEntityType.PROJECT_FILE,
        entityId: params.fileId,
        entityTitle,
        metadata: { projectId: params.id, deleted: entityTitle },
      });
      return { ok: true };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  // ─── Milestones ─────────────────────────────────
  .get(
    "/:id/milestones",
    async ({ params, activeOrganizationId, activeMember }) => {
      const result = await ensureProjectMember(params.id, activeMember!.id, activeOrganizationId);
      if (!result)
        return new Response(JSON.stringify({ message: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
      if (!result.isMember)
        return new Response(JSON.stringify({ message: "Access denied" }), { status: 403, headers: { "Content-Type": "application/json" } });
      const milestones = await prisma.milestone.findMany({
        where: { projectId: params.id },
        include: { tasks: { select: { status: true } } },
        orderBy: [{ dueAt: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
      });
      return milestones.map((m) => ({
        id: m.id,
        name: m.name,
        description: m.description,
        dueAt: m.dueAt,
        completedAt: m.completedAt,
        taskCount: m.tasks.length,
        doneCount: m.tasks.filter((t) => t.status === "DONE").length,
      }));
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .post(
    "/:id/milestones",
    async ({ params, body, activeOrganizationId, activeMember }) => {
      const result = await ensureProjectMember(params.id, activeMember!.id, activeOrganizationId);
      if (!result)
        return new Response(JSON.stringify({ message: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
      if (!result.isMember)
        return new Response(JSON.stringify({ message: "Access denied" }), { status: 403, headers: { "Content-Type": "application/json" } });
      const b = body as { name?: string; description?: string | null; dueAt?: string | null };
      const name = typeof b.name === "string" ? b.name.trim().slice(0, 120) : "";
      if (!name)
        return new Response(JSON.stringify({ message: "Name is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
      const milestone = await prisma.milestone.create({
        data: {
          projectId: params.id,
          name,
          description: typeof b.description === "string" ? b.description.trim().slice(0, 1000) || null : null,
          dueAt: b.dueAt ? new Date(b.dueAt) : null,
        },
      });
      await logActivity({
        prisma,
        organizationId: activeOrganizationId!,
        memberId: activeMember!.id,
        action: ActivityAction.CREATE,
        entityType: ActivityEntityType.MILESTONE,
        entityId: milestone.id,
        entityTitle: milestone.name,
        metadata: { projectId: params.id },
      });
      return milestone;
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .patch(
    "/:id/milestones/:milestoneId",
    async ({ params, body, activeOrganizationId, activeMember }) => {
      const result = await ensureProjectMember(params.id, activeMember!.id, activeOrganizationId);
      if (!result || !result.isMember)
        return new Response(JSON.stringify({ message: result ? "Access denied" : "Not found" }), { status: result ? 403 : 404, headers: { "Content-Type": "application/json" } });
      const existing = await prisma.milestone.findFirst({ where: { id: params.milestoneId, projectId: params.id } });
      if (!existing)
        return new Response(JSON.stringify({ message: "Milestone not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
      const b = body as { name?: string; description?: string | null; dueAt?: string | null; completed?: boolean };
      const data: Record<string, unknown> = {};
      if (typeof b.name === "string" && b.name.trim()) data.name = b.name.trim().slice(0, 120);
      if (b.description !== undefined) data.description = typeof b.description === "string" ? b.description.trim().slice(0, 1000) || null : null;
      if (b.dueAt !== undefined) data.dueAt = b.dueAt ? new Date(b.dueAt) : null;
      if (b.completed !== undefined) data.completedAt = b.completed ? new Date() : null;
      return prisma.milestone.update({ where: { id: existing.id }, data });
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .delete(
    "/:id/milestones/:milestoneId",
    async ({ params, activeOrganizationId, activeMember, set }) => {
      const result = await ensureProjectMember(params.id, activeMember!.id, activeOrganizationId);
      if (!result || !result.isMember) {
        set.status = result ? 403 : 404;
        return { message: result ? "Access denied" : "Not found" };
      }
      await prisma.milestone.deleteMany({ where: { id: params.milestoneId, projectId: params.id } });
      return { ok: true };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  // ─── Insights: progress, health, burndown, velocity ─
  .get(
    "/:id/insights",
    async ({ params, activeOrganizationId, activeMember }) => {
      const result = await ensureProjectMember(params.id, activeMember!.id, activeOrganizationId);
      if (!result)
        return new Response(JSON.stringify({ message: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
      if (!result.isMember)
        return new Response(JSON.stringify({ message: "Access denied" }), { status: 403, headers: { "Content-Type": "application/json" } });

      const tasks = await prisma.task.findMany({
        where: { projectId: params.id },
        select: { status: true, dueAt: true, completedAt: true, createdAt: true, estimate: true },
      });
      const total = tasks.length;
      const done = tasks.filter((t) => t.status === "DONE").length;
      const blocked = tasks.filter((t) => t.status === "BLOCKED").length;
      const now = new Date();
      const overdue = tasks.filter(
        (t) => t.dueAt && t.dueAt < now && t.status !== "DONE" && t.status !== "CANCELLED"
      ).length;
      const progress = total > 0 ? Math.round((done / total) * 100) : 0;

      // health heuristic: blocked/overdue share drives at-risk / off-track
      const troubled = total > 0 ? (blocked + overdue) / total : 0;
      const health = total === 0 ? "no-data" : troubled >= 0.3 ? "off-track" : troubled >= 0.12 ? "at-risk" : "on-track";

      // last 8 weeks: created vs completed (burnup-style) + completed points (velocity)
      const weeks: { week: string; created: number; completed: number; points: number }[] = [];
      for (let i = 7; i >= 0; i--) {
        const startW = new Date(now);
        startW.setDate(startW.getDate() - startW.getDay() - i * 7);
        startW.setHours(0, 0, 0, 0);
        const endW = new Date(startW);
        endW.setDate(endW.getDate() + 7);
        const createdW = tasks.filter((t) => t.createdAt >= startW && t.createdAt < endW).length;
        const completedTasks = tasks.filter((t) => t.completedAt && t.completedAt >= startW && t.completedAt < endW);
        weeks.push({
          week: startW.toISOString().slice(0, 10),
          created: createdW,
          completed: completedTasks.length,
          points: completedTasks.reduce((sum, t) => sum + (t.estimate ?? 0), 0),
        });
      }

      return {
        total,
        done,
        blocked,
        overdue,
        inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
        inReview: tasks.filter((t) => t.status === "IN_REVIEW").length,
        todo: tasks.filter((t) => t.status === "TODO").length,
        progress,
        health,
        weeks,
      };
    },
    { requireAuth: true, requireActiveOrg: true }
  );
