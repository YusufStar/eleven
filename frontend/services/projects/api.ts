import type {
  PaginatedProjects,
  ProjectDetail,
  ProjectFileRow,
  ProjectMemberRow,
  ProjectLinkItem,
  ProjectsListParams,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const isForm = init?.body instanceof FormData;
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: isForm ? (init?.headers as HeadersInit) : { "Content-Type": "application/json", ...(init?.headers as HeadersInit) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

function listPath(params?: ProjectsListParams) {
  const u = new URL("/projects", "http://_");
  if (params?.page != null) u.searchParams.set("page", String(params.page));
  if (params?.pageSize != null) u.searchParams.set("pageSize", String(params.pageSize));
  if (params?.search != null && params.search !== "") u.searchParams.set("search", params.search);
  const search = u.search;
  return search ? `/projects${search}` : "/projects";
}

export type ProjectUpdateBody = {
  name?: string;
  description?: string;
  links?: ProjectLinkItem[];
  githubRepoFullName?: string | null;
  githubRepoUrl?: string | null;
};

export const projectsApi = {
  list: (params?: ProjectsListParams) => request<PaginatedProjects>(listPath(params)),
  get: (id: string) => request<ProjectDetail>(`/projects/${id}`),
  getDetail: (idOrSlug: string) => request<ProjectDetail>(`/projects/detail/${encodeURIComponent(idOrSlug)}`),
  create: (body: { name: string; description?: string; links?: ProjectLinkItem[]; githubRepoFullName?: string; githubRepoUrl?: string }) =>
    request<import("./types").Project>("/projects", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: ProjectUpdateBody) =>
    request<import("./types").Project>(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (id: string) => request<{ ok: boolean }>(`/projects/${id}`, { method: "DELETE" }),

  listMembers: (projectId: string) => request<ProjectMemberRow[]>(`/projects/${projectId}/members`),
  addMember: (projectId: string, memberId: string) =>
    request<ProjectMemberRow>(`/projects/${projectId}/members`, {
      method: "POST",
      body: JSON.stringify({ memberId }),
    }),
  removeMember: (projectId: string, memberId: string) =>
    request<{ ok: boolean }>(`/projects/${projectId}/members/${memberId}`, { method: "DELETE" }),

  listFiles: (projectId: string, params?: { search?: string }) => {
    const search = params?.search?.trim();
    const path = search ? `/projects/${projectId}/files?search=${encodeURIComponent(search)}` : `/projects/${projectId}/files`;
    return request<ProjectFileRow[]>(path);
  },
  addFile: (projectId: string, file: File, folder?: string) => {
    const form = new FormData();
    form.append("file", file);
    if (folder) form.append("folder", folder);
    return request<ProjectFileRow>(`/projects/${projectId}/files`, { method: "POST", body: form });
  },
  addFileByUrl: (projectId: string, body: { fileName: string; fileUrl: string; fileType?: string; fileSize?: number }) =>
    request<ProjectFileRow>(`/projects/${projectId}/files`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  deleteFile: (projectId: string, fileId: string) =>
    request<{ ok: boolean }>(`/projects/${projectId}/files/${fileId}`, { method: "DELETE" }),

  getFileDownloadUrl: (projectId: string, fileId: string) =>
    `${BASE}/projects/${projectId}/files/${fileId}/download`,

  getInsights: (projectId: string) => request<ProjectInsights>(`/projects/${projectId}/insights`),

  listMilestones: (projectId: string) => request<MilestoneRow[]>(`/projects/${projectId}/milestones`),
  addMilestone: (projectId: string, body: { name: string; description?: string | null; dueAt?: string | null }) =>
    request<MilestoneRow>(`/projects/${projectId}/milestones`, { method: "POST", body: JSON.stringify(body) }),
  updateMilestone: (
    projectId: string,
    milestoneId: string,
    body: Partial<{ name: string; description: string | null; dueAt: string | null; completed: boolean }>
  ) =>
    request<MilestoneRow>(`/projects/${projectId}/milestones/${milestoneId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteMilestone: (projectId: string, milestoneId: string) =>
    request<{ ok: boolean }>(`/projects/${projectId}/milestones/${milestoneId}`, { method: "DELETE" }),
};

export interface ProjectInsights {
  total: number;
  done: number;
  blocked: number;
  overdue: number;
  inProgress: number;
  inReview: number;
  todo: number;
  progress: number;
  health: "on-track" | "at-risk" | "off-track" | "no-data";
  weeks: { week: string; created: number; completed: number; points: number }[];
}

export interface MilestoneRow {
  id: string;
  name: string;
  description: string | null;
  dueAt: string | null;
  completedAt: string | null;
  taskCount: number;
  doneCount: number;
}
