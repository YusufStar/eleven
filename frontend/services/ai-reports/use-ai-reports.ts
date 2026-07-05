"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { aiReportsApi, type AiReportKind } from "./api";

const key = ["ai-reports"] as const;

export function useAiReports(kind?: AiReportKind) {
  return useQuery({
    queryKey: [...key, kind ?? "all"],
    queryFn: () => aiReportsApi.list(kind),
  });
}

export function useAiReport(id: string | null) {
  return useQuery({
    queryKey: [...key, "detail", id],
    queryFn: () => aiReportsApi.get(id!),
    enabled: !!id,
  });
}

export function useGenerateAiReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ kind, force }: { kind: AiReportKind; force?: boolean }) =>
      aiReportsApi.generate(kind, force),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function useApplyAiReportAction(reportId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (actionId: string) => aiReportsApi.applyAction(reportId, actionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useApplyAllAiReportActions(reportId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => aiReportsApi.applyAllActions(reportId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export type {
  AiReport,
  AiReportKind,
  AiReportAction,
  ReportDashboard,
  ReportKpi,
  ReportChart,
} from "./api";
export { getReportDashboard } from "./api";
