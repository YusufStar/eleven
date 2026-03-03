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
      if (activeMember.role !== "owner") {
        set.status = 403;
        return { message: "Only the organization owner can connect GitHub" };
      }
      const state = encodeURIComponent(`org_${activeOrganizationId}`);
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
      const rawState = typeof query.state === "string" ? decodeURIComponent(query.state) : null;
      const settingsError = `${FRONTEND_URL}/dashboard/settings?github=error`;
      const settingsSuccess = `${FRONTEND_URL}/dashboard/settings?github=connected`;
      const profileError = `${FRONTEND_URL}/dashboard/settings/profile?github=error`;
      const profileSuccess = `${FRONTEND_URL}/dashboard/settings/profile?github=connected`;
      if (!code || !rawState || !GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
        return redirect(settingsError);
      }
      const session = await import("../auth/auth").then((m) => m.auth.api.getSession({ headers: request.headers }));
      const user = session?.user;
      if (!user?.id) {
        return redirect(rawState.startsWith("user_") ? profileError : settingsError);
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
        return redirect(rawState.startsWith("user_") ? profileError : settingsError);
      }
      const userRes = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!userRes.ok) {
        return redirect(rawState.startsWith("user_") ? profileError : settingsError);
      }
      const ghUser = (await userRes.json()) as { id: number; login: string; avatar_url?: string };

      if (rawState.startsWith("user_")) {
        const userId = rawState.slice(5);
        if (userId !== user.id) return redirect(profileError);
        const accountId = String(ghUser.id);
        await prisma.$transaction([
          prisma.account.deleteMany({ where: { userId: user.id, providerId: "github" } }),
          prisma.account.create({
            data: {
              id: `github_${user.id}_${accountId}`,
              accountId,
              providerId: "github",
              userId: user.id,
              accessToken,
            },
          }),
          prisma.userGithubProfile.upsert({
            where: { userId: user.id },
            create: {
              userId: user.id,
              githubLogin: ghUser.login,
              avatarUrl: ghUser.avatar_url ?? null,
            },
            update: {
              githubLogin: ghUser.login,
              avatarUrl: ghUser.avatar_url ?? null,
            },
          }),
        ]);
        return redirect(profileSuccess);
      }

      if (rawState.startsWith("org_")) {
        const activeOrganizationId = rawState.slice(4);
        const activeOrgId = (session?.session as { activeOrganizationId?: string } | undefined)?.activeOrganizationId;
        if (!activeOrgId || activeOrganizationId !== activeOrgId) return redirect(settingsError);
        const member = await prisma.member.findFirst({
          where: { userId: user.id, organizationId: activeOrganizationId },
        });
        if (!member || member.role !== "owner") return redirect(settingsError);
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
        return redirect(settingsSuccess);
      }

      return redirect(settingsError);
    }
  )
  .get(
    "/github",
    async ({ activeOrganizationId, activeMember, set }) => {
      if (!activeOrganizationId || !activeMember) {
        set.status = 400;
        return { message: "Active organization required" };
      }
      const conn = await prisma.organizationGithubConnection.findUnique({
        where: { organizationId: activeOrganizationId },
      });
      const canManage = activeMember.role === "owner";
      if (!conn) return { connection: null, canManage };
      return {
        connection: {
          githubUserId: conn.githubUserId,
          githubLogin: conn.githubLogin,
          avatarUrl: conn.avatarUrl,
        },
        canManage,
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
      if (activeMember.role !== "owner") {
        set.status = 403;
        return { message: "Only the organization owner can disconnect GitHub" };
      }
      await prisma.organizationGithubConnection.deleteMany({
        where: { organizationId: activeOrganizationId },
      });
      return { ok: true };
    },
    { requireAuth: true, requireActiveOrg: true }
  );
