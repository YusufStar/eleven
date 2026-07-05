import type {
  AiReport,
  AiReportKind,
  AiReportAction,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers as HeadersInit) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export type { AiReport, AiReportKind, AiReportAction };
export type {
  ReportDashboard,
  ReportKpi,
  ReportChart,
  ReportHighlight,
  AiReportActionType,
  AiReportActionStatus,
  AiReportMetrics,
} from "./types";
export {
  getReportDashboard,
  parseLegacyActionsFromMarkdown,
} from "./types";

export interface AiReportsResponse {
  data: AiReport[];
  aiConfigured: boolean;
}

export const aiReportsApi = {
  list: (kind?: AiReportKind) =>
    request<AiReportsResponse>(`/ai-reports${kind ? `?kind=${kind}` : ""}`),
  get: (id: string) => request<{ report: AiReport }>(`/ai-reports/${id}`),
  generate: (kind: AiReportKind, force?: boolean) =>
    request<{ report: AiReport; fresh: boolean }>("/ai-reports/generate", {
      method: "POST",
      body: JSON.stringify({ kind, force }),
    }),
  applyAction: (reportId: string, actionId: string) =>
    request<{ action: AiReportAction; ok: boolean; message: string }>(
      `/ai-reports/${reportId}/actions/${actionId}/apply`,
      { method: "POST" },
    ),
  applyAllActions: (reportId: string) =>
    request<{
      results: Array<{ actionId: string; ok: boolean; message: string }>;
      applied: number;
      failed: number;
    }>(`/ai-reports/${reportId}/actions/apply-all`, { method: "POST" }),
};
