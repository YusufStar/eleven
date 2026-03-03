"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "./api";

const settingsGithubKey = ["settings", "github"] as const;

export function useSettingsGithub() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: settingsGithubKey,
    queryFn: () => settingsApi.getGithubConnection(),
  });
  const disconnect = useMutation({
    mutationFn: () => settingsApi.disconnectGithub(),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsGithubKey }),
  });
  return {
    connection: query.data?.connection ?? null,
    isPending: query.isPending,
    error: query.error,
    disconnect: disconnect.mutateAsync,
    isDisconnecting: disconnect.isPending,
  };
}

export function useSettingsGithubRepos() {
  return useQuery({
    queryKey: [...settingsGithubKey, "repos"],
    queryFn: () => settingsApi.getGithubRepos(),
  });
}
