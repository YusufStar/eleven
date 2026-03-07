"use client";

import { useQuery } from "@tanstack/react-query";
import { metricsApi } from "./api";
import { metricsQueryKeys } from "./query-keys";
import type { DealsOverTimeParams } from "./types";

export function useDealsOverTime(params?: DealsOverTimeParams) {
  return useQuery({
    queryKey: metricsQueryKeys.dealsOverTime(params),
    queryFn: () => metricsApi.dealsOverTime(params),
  });
}
