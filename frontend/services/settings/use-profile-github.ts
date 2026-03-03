"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "./api";

const profileGithubKey = ["profile", "github"] as const;

export function useProfileGithub() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: profileGithubKey,
    queryFn: () => settingsApi.getProfileGithubConnection(),
  });
  const disconnect = useMutation({
    mutationFn: () => settingsApi.disconnectProfileGithub(),
    onSuccess: () => qc.invalidateQueries({ queryKey: profileGithubKey }),
  });
  return {
    connection: query.data?.connection ?? null,
    isPending: query.isPending,
    error: query.error,
    disconnect: disconnect.mutateAsync,
    isDisconnecting: disconnect.isPending,
  };
}
