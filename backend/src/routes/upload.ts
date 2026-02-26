import { Elysia } from "elysia";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { authPlugin } from "../plugins/auth.plugin";

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

/**
 * Normalize filename for safe use in URLs and markdown (no spaces, no parens).
 * Replaces spaces with hyphens and strips characters that break markdown image syntax.
 */
function normalizeFileName(name: string): string {
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")) : "";
  const base = name.includes(".") ? name.slice(0, name.lastIndexOf(".")) : name;
  const normalized = base
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[()[\]]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || `file-${Date.now()}`;
  return normalized + ext;
}

export const uploadRoutes = new Elysia()
  .use(authPlugin)
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
    let name = normalizeFileName(file.name || `img-${Date.now()}`);
    let body: ArrayBuffer | Buffer = await file.arrayBuffer();
    let contentType = file.type || "image/*";

    const isAvatar = formData.get("avatar") === "true";
    if (isAvatar) {
      const img = sharp(new Uint8Array(body));
      const meta = await img.metadata();
      const { width = 0, height = 0, format, channels } = meta;

      // Keep GIF as-is so animation is preserved
      if (format === "gif") {
        // no resize/convert
      } else {
        const size = Math.min(width, height, 1000) || 1000;
        const isPng = format === "png" || (channels !== undefined && channels === 4);
        const base = name.includes(".") ? name.slice(0, name.lastIndexOf(".")) : name;

        if (isPng) {
          body = await img
            .resize(size, size, { fit: "cover", position: "center" })
            .png()
            .toBuffer();
          contentType = "image/png";
          name = `${base}.png`;
        } else {
          body = await img
            .resize(size, size, { fit: "cover", position: "center" })
            .jpeg({ quality: 90 })
            .toBuffer();
          contentType = "image/jpeg";
          name = `${base}.jpg`;
        }
      }
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
    const fileSize = body instanceof Buffer ? body.length : body.byteLength;
    return { url, fileName: name, fileType: contentType, fileSize };
  }, { requireAuth: true })
  .post("/upload-file", async ({ request, user }) => {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return new Response(JSON.stringify({ error: "No file" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const folder = `files/${user!.id}`;
    const name = normalizeFileName(file.name || `file-${Date.now()}`);
    const body = await file.arrayBuffer();
    const contentType = file.type || "application/octet-stream";
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
    return { url, fileName: name, fileType: contentType, fileSize: body.byteLength };
  }, { requireAuth: true });
