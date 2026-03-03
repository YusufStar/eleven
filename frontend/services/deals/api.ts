import type {
  Pipeline,
  DealListItem,
  DealDetail,
  PaginatedDeals,
  DealsListParams,
  PipelinesResponse,
  Stage,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

async function request<T>(path: string, init?: RequestOptions): Promise<T> {
  const { body, ...rest } = init ?? {};
  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(rest.headers as HeadersInit) },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

function dealsListPath(params?: DealsListParams) {
  const u = new URL("/deals", "http://_");
  if (params?.page != null) u.searchParams.set("page", String(params.page));
  if (params?.pageSize != null) u.searchParams.set("pageSize", String(params.pageSize));
  if (params?.pipelineId) u.searchParams.set("pipelineId", params.pipelineId);
  if (params?.stageId) u.searchParams.set("stageId", params.stageId);
  if (params?.contactId) u.searchParams.set("contactId", params.contactId);
  if (params?.status) u.searchParams.set("status", params.status);
  if (params?.search) u.searchParams.set("search", params.search);
  const search = u.search;
  return search ? `/deals${search}` : "/deals";
}

export const dealsApi = {
  listPipelines: () => request<PipelinesResponse>("/deals/pipelines"),
  getPipeline: (id: string) => request<Pipeline>(`/deals/pipelines/${id}`),
  createPipeline: (body: { name?: string }) =>
    request<Pipeline>("/deals/pipelines", { method: "POST", body }),

  createStage: (pipelineId: string, body: { name?: string; color?: string }) =>
    request<Stage>(`/deals/pipelines/${pipelineId}/stages`, { method: "POST", body }),
  updateStage: (id: string, body: { name?: string; order?: number; color?: string | null }) =>
    request<Stage>(`/deals/stages/${id}`, { method: "PATCH", body }),
  deleteStage: (id: string) =>
    request<{ ok: boolean }>(`/deals/stages/${id}`, { method: "DELETE" }),

  listDeals: (params?: DealsListParams) => request<PaginatedDeals>(dealsListPath(params)),
  getDeal: (id: string) => request<DealDetail>(`/deals/${id}`),
  createDeal: (body: {
    title: string;
    value?: number;
    currency?: string;
    probability?: number;
    expectedClose?: string;
    contactId?: string | null;
    stageId?: string;
    pipelineId?: string;
    ownerId?: string | null;
  }) => request<DealListItem>("/deals", { method: "POST", body }),
  updateDeal: (
    id: string,
    body: {
      title?: string;
      value?: number | null;
      currency?: string;
      probability?: number | null;
      expectedClose?: string | null;
      contactId?: string | null;
      stageId?: string;
      ownerId?: string | null;
      status?: string;
      lostReason?: string | null;
    }
  ) => request<DealListItem>(`/deals/${id}`, { method: "PATCH", body }),
  deleteDeal: (id: string) => request<{ ok: boolean }>(`/deals/${id}`, { method: "DELETE" }),
};
