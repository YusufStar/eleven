"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { meetingsApi } from "./api";
import type { CreateMeetingPayload } from "./types";

const key = ["meetings"] as const;

export function useUpcomingMeetings() {
  return useQuery({
    queryKey: [...key, "upcoming"],
    queryFn: () => meetingsApi.upcoming(),
    refetchInterval: 60_000,
  });
}

export function useMeetingsRange(from: Date, to: Date) {
  return useQuery({
    queryKey: [...key, "range", from.toISOString(), to.toISOString()],
    queryFn: () => meetingsApi.range(from, to),
    refetchInterval: 60_000,
  });
}

export function useMeetingByCode(code: string | null) {
  return useQuery({
    queryKey: [...key, "by-code", code],
    queryFn: () => meetingsApi.byCode(code!),
    enabled: !!code,
    retry: false,
  });
}

export function useCreateMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMeetingPayload) => meetingsApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}
