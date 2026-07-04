"use client";

import { useQuery } from "@tanstack/react-query";
import { metricsApi } from "./api";
import { metricsQueryKeys } from "./query-keys";

export function useMetricsOverview() {
  return useQuery({
    queryKey: metricsQueryKeys.overview(),
    queryFn: () => metricsApi.overview(),
  });
}

export function useTasksThroughput(weeks?: number) {
  return useQuery({
    queryKey: metricsQueryKeys.tasksThroughput(weeks),
    queryFn: () => metricsApi.tasksThroughput(weeks),
  });
}

export function useSprintVelocity() {
  return useQuery({
    queryKey: metricsQueryKeys.sprintVelocity(),
    queryFn: () => metricsApi.sprintVelocity(),
  });
}

export function useCycleTime(weeks?: number) {
  return useQuery({
    queryKey: metricsQueryKeys.cycleTime(weeks),
    queryFn: () => metricsApi.cycleTime(weeks),
  });
}
