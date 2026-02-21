import type { PaginatedTeamMembers, TeamMembersListParams } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

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

function membersPath(params?: TeamMembersListParams) {
  const u = new URL("/team/members", "http://_");
  if (params?.page != null) u.searchParams.set("page", String(params.page));
  if (params?.pageSize != null) u.searchParams.set("pageSize", String(params.pageSize));
  if (params?.search != null && params.search !== "") u.searchParams.set("search", params.search);
  if (params?.role != null && params.role !== "" && params.role !== "all") u.searchParams.set("role", params.role);
  const search = u.search;
  return search ? `/team/members${search}` : "/team/members";
}

export const teamApi = {
  listMembers: (params?: TeamMembersListParams) =>
    request<PaginatedTeamMembers>(membersPath(params)),
};
