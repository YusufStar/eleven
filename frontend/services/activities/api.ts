import type { ActivitiesListParams, PaginatedActivities } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

async function request<T>(path: string, init?: RequestOptions): Promise<T> {
  const { body, ...rest } = init ?? {};
  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(rest.headers as HeadersInit) },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

function activitiesListPath(params?: ActivitiesListParams) {
  const u = new URL("/activities", "http://_");
  if (params?.page != null) u.searchParams.set("page", String(params.page));
  if (params?.pageSize != null) u.searchParams.set("pageSize", String(params.pageSize));
  if (params?.action) u.searchParams.set("action", params.action);
  if (params?.entityType) u.searchParams.set("entityType", params.entityType);
  if (params?.memberId) u.searchParams.set("memberId", params.memberId);
  if (params?.entityId) u.searchParams.set("entityId", params.entityId);
  if (params?.search) u.searchParams.set("search", params.search);
  if (params?.dateFrom) u.searchParams.set("dateFrom", params.dateFrom);
  if (params?.dateTo) u.searchParams.set("dateTo", params.dateTo);
  const search = u.search;
  return search ? `/activities${search}` : "/activities";
}

export const activitiesApi = {
  list: (params?: ActivitiesListParams) =>
    request<PaginatedActivities>(activitiesListPath(params)),
};
