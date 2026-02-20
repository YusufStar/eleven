export const contactQueryKeys = {
  all: ["contacts"] as const,
  people: (params?: { page?: number; pageSize?: number }) => [...contactQueryKeys.all, "people", params] as const,
  companies: (params?: { page?: number; pageSize?: number }) => [...contactQueryKeys.all, "companies", params] as const,
  details: () => [...contactQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...contactQueryKeys.details(), id] as const,
};
