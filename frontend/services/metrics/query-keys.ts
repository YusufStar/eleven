export const metricsQueryKeys = {
  all: ["metrics"] as const,
  dealsOverTime: (params?: Record<string, unknown>) =>
    [...metricsQueryKeys.all, "deals-over-time", params] as const,
};
