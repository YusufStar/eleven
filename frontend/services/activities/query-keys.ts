export const activitiesQueryKeys = {
  all: ["activities"] as const,
  list: (params?: Record<string, unknown>) =>
    [...activitiesQueryKeys.all, "list", params] as const,
};
