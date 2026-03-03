import { Elysia } from "elysia";
import { prisma } from "../db/prisma";
import { authPlugin } from "../plugins/auth.plugin";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";
const BACKEND_URL = process.env.BACKEND_URL ?? process.env.API_URL ?? "http://localhost:3333";

function redirectUri() {
  return `${BACKEND_URL}/settings/github/callback`;
}

export const settingsRoutes = new Elysia({ prefix: "/settings" })
  .use(authPlugin)
  .get(
    "/github/connect",
    async ({ activeOrganizationId, activeMember, set, redirect }) => {
      if (!GITHUB_CLIENT_ID) {
        set.status = 503;
        return { message: "GitHub OAuth is not configured" };
      }
      if (!activeOrganizationId || !activeMember) {
        set.status = 400;
        return { message: "Active organization required" };
      }
      if (activeMember.role !== "owner" && activeMember.role !== "admin") {
        set.status = 403;
        return { message: "Owner or admin role required" };
      }
      const state = encodeURIComponent(activeOrganizationId);
      const scope = "read:user user:email repo";
      const url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri())}&scope=${encodeURIComponent(scope)}&state=${state}`;
      return redirect(url);
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .get(
    "/github/callback",
    async ({ query, request, redirect }) => {
      const code = typeof query.code === "string" ? query.code : null;
      const state = typeof query.state === "string" ? decodeURIComponent(query.state) : null;
      const errorRedirect = `${FRONTEND_URL}/dashboard/settings?github=error`;
      const successRedirect = `${FRONTEND_URL}/dashboard/settings?github=connected`;
      if (!code || !state || !GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
        return redirect(errorRedirect);
      }
      const session = await import("../auth/auth").then((m) => m.auth.api.getSession({ headers: request.headers }));
      const user = session?.user;
      const activeOrganizationId = (session?.session as { activeOrganizationId?: string } | undefined)?.activeOrganizationId;
      if (!user?.id || !activeOrganizationId || state !== activeOrganizationId) {
        return redirect(errorRedirect);
      }
      const member = await prisma.member.findFirst({
        where: { userId: user.id, organizationId: activeOrganizationId },
      });
      if (!member || (member.role !== "owner" && member.role !== "admin")) {
        return redirect(errorRedirect);
      }
      const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: redirectUri(),
        }),
      });
      const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };
      const accessToken = tokenData.access_token;
      if (!accessToken) {
        return redirect(errorRedirect);
      }
      const userRes = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!userRes.ok) {
        return redirect(errorRedirect);
      }
      const ghUser = (await userRes.json()) as { id: number; login: string; avatar_url?: string };
      await prisma.organizationGithubConnection.upsert({
        where: { organizationId: activeOrganizationId },
        create: {
          organizationId: activeOrganizationId,
          githubUserId: String(ghUser.id),
          githubLogin: ghUser.login,
          avatarUrl: ghUser.avatar_url ?? null,
          accessToken,
        },
        update: {
          githubUserId: String(ghUser.id),
          githubLogin: ghUser.login,
          avatarUrl: ghUser.avatar_url ?? null,
          accessToken,
        },
      });
      return redirect(successRedirect);
    }
  )
  .get(
    "/github",
    async ({ activeOrganizationId, set }) => {
      if (!activeOrganizationId) {
        set.status = 400;
        return { message: "Active organization required" };
      }
      const conn = await prisma.organizationGithubConnection.findUnique({
        where: { organizationId: activeOrganizationId },
      });
      if (!conn) return { connection: null };
      return {
        connection: {
          githubUserId: conn.githubUserId,
          githubLogin: conn.githubLogin,
          avatarUrl: conn.avatarUrl,
        },
      };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .get(
    "/github/repos",
    async ({ activeOrganizationId, set }) => {
      if (!activeOrganizationId) {
        set.status = 400;
        return { message: "Active organization required" };
      }
      const conn = await prisma.organizationGithubConnection.findUnique({
        where: { organizationId: activeOrganizationId },
      });
      if (!conn?.accessToken) {
        return { repos: [] };
      }
      const res = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
        headers: { Authorization: `Bearer ${conn.accessToken}`, Accept: "application/vnd.github.v3+json" },
      });
      if (!res.ok) {
        set.status = 502;
        return { message: "Failed to fetch GitHub repos" };
      }
      const data = (await res.json()) as Array<{ id: number; full_name: string; html_url: string; name: string }>;
      const repos = data.map((r) => ({ id: r.id, fullName: r.full_name, htmlUrl: r.html_url, name: r.name }));
      return { repos };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .delete(
    "/github",
    async ({ activeOrganizationId, activeMember, set }) => {
      if (!activeOrganizationId || !activeMember) {
        set.status = 400;
        return { message: "Active organization required" };
      }
      if (activeMember.role !== "owner" && activeMember.role !== "admin") {
        set.status = 403;
        return { message: "Owner or admin role required" };
      }
      await prisma.organizationGithubConnection.deleteMany({
        where: { organizationId: activeOrganizationId },
      });
      return { ok: true };
    },
    { requireAuth: true, requireActiveOrg: true }
  );
