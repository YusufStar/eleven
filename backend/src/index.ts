import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { auth } from "./auth/auth";
import { authPlugin } from "./plugins/auth.plugin";
import { chatRoutes, paymentsRoutes, stripeWebhookApp, projectsRoutes, profileRoutes, teamRoutes, tasksRoutes, uploadRoutes, settingsRoutes, activitiesRoutes, homeDataRoutes, metricsRoutes, notificationsRoutes, meetingsRoutes, meetSignalRoutes, sprintsRoutes, filesRoutes, aiReportsRoutes } from "./routes";
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
  .use(chatRoutes)
  .use(paymentsRoutes)
  .use(projectsRoutes)
  .use(profileRoutes)
  .use(teamRoutes)
  .use(tasksRoutes)
  .use(uploadRoutes)
  .use(settingsRoutes)
  .use(activitiesRoutes)
  .use(homeDataRoutes)
  .use(metricsRoutes)
  .use(notificationsRoutes)
  .use(meetingsRoutes)
  .use(meetSignalRoutes)
  .use(sprintsRoutes)
  .use(filesRoutes)
  .use(aiReportsRoutes)
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
  .listen(process.env.PORT ?? 3333);

console.log(`🚀 Backend running at http://localhost:3333`);
console.log(`🚀 R2_PUBLIC_BASE_URL: ${process.env.R2_PUBLIC_BASE_URL ?? ""}`);

export type App = typeof app;
