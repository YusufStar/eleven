const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

export interface GithubConnectionInfo {
  githubUserId: string;
  githubLogin: string;
  avatarUrl: string | null;
}

export interface GithubConnectionResponse {
  connection: GithubConnectionInfo | null;
  canManage?: boolean;
}

export interface ProfileGithubConnectionInfo {
  githubLogin: string;
  avatarUrl: string | null;
}

export interface ProfileGithubConnectionResponse {
  connection: ProfileGithubConnectionInfo | null;
}

export interface GithubRepoItem {
  id: number;
  fullName: string;
  htmlUrl: string;
  name: string;
}

export interface GithubReposResponse {
  repos: GithubRepoItem[];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers as HeadersInit) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export const settingsApi = {
  getGithubConnection: () =>
    request<GithubConnectionResponse>("/settings/github"),

  getGithubRepos: () =>
    request<GithubReposResponse>("/settings/github/repos"),

  disconnectGithub: () =>
    request<{ ok: boolean }>("/settings/github", { method: "DELETE" }),

  connectGithubUrl: () => `${BASE}/settings/github/connect`,

  getProfileGithubConnection: () =>
    request<ProfileGithubConnectionResponse>("/profile/github"),

  disconnectProfileGithub: () =>
    request<{ ok: boolean }>("/profile/github", { method: "DELETE" }),

  connectProfileGithubUrl: () => `${BASE}/profile/github/connect`,
};
