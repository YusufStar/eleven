export const dealsQueryKeys = {
  all: ["deals"] as const,
  pipelines: () => [...dealsQueryKeys.all, "pipelines"] as const,
  pipeline: (id: string) => [...dealsQueryKeys.all, "pipelines", id] as const,
  list: (params?: Record<string, unknown>) => [...dealsQueryKeys.all, "list", params] as const,
  detail: (id: string) => [...dealsQueryKeys.all, "detail", id] as const,
};
