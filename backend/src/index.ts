import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { auth } from "./auth/auth";
import { authPlugin } from "./plugins/auth.plugin";
import { contactsRoutes, paymentsRoutes, stripeWebhookApp, projectsRoutes, teamRoutes, tasksRoutes, uploadRoutes } from "./routes";
import { createDummyData } from "./dummy/create-dummy-data";

const app = new Elysia()
  .use(
    cors({
      origin: process.env.FRONTEND_URL!,
      credentials: true,
    })
  )
  .mount(auth.handler)
  .use(authPlugin)
  .use(stripeWebhookApp)
  .use(contactsRoutes)
  .use(paymentsRoutes)
  .use(projectsRoutes)
  .use(teamRoutes)
  .use(tasksRoutes)
  .use(uploadRoutes)
  .get("/", () => "Hello World")
  .get("/dummy-create", async ({ set }) => {
    try {
      const result = await createDummyData();
      set.status = result.ok ? 200 : 400;
      return result;
    } catch (err) {
      set.status = 500;
      return { ok: false, message: err instanceof Error ? err.message : "Unknown error" };
    }
  })
  .listen(3333);

console.log(`🚀 Backend running at http://localhost:3333`);
console.log(`🚀 R2_PUBLIC_BASE_URL: ${process.env.R2_PUBLIC_BASE_URL ?? ""}`);

export type App = typeof app;
