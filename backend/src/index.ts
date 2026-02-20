import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { auth } from "./auth/auth";
import { authPlugin } from "./plugins/auth.plugin";
import { prisma } from "./db/prisma";
import type { Prisma } from "../prisma/generated/prisma/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

type ContactCreateBody = Omit<Prisma.ContactUncheckedCreateInput, "organizationId">;
type ContactUpdateBody = Omit<Prisma.ContactUncheckedUpdateInput, "organizationId">;
const orgScope = (activeOrganizationId: string) => ({ organizationId: activeOrganizationId });

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_BASE_URL = process.env.R2_PUBLIC_BASE_URL ?? "";

const app = new Elysia()
  .use(
    cors({
      origin: process.env.FRONTEND_URL!,
      credentials: true,
    })
  )
  .use(authPlugin)
  .get("/", () => {
    return "Hello World";
  })
  .get(
    "/contacts/people",
    async ({ activeOrganizationId, query }) => {
      const page = Math.max(1, Number(query?.page) || 1);
      const pageSize = Math.min(100, Math.max(1, Number(query?.pageSize) || 10));
      const skip = (page - 1) * pageSize;
      const where = { ...orgScope(activeOrganizationId!), type: "PERSON" as const };
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
    "/contacts/companies",
    async ({ activeOrganizationId, query }) => {
      const page = Math.max(1, Number(query?.page) || 1);
      const pageSize = Math.min(100, Math.max(1, Number(query?.pageSize) || 10));
      const search = typeof query?.search === "string" ? query.search.trim() : "";
      const skip = (page - 1) * pageSize;
      const where = {
        ...orgScope(activeOrganizationId!),
        type: "COMPANY" as const,
        ...(search && { companyName: { contains: search, mode: "insensitive" as const } }),
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
    "/contacts/get/:id",
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
    "/contacts/create",
    async ({ body, activeOrganizationId }) => {
      const b = body as ContactCreateBody & { firstName?: string; lastName?: string; email?: string; title?: string };
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
    "/contacts/update/:id",
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
    "/contacts/delete/:id",
    async ({ params, activeOrganizationId }) => {
      const existing = await prisma.contact.findFirst({
        where: { id: params.id, ...orgScope(activeOrganizationId!) },
      });
      if (!existing) return new Response(JSON.stringify({ message: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
      await prisma.contact.delete({ where: { id: params.id } });
      return { ok: true };
    },
    { requireAuth: true, requireActiveOrg: true, requireAdmin: true }
  )
  .post("/upload-image", async ({ request, user }) => {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return new Response(JSON.stringify({ error: "No file" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const folder = `images/${user!.id}`;
    let name = file.name || `img-${Date.now()}`;
    let body: ArrayBuffer | Buffer = await file.arrayBuffer();
    let contentType = file.type || "image/*";

    const isAvatar = formData.get("avatar") === "true";
    if (isAvatar) {
      const img = sharp(new Uint8Array(body));
      const { width = 0, height = 0 } = await img.metadata();
      const size = Math.min(width, height, 1000) || 1000;
      body = await img
        .resize(size, size, { fit: "cover", position: "center" })
        .jpeg({ quality: 90 })
        .toBuffer();
      contentType = "image/jpeg";
      const base = name.replace(/\.[^.]+$/, "") || name;
      name = `${base}.jpg`;
    }

    const key = `${folder}/${name}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: new Uint8Array(body),
        ContentType: contentType,
      })
    );
    const url = R2_PUBLIC_BASE_URL ? `${R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}` : key;
    return { url };
  }, { requireAuth: true })
  .mount(auth.handler)
  .listen(3333);

console.log(`🚀 Backend running at http://localhost:3333`);
console.log(`🚀 R2_PUBLIC_BASE_URL: ${R2_PUBLIC_BASE_URL}`);

// Eden Treaty için type export — frontend bunu kullanacak
export type App = typeof app;