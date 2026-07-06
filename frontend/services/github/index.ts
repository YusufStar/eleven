"use client";

import { useQuery } from "@tanstack/react-query";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

export interface GithubContributor {
  login: string;
  avatarUrl: string | null;
  commits: number;
  additions: number;
  deletions: number;
  member: { memberId: string; userId: string; name: string | null } | null;
}

export interface ContributorsResponse {
  repo: string;
  repoUrl: string | null;
  computing: boolean;
  contributors: GithubContributor[];
}

export interface GithubCommitSummary {
  sha: string;
  message: string;
  htmlUrl: string;
  author: {
    name: string;
    login: string | null;
    avatarUrl: string | null;
    date: string | null;
    member: { memberId: string; userId: string; name: string | null } | null;
  };
}

export interface CommitsResponse {
  repo: string;
  page: number;
  hasMore: boolean;
  commits: GithubCommitSummary[];
}

export interface CommitFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch: string | null;
}

export interface CommitDetail {
  repo: string;
  sha: string;
  message: string;
  htmlUrl: string;
  author: { name: string; login: string | null; avatarUrl: string | null; date: string | null };
  stats: { additions: number; deletions: number; total: number };
  files: CommitFile[];
}

export interface GithubOverview {
  connected: boolean;
  computing: boolean;
  repos: string[];
  members: { login: string; name: string | null; memberId: string | null; commits: number; additions: number; deletions: number }[];
}

async function req<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message ?? "GitHub request failed");
  }
  return res.json() as Promise<T>;
}

export function useProjectContributors(projectId: string | null, enabled = true) {
  return useQuery({
    queryKey: ["github", "contributors", projectId],
    queryFn: () => req<ContributorsResponse>(`/github/project/${projectId}/contributors`),
    enabled: !!projectId && enabled,
    // stats/contributors may still be computing on GitHub's side — retry a couple times
    refetchInterval: (q) => (q.state.data?.computing ? 3000 : false),
    staleTime: 60_000,
  });
}

export function useProjectCommits(projectId: string | null, author: string | null, page: number, enabled = true) {
  return useQuery({
    queryKey: ["github", "commits", projectId, author ?? "", page],
    queryFn: () => req<CommitsResponse>(`/github/project/${projectId}/commits?page=${page}${author ? `&author=${encodeURIComponent(author)}` : ""}`),
    enabled: !!projectId && enabled,
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

export function useCommitDetail(projectId: string | null, sha: string | null) {
  return useQuery({
    queryKey: ["github", "commit", projectId, sha],
    queryFn: () => req<CommitDetail>(`/github/project/${projectId}/commit/${sha}`),
    enabled: !!projectId && !!sha,
    staleTime: 5 * 60_000,
  });
}

export function useGithubOverview(enabled = true) {
  return useQuery({
    queryKey: ["github", "overview"],
    queryFn: () => req<GithubOverview>(`/github/overview`),
    enabled,
    refetchInterval: (q) => (q.state.data?.computing ? 3000 : false),
    staleTime: 60_000,
  });
}
