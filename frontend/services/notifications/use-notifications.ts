"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "./api";
import type { NotificationPreferences, NotificationsListParams } from "./types";

const key = ["notifications"] as const;
// ponytail: 30s polling like chat; swap for a WS push channel when one exists
const POLL_MS = 30_000;

export function useNotificationsList(params?: NotificationsListParams) {
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

export function useArchiveNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, archived }: { id: string; archived?: boolean }) => notificationsApi.archive(id, archived),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

export function useSnoozeNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, until }: { id: string; until: string }) => notificationsApi.snooze(id, until),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: [...key, "preferences"],
    queryFn: () => notificationsApi.getPreferences(),
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (prefs: NotificationPreferences) => notificationsApi.updatePreferences(prefs),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...key, "preferences"] }),
  });
}
