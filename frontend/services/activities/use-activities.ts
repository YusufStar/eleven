"use client";

import { useQuery } from "@tanstack/react-query";
import { activitiesApi } from "./api";
import { activitiesQueryKeys } from "./query-keys";
import type { ActivitiesListParams } from "./types";

const POLL_INTERVAL_MS = 1000;

export function useActivitiesList(
  params: ActivitiesListParams | undefined,
  options?: { refetchInterval?: number | false; enabled?: boolean }
) {
  const refetchInterval = options?.refetchInterval ?? POLL_INTERVAL_MS;
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: activitiesQueryKeys.list(params),
    queryFn: () => activitiesApi.list(params),
    refetchInterval: enabled ? refetchInterval : false,
    refetchIntervalInBackground: false,
    enabled,
  });
}
