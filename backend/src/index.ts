import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { auth } from "./auth/auth";

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
  .listen(3001);

console.log(`🚀 Backend running at http://localhost:3001`);

// Eden Treaty için type export — frontend bunu kullanacak
export type App = typeof app;