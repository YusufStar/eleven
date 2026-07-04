"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { teamApi } from "./api";
import type { TeamMembersListParams, UpdateMePayload } from "./types";

const teamMembersKey = ["team", "members"] as const;

export function useTeamMembersList(params?: TeamMembersListParams, options?: { refetchInterval?: number | false }) {
  return useQuery({
    queryKey: [...teamMembersKey, params],
    queryFn: () => teamApi.listMembers(params),
    refetchInterval: options?.refetchInterval ?? false,
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateMePayload) => teamApi.updateMe(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
    },
  });
}

/** Pings /team/presence every minute while the tab is visible. Mount once per app shell. */
export function usePresenceHeartbeat() {
  React.useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    const ping = () => {
      if (document.visibilityState === "visible") teamApi.presence().catch(() => {});
    };
    ping();
    timer = setInterval(ping, 60_000);
    document.addEventListener("visibilitychange", ping);
    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", ping);
    };
  }, []);
}
