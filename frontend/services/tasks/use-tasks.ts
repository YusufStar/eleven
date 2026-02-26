"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "./api";
import type { TasksListParams } from "./types";

const tasksKey = ["tasks"] as const;

export function useTasksList(params?: TasksListParams) {
  return useQuery({
    queryKey: [...tasksKey, "list", params],
    queryFn: () => tasksApi.list(params),
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      tasksApi.updateStatus(taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tasksKey });
    },
  });
}

export function useTaskDetail(taskId: string | null) {
  return useQuery({
    queryKey: [...tasksKey, "detail", taskId],
    queryFn: () => tasksApi.getById(taskId!),
    enabled: !!taskId,
  });
}
