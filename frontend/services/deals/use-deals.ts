"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dealsApi } from "./api";
import { dealsQueryKeys } from "./query-keys";
import type { DealsListParams } from "./types";

export function usePipelines() {
  return useQuery({
    queryKey: dealsQueryKeys.pipelines(),
    queryFn: () => dealsApi.listPipelines(),
  });
}

export function usePipeline(id: string | null) {
  return useQuery({
    queryKey: dealsQueryKeys.pipeline(id ?? ""),
    queryFn: () => dealsApi.getPipeline(id!),
    enabled: !!id,
  });
}

export function useCreatePipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name?: string }) => dealsApi.createPipeline(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: dealsQueryKeys.pipelines() }),
  });
}

export function useCreateStage(pipelineId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name?: string; color?: string }) =>
      dealsApi.createStage(pipelineId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dealsQueryKeys.pipelines() });
      if (pipelineId) qc.invalidateQueries({ queryKey: dealsQueryKeys.pipeline(pipelineId) });
    },
  });
}

export function useCreateStageForPipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ pipelineId, ...body }: { pipelineId: string; name?: string; color?: string }) =>
      dealsApi.createStage(pipelineId, body),
    onSuccess: (_, { pipelineId }) => {
      qc.invalidateQueries({ queryKey: dealsQueryKeys.pipelines() });
      qc.invalidateQueries({ queryKey: dealsQueryKeys.pipeline(pipelineId) });
    },
  });
}

export function useUpdateStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: { name?: string; order?: number; color?: string | null };
    }) => dealsApi.updateStage(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: dealsQueryKeys.all }),
  });
}

export function useDeleteStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dealsApi.deleteStage(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: dealsQueryKeys.all }),
  });
}

export function useDealsList(params?: DealsListParams) {
  return useQuery({
    queryKey: dealsQueryKeys.list(params),
    queryFn: () => dealsApi.listDeals(params),
  });
}

export function useDealDetail(id: string | null) {
  return useQuery({
    queryKey: dealsQueryKeys.detail(id ?? ""),
    queryFn: () => dealsApi.getDeal(id!),
    enabled: !!id,
  });
}

export function useCreateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: dealsApi.createDeal,
    onSuccess: () => qc.invalidateQueries({ queryKey: dealsQueryKeys.all }),
  });
}

export function useUpdateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof dealsApi.updateDeal>[1];
    }) => dealsApi.updateDeal(id, body),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: dealsQueryKeys.all });
      qc.invalidateQueries({ queryKey: dealsQueryKeys.detail(id) });
    },
  });
}

export function useDeleteDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: dealsApi.deleteDeal,
    onSuccess: () => qc.invalidateQueries({ queryKey: dealsQueryKeys.all }),
  });
}
