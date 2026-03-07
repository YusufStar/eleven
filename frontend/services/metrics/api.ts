import type { DealsOverTimeParams, DealsOverTimeResponse } from "./types";

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

function dealsOverTimePath(params?: DealsOverTimeParams) {
  const u = new URL("/metrics/deals-over-time", "http://_");
  if (params?.days != null) u.searchParams.set("days", String(params.days));
  const search = u.search;
  return search ? `/metrics/deals-over-time${search}` : "/metrics/deals-over-time";
}

export const metricsApi = {
  dealsOverTime: (params?: DealsOverTimeParams) =>
    request<DealsOverTimeResponse>(dealsOverTimePath(params)),
};
