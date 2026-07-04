"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "./api";
import type { AddAttachmentPayload, BulkUpdatePayload, CreateTaskPayload, UpdateTaskPayload } from "./api";
import type { TasksListParams } from "./types";

const tasksKey = ["tasks"] as const;
const sprintsKey = ["sprints"] as const;

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
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: tasksKey });
      queryClient.invalidateQueries({ queryKey: [...tasksKey, "detail", taskId] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => tasksApi.delete(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tasksKey });
    },
  });
}

export function useBulkUpdateTasks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BulkUpdatePayload) => tasksApi.bulkUpdate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tasksKey });
    },
  });
}

export function useBulkDeleteTasks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => tasksApi.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tasksKey });
    },
  });
}

export function useAddTaskComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, body, mentionMemberIds }: { taskId: string; body: string; mentionMemberIds?: string[] }) =>
      tasksApi.addComment(taskId, body, mentionMemberIds),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: [...tasksKey, "detail", taskId] });
    },
  });
}

export function useDeleteTaskComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, commentId }: { taskId: string; commentId: string }) =>
      tasksApi.deleteComment(taskId, commentId),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: [...tasksKey, "detail", taskId] });
    },
  });
}

export function useToggleTaskWatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => tasksApi.toggleWatch(taskId),
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: [...tasksKey, "detail", taskId] });
    },
  });
}

export function useAddTaskDependency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, dependsOnId }: { taskId: string; dependsOnId: string }) =>
      tasksApi.addDependency(taskId, dependsOnId),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: [...tasksKey, "detail", taskId] });
    },
  });
}

export function useRemoveTaskDependency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, depId }: { taskId: string; depId: string }) => tasksApi.removeDependency(taskId, depId),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: [...tasksKey, "detail", taskId] });
    },
  });
}

export function useLogTaskTime() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, minutes, note }: { taskId: string; minutes: number; note?: string | null }) =>
      tasksApi.logTime(taskId, minutes, note),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: [...tasksKey, "detail", taskId] });
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

export function useDeleteTaskAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, attachmentId }: { taskId: string; attachmentId: string }) =>
      tasksApi.deleteAttachment(taskId, attachmentId),
    onSuccess: (_, { taskId }) => {
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

// ─── Sprints ──────────────────────────────────────

export function useSprints() {
  return useQuery({
    queryKey: sprintsKey,
    queryFn: () => tasksApi.listSprints(),
  });
}

export function useCreateSprint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; goal?: string | null; startsAt: string; endsAt: string }) =>
      tasksApi.createSprint(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sprintsKey });
    },
  });
}

export function useUpdateSprint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<{ name: string; goal: string | null; startsAt: string; endsAt: string }> }) =>
      tasksApi.updateSprint(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sprintsKey });
    },
  });
}

export function useDeleteSprint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.deleteSprint(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sprintsKey });
      queryClient.invalidateQueries({ queryKey: tasksKey });
    },
  });
}
