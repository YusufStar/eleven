const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export interface FileVersionEntry {
  fileUrl: string;
  fileSize: number | null;
  uploadedById: string | null;
  uploadedAt: string;
}

export interface OrgFileRow {
  id: string;
  projectId: string;
  fileName: string;
  fileUrl: string;
  fileType: string | null;
  fileSize: number | null;
  folder: string;
  versionHistory: FileVersionEntry[];
  uploadedById: string | null;
  createdAt: string;
  updatedAt: string;
  project: { id: string; name: string; slug: string };
  uploadedBy?: { id: string; user: { id: string; name: string; image: string | null } } | null;
}

export interface OrgFilesResponse {
  data: OrgFileRow[];
  total: number;
  page: number;
  pageSize: number;
  folders: { folder: string; count: number }[];
}

export type OrgFilesParams = {
  search?: string;
  projectId?: string | null;
  folder?: string | null;
  page?: number;
  pageSize?: number;
};

function listPath(params?: OrgFilesParams) {
  const u = new URL("/files", "http://_");
  if (params?.search) u.searchParams.set("search", params.search);
  if (params?.projectId) u.searchParams.set("projectId", params.projectId);
  if (params?.folder) u.searchParams.set("folder", params.folder);
  if (params?.page != null) u.searchParams.set("page", String(params.page));
  if (params?.pageSize != null) u.searchParams.set("pageSize", String(params.pageSize));
  const search = u.search;
  return search ? `/files${search}` : "/files";
}

export const filesApi = {
  list: (params?: OrgFilesParams) => request<OrgFilesResponse>(listPath(params)),
  recent: () => request<{ data: OrgFileRow[] }>("/files/recent"),
};
