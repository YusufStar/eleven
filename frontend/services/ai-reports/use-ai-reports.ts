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

export function useGenerateAiReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ kind, force }: { kind: AiReportKind; force?: boolean }) =>
      aiReportsApi.generate(kind, force),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });
}
