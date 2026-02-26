"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "./api";
import type { AddAttachmentPayload, CreateTaskPayload, UpdateTaskPayload } from "./api";
import type { TasksListParams } from "./types";

const tasksKey = ["tasks"] as const;

export function useTasksList(params?: TasksListParams) {
  return useQuery({
    queryKey: [...tasksKey, "list", params],
    queryFn: () => tasksApi.list(params),
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => tasksApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tasksKey });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: UpdateTaskPayload }) =>
      tasksApi.update(taskId, payload),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: tasksKey });
      queryClient.invalidateQueries({ queryKey: [...tasksKey, "detail", taskId] });
    },
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

export function useAddTaskAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: AddAttachmentPayload }) =>
      tasksApi.addAttachment(taskId, payload),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: tasksKey });
      queryClient.invalidateQueries({ queryKey: [...tasksKey, "detail", taskId] });
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
