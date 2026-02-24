"use client";

import { useQuery } from "@tanstack/react-query";
import { tasksApi } from "./api";
import type { TasksListParams } from "./types";

const tasksKey = ["tasks"] as const;

export function useTasksList(params?: TasksListParams) {
  return useQuery({
    queryKey: [...tasksKey, "list", params],
    queryFn: () => tasksApi.list(params),
  });
}
