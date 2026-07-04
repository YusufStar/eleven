import type { CycleTime, MetricsOverview, SprintVelocity, TasksThroughput } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export const metricsApi = {
  overview: () => request<MetricsOverview>("/metrics/overview"),
  tasksThroughput: (weeks?: number) =>
    request<TasksThroughput>(`/metrics/tasks-throughput${weeks ? `?weeks=${weeks}` : ""}`),
  sprintVelocity: () => request<SprintVelocity>("/metrics/sprint-velocity"),
  cycleTime: (weeks?: number) => request<CycleTime>(`/metrics/cycle-time${weeks ? `?weeks=${weeks}` : ""}`),
};
