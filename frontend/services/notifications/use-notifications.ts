"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "./api";

const key = ["notifications"] as const;
// ponytail: 30s polling like chat; swap for a WS push channel when one exists
const POLL_MS = 30_000;

export function useNotificationsList(params?: { unreadOnly?: boolean }) {
  return useQuery({
    queryKey: [...key, "list", params],
    queryFn: () => notificationsApi.list({ pageSize: 30, ...params }),
    refetchInterval: POLL_MS,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: [...key, "unread-count"],
    queryFn: () => notificationsApi.unreadCount(),
    refetchInterval: POLL_MS,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}
