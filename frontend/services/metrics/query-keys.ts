import type { DealsOverTimeParams } from "./types";

export const metricsQueryKeys = {
  all: ["metrics"] as const,
  dealsOverTime: (params?: DealsOverTimeParams) =>
    [...metricsQueryKeys.all, "deals-over-time", params] as const,
};
