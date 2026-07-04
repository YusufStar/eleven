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

export type AiReportKind = "MINI" | "MEDIUM" | "HIGH";

export interface AiReport {
  id: string;
  organizationId: string;
  kind: AiReportKind;
  title: string;
  content: string;
  metrics: Record<string, unknown>;
  model: string | null;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
}

export interface AiReportsResponse {
  data: AiReport[];
  aiConfigured: boolean;
}

export const aiReportsApi = {
  list: (kind?: AiReportKind) =>
    request<AiReportsResponse>(`/ai-reports${kind ? `?kind=${kind}` : ""}`),
  generate: (kind: AiReportKind, force?: boolean) =>
    request<{ report: AiReport; fresh: boolean }>("/ai-reports/generate", {
      method: "POST",
      body: JSON.stringify({ kind, force }),
    }),
};
