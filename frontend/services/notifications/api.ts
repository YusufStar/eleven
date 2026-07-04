import type { NotificationPreferences, NotificationsListParams, NotificationsListResponse } from "./types";

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

export const notificationsApi = {
  list: (params?: NotificationsListParams) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page));
    if (params?.pageSize) q.set("pageSize", String(params.pageSize));
    if (params?.unreadOnly) q.set("unreadOnly", "true");
    if (params?.archived) q.set("archived", "true");
    if (params?.category) q.set("category", params.category);
    const qs = q.toString();
    return request<NotificationsListResponse>(`/notifications${qs ? `?${qs}` : ""}`);
  },
  unreadCount: () => request<{ count: number }>("/notifications/unread-count"),
  markRead: (id: string) => request<{ ok: boolean }>(`/notifications/${id}/read`, { method: "POST" }),
  markAllRead: () => request<{ ok: boolean }>("/notifications/read-all", { method: "POST" }),
  archive: (id: string, archived = true) =>
    request<{ ok: boolean }>(`/notifications/${id}/archive`, {
      method: "POST",
      body: JSON.stringify({ archived }),
    }),
  snooze: (id: string, until: string) =>
    request<{ ok: boolean }>(`/notifications/${id}/snooze`, {
      method: "POST",
      body: JSON.stringify({ until }),
    }),
  getPreferences: () => request<NotificationPreferences>("/notifications/preferences"),
  updatePreferences: (prefs: NotificationPreferences) =>
    request<NotificationPreferences>("/notifications/preferences", {
      method: "PUT",
      body: JSON.stringify(prefs),
    }),
};
