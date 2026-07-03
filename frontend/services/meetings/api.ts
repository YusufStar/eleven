import type { CreateMeetingPayload, Meeting } from "./types";

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

export const meetingsApi = {
  create: (payload: CreateMeetingPayload) =>
    request<Meeting>("/meetings", { method: "POST", body: JSON.stringify(payload) }),
  upcoming: (limit = 10) => request<{ data: Meeting[] }>(`/meetings/upcoming?limit=${limit}`),
  range: (from: Date, to: Date) =>
    request<{ data: Meeting[] }>(
      `/meetings/range?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`,
    ),
  byCode: (code: string) => request<Meeting>(`/meetings/by-code/${encodeURIComponent(code)}`),
};
