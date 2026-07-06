import { Elysia } from "elysia";
import { prisma } from "../db/prisma";
import { authPlugin } from "../plugins/auth.plugin";

// GitHub code analytics for the org's linked repos.
// Auth: org connection accessToken (repo scope). Commits/contributors are matched
// to org members via each user's linked githubLogin (UserGithubProfile).

const GH_API = "https://api.github.com";

type GithubCommit = {
  sha: string;
  html_url: string;
  commit: { message: string; author?: { name?: string; email?: string; date?: string } };
  author?: { login?: string; avatar_url?: string } | null;
  stats?: { additions: number; deletions: number; total: number };
  files?: Array<{ filename: string; status: string; additions: number; deletions: number; changes: number; patch?: string }>;
};

async function orgToken(organizationId: string): Promise<string | null> {
  const conn = await prisma.organizationGithubConnection.findUnique({ where: { organizationId } });
  return conn?.accessToken ?? null;
}

function gh(token: string, path: string) {
  return fetch(`${GH_API}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": "eleven-app" },
  });
}

// org members keyed by lowercased github login → member/user summary
async function membersByLogin(organizationId: string) {
  const members = await prisma.member.findMany({
    where: { organizationId },
    select: {
      id: true,
      user: { select: { id: true, name: true, image: true, githubProfile: { select: { githubLogin: true, avatarUrl: true } } } },
    },
  });
  const map = new Map<string, { memberId: string; userId: string; name: string | null; image: string | null; githubLogin: string }>();
  for (const m of members) {
    const login = m.user?.githubProfile?.githubLogin;
    if (login) map.set(login.toLowerCase(), { memberId: m.id, userId: m.user!.id, name: m.user?.name ?? null, image: m.user?.image ?? m.user?.githubProfile?.avatarUrl ?? null, githubLogin: login });
  }
  return map;
}

async function repoForProject(projectId: string, organizationId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId },
    select: { id: true, name: true, githubRepoFullName: true, githubRepoUrl: true },
  });
  return project;
}

// Aggregate /stats/contributors for one repo into per-login totals.
async function contributorsFor(token: string, repo: string) {
  const res = await gh(token, `/repos/${repo}/stats/contributors`);
  if (res.status === 202) return { computing: true as const, rows: [] as Array<{ login: string; avatarUrl: string | null; commits: number; additions: number; deletions: number }> };
  if (!res.ok) return { computing: false as const, rows: [], error: res.status };
  const data = (await res.json()) as Array<{ total: number; weeks: Array<{ a: number; d: number; c: number }>; author?: { login?: string; avatar_url?: string } }>;
  const rows = (Array.isArray(data) ? data : []).map((c) => ({
    login: c.author?.login ?? "unknown",
    avatarUrl: c.author?.avatar_url ?? null,
    commits: c.total,
    additions: c.weeks.reduce((s, w) => s + w.a, 0),
    deletions: c.weeks.reduce((s, w) => s + w.d, 0),
  }));
  return { computing: false as const, rows };
}

export const githubRoutes = new Elysia({ prefix: "/github" })
  .use(authPlugin)
  // Per-project contributor stats, matched to org members.
  .get(
    "/project/:projectId/contributors",
    async ({ params, activeOrganizationId, set }) => {
      const token = await orgToken(activeOrganizationId!);
      if (!token) { set.status = 400; return { message: "GitHub is not connected for this organization" }; }
      const project = await repoForProject(params.projectId, activeOrganizationId!);
      if (!project) { set.status = 404; return { message: "Project not found" }; }
      if (!project.githubRepoFullName) { set.status = 400; return { message: "Project has no linked GitHub repository" }; }

      const [stats, byLogin] = await Promise.all([
        contributorsFor(token, project.githubRepoFullName),
        membersByLogin(activeOrganizationId!),
      ]);
      if ("error" in stats && stats.error) { set.status = 502; return { message: "Failed to fetch GitHub stats" }; }

      const contributors = stats.rows
        .map((r) => {
          const member = byLogin.get(r.login.toLowerCase()) ?? null;
          return {
            login: r.login,
            avatarUrl: member?.image ?? r.avatarUrl,
            commits: r.commits,
            additions: r.additions,
            deletions: r.deletions,
            member: member ? { memberId: member.memberId, userId: member.userId, name: member.name } : null,
          };
        })
        .sort((a, b) => b.commits - a.commits);

      return {
        repo: project.githubRepoFullName,
        repoUrl: project.githubRepoUrl,
        computing: stats.computing,
        contributors,
      };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  // Commit list for a project's repo (optionally filtered by author login).
  .get(
    "/project/:projectId/commits",
    async ({ params, query, activeOrganizationId, set }) => {
      const token = await orgToken(activeOrganizationId!);
      if (!token) { set.status = 400; return { message: "GitHub is not connected for this organization" }; }
      const project = await repoForProject(params.projectId, activeOrganizationId!);
      if (!project?.githubRepoFullName) { set.status = 400; return { message: "Project has no linked GitHub repository" }; }

      const page = Math.max(1, Number(query?.page) || 1);
      const author = typeof query?.author === "string" && query.author.trim() ? `&author=${encodeURIComponent(query.author.trim())}` : "";
      const res = await gh(token, `/repos/${project.githubRepoFullName}/commits?per_page=20&page=${page}${author}`);
      if (!res.ok) { set.status = 502; return { message: "Failed to fetch commits" }; }
      const data = (await res.json()) as GithubCommit[];
      const byLogin = await membersByLogin(activeOrganizationId!);
      const commits = data.map((c) => {
        const login = c.author?.login;
        const member = login ? byLogin.get(login.toLowerCase()) ?? null : null;
        return {
          sha: c.sha,
          message: c.commit.message,
          htmlUrl: c.html_url,
          author: {
            name: c.commit.author?.name ?? login ?? "Unknown",
            login: login ?? null,
            avatarUrl: member?.image ?? c.author?.avatar_url ?? null,
            date: c.commit.author?.date ?? null,
            member: member ? { memberId: member.memberId, userId: member.userId, name: member.name } : null,
          },
        };
      });
      return { repo: project.githubRepoFullName, page, hasMore: data.length === 20, commits };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  // Full commit detail with per-file diffs (GitHub-style).
  .get(
    "/project/:projectId/commit/:sha",
    async ({ params, activeOrganizationId, set }) => {
      const token = await orgToken(activeOrganizationId!);
      if (!token) { set.status = 400; return { message: "GitHub is not connected for this organization" }; }
      const project = await repoForProject(params.projectId, activeOrganizationId!);
      if (!project?.githubRepoFullName) { set.status = 400; return { message: "Project has no linked GitHub repository" }; }

      const res = await gh(token, `/repos/${project.githubRepoFullName}/commits/${params.sha}`);
      if (!res.ok) { set.status = res.status === 404 ? 404 : 502; return { message: "Failed to fetch commit" }; }
      const c = (await res.json()) as GithubCommit;
      return {
        repo: project.githubRepoFullName,
        sha: c.sha,
        message: c.commit.message,
        htmlUrl: c.html_url,
        author: {
          name: c.commit.author?.name ?? c.author?.login ?? "Unknown",
          login: c.author?.login ?? null,
          avatarUrl: c.author?.avatar_url ?? null,
          date: c.commit.author?.date ?? null,
        },
        stats: c.stats ?? { additions: 0, deletions: 0, total: 0 },
        files: (c.files ?? []).map((f) => ({
          filename: f.filename,
          status: f.status,
          additions: f.additions,
          deletions: f.deletions,
          changes: f.changes,
          patch: f.patch ?? null,
        })),
      };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  // Org-wide code activity aggregated across all linked project repos.
  // Also consumed by the AI report engine (see getGithubOverview).
  .get(
    "/overview",
    async ({ activeOrganizationId, set }) => {
      const token = await orgToken(activeOrganizationId!);
      if (!token) { set.status = 400; return { message: "GitHub is not connected for this organization" }; }
      const data = await getGithubOverview(activeOrganizationId!, token);
      return data;
    },
    { requireAuth: true, requireActiveOrg: true }
  );

// Shared aggregation: per-member commit/addition/deletion totals across all repos.
// Returns { computing, repos, members: [{memberId,name,login,commits,additions,deletions}] }.
export async function getGithubOverview(organizationId: string, token?: string) {
  const t = token ?? (await orgToken(organizationId));
  if (!t) return { connected: false as const, computing: false, repos: [], members: [] };

  const projects = await prisma.project.findMany({
    where: { organizationId, githubRepoFullName: { not: null } },
    select: { githubRepoFullName: true },
  });
  const repos = [...new Set(projects.map((p) => p.githubRepoFullName!).filter(Boolean))];
  const byLogin = await membersByLogin(organizationId);

  const totals = new Map<string, { login: string; name: string | null; memberId: string | null; commits: number; additions: number; deletions: number }>();
  let computing = false;
  for (const repo of repos) {
    const stats = await contributorsFor(t, repo);
    if (stats.computing) { computing = true; continue; }
    for (const r of stats.rows) {
      const member = byLogin.get(r.login.toLowerCase()) ?? null;
      const key = member?.memberId ?? `login:${r.login.toLowerCase()}`;
      const prev = totals.get(key) ?? { login: r.login, name: member?.name ?? null, memberId: member?.memberId ?? null, commits: 0, additions: 0, deletions: 0 };
      prev.commits += r.commits;
      prev.additions += r.additions;
      prev.deletions += r.deletions;
      totals.set(key, prev);
    }
  }
  const members = [...totals.values()].sort((a, b) => b.commits - a.commits);
  return { connected: true as const, computing, repos, members };
}
