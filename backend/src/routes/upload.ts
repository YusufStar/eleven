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
    let name = file.name || `img-${Date.now()}`;
    let body: ArrayBuffer | Buffer = await file.arrayBuffer();
    let contentType = file.type || "image/*";

    const isAvatar = formData.get("avatar") === "true";
    if (isAvatar) {
      const img = sharp(new Uint8Array(body));
      const meta = await img.metadata();
      const { width = 0, height = 0, format, channels } = meta;
      const size = Math.min(width, height, 1000) || 1000;
      const isPng = format === "png" || (channels !== undefined && channels === 4);
      const base = name.replace(/\.[^.]+$/, "") || name;

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
  }, { requireAuth: true });
