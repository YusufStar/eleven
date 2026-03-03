import { Elysia } from "elysia";
import { prisma } from "../db/prisma";
import { authPlugin } from "../plugins/auth.plugin";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const BACKEND_URL = process.env.BACKEND_URL ?? process.env.API_URL ?? "http://localhost:3333";

// Same callback URL as settings (only one allowed in GitHub OAuth App). State "user_${userId}" is handled in settings/github/callback.
function githubCallbackUri() {
  return `${BACKEND_URL}/settings/github/callback`;
}

export const profileRoutes = new Elysia({ prefix: "/profile" })
  .use(authPlugin)
  .get(
    "/github",
    async ({ user, set }) => {
      if (!user?.id) {
        set.status = 401;
        return { message: "Unauthorized" };
      }
      const profile = await prisma.userGithubProfile.findUnique({
        where: { userId: user.id },
      });
      if (!profile) return { connection: null };
      return {
        connection: {
          githubLogin: profile.githubLogin,
          avatarUrl: profile.avatarUrl,
        },
      };
    },
    { requireAuth: true }
  )
  .get(
    "/github/connect",
    async ({ user, set, redirect }) => {
      if (!GITHUB_CLIENT_ID) {
        set.status = 503;
        return { message: "GitHub OAuth is not configured" };
      }
      if (!user?.id) {
        set.status = 401;
        return { message: "Unauthorized" };
      }
      const state = encodeURIComponent(`user_${user.id}`);
      const scope = "read:user user:email";
      const url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(githubCallbackUri())}&scope=${encodeURIComponent(scope)}&state=${state}`;
      return redirect(url);
    },
    { requireAuth: true }
  )
  .delete(
    "/github",
    async ({ user, set }) => {
      if (!user?.id) {
        set.status = 401;
        return { message: "Unauthorized" };
      }
      await prisma.$transaction([
        prisma.userGithubProfile.deleteMany({ where: { userId: user.id } }),
        prisma.account.deleteMany({ where: { userId: user.id, providerId: "github" } }),
      ]);
      return { ok: true };
    },
    { requireAuth: true }
  );
