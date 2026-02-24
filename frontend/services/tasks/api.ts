import type { PaginatedTasks, TasksListParams } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

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

function listPath(params?: TasksListParams) {
  const u = new URL("/tasks", "http://_");
  if (params?.page != null) u.searchParams.set("page", String(params.page));
  if (params?.pageSize != null) u.searchParams.set("pageSize", String(params.pageSize));
  if (params?.assigneeId != null && params.assigneeId !== "") u.searchParams.set("assigneeId", params.assigneeId);
  if (params?.projectId != null && params.projectId !== "") u.searchParams.set("projectId", params.projectId);
  if (params?.mine) u.searchParams.set("mine", "true");
  const search = u.search;
  return search ? `/tasks${search}` : "/tasks";
}

export const tasksApi = {
  list: (params?: TasksListParams) => request<PaginatedTasks>(listPath(params)),
};
