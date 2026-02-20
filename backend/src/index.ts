import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { auth } from "./auth/auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;
// Cloudflare Dashboard → R2 → bucket → Settings → Public access → "Allow Access" → r2.dev URL veya custom domain
const R2_PUBLIC_BASE_URL = process.env.R2_PUBLIC_BASE_URL ?? "";

const app = new Elysia()
  .use(
    cors({
      origin: process.env.FRONTEND_URL!,
      credentials: true,
    })
  )
  .use(
    swagger({
      documentation: {
        info: { title: "Eleven API", version: "1.0.0" },
      },
    })
  )
  // Better Auth tüm /api/auth/* route'larını handle eder
  .mount(auth.handler)
  // Health check
  .get("/health", () => ({ status: "ok" }))
  // Upload image: multipart form "file", optional "folder". Returns public URL.
  .post("/upload-image", async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return new Response(JSON.stringify({ error: "No file" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const folder = (formData.get("folder") as string) || "images";
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
  })
  .listen(3001);

console.log(`🚀 Backend running at http://localhost:3001`);

// Eden Treaty için type export — frontend bunu kullanacak
export type App = typeof app;