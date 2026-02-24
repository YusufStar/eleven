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
};

export const projectsApi = {
  list: (params?: ProjectsListParams) => request<PaginatedProjects>(listPath(params)),
  get: (id: string) => request<ProjectDetail>(`/projects/${id}`),
  create: (body: { name: string; description?: string }) =>
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

  listFiles: (projectId: string) => request<ProjectFileRow[]>(`/projects/${projectId}/files`),
  addFile: (projectId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<ProjectFileRow>(`/projects/${projectId}/files`, { method: "POST", body: form });
  },
  addFileByUrl: (projectId: string, body: { fileName: string; fileUrl: string; fileType?: string; fileSize?: number }) =>
    request<ProjectFileRow>(`/projects/${projectId}/files`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  deleteFile: (projectId: string, fileId: string) =>
    request<{ ok: boolean }>(`/projects/${projectId}/files/${fileId}`, { method: "DELETE" }),
};
