export const metricsQueryKeys = {
  all: ["metrics"] as const,
  overview: () => [...metricsQueryKeys.all, "overview"] as const,
  tasksThroughput: (weeks?: number) => [...metricsQueryKeys.all, "tasks-throughput", weeks] as const,
  sprintVelocity: () => [...metricsQueryKeys.all, "sprint-velocity"] as const,
  cycleTime: (weeks?: number) => [...metricsQueryKeys.all, "cycle-time", weeks] as const,
};
