import type {
  PaginatedTasks,
  Sprint,
  Task,
  TaskAttachment,
  TaskComment,
  TaskDependency,
  TaskDetail,
  TasksListParams,
  TimeEntry,
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

function listPath(params?: TasksListParams) {
  const u = new URL("/tasks", "http://_");
  if (params?.all) u.searchParams.set("all", "true");
  else {
    if (params?.page != null) u.searchParams.set("page", String(params.page));
    if (params?.pageSize != null) u.searchParams.set("pageSize", String(params.pageSize));
  }
  if (params?.mine) u.searchParams.set("mine", "true");
  if (params?.assigneeIds?.length) u.searchParams.set("assigneeIds", params.assigneeIds.join(","));
  if (params?.projectId != null && params.projectId !== "") u.searchParams.set("projectId", params.projectId);
  if (params?.sprintId != null && params.sprintId !== "") u.searchParams.set("sprintId", params.sprintId);
  if (params?.label != null && params.label !== "") u.searchParams.set("label", params.label);
  if (params?.search != null && params.search !== "") u.searchParams.set("search", params.search);
  const statusArr = params?.status == null ? [] : Array.isArray(params.status) ? params.status : [params.status];
  statusArr.forEach((s) => u.searchParams.append("status", s));
  const search = u.search;
  return search ? `/tasks${search}` : "/tasks";
}

export type CreateTaskPayload = {
  title: string;
  description?: string | null;
  detailsMarkdown?: string | null;
  assigneeId?: string | null;
  projectId?: string | null;
  sprintId?: string | null;
  milestoneId?: string | null;
  parentTaskId?: string | null;
  status?: string;
  priority?: string;
  labels?: string[];
  estimate?: number | null;
  dueAt?: string | null;
};

export type UpdateTaskPayload = Partial<CreateTaskPayload>;

export type BulkUpdatePayload = {
  ids: string[];
  status?: string;
  priority?: string;
  assigneeId?: string | null;
  sprintId?: string | null;
};

export type AddAttachmentPayload = {
  fileUrl: string;
  fileName: string;
  fileType?: string | null;
  fileSize?: number | null;
};

export const tasksApi = {
  list: (params?: TasksListParams) => request<PaginatedTasks>(listPath(params)),
  getById: (taskId: string) => request<TaskDetail>(`/tasks/${taskId}`),
  create: (payload: CreateTaskPayload) =>
    request<Task>("/tasks", { method: "POST", body: JSON.stringify(payload) }),
  update: (taskId: string, payload: UpdateTaskPayload) =>
    request<TaskDetail>(`/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify(payload) }),
  updateStatus: (taskId: string, status: string) =>
    request<Task>(`/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  delete: (taskId: string) => request<{ ok: boolean }>(`/tasks/${taskId}`, { method: "DELETE" }),
  bulkUpdate: (payload: BulkUpdatePayload) =>
    request<{ ok: boolean; count: number }>("/tasks/bulk", { method: "PATCH", body: JSON.stringify(payload) }),
  bulkDelete: (ids: string[]) =>
    request<{ ok: boolean; count: number }>("/tasks/bulk-delete", { method: "POST", body: JSON.stringify({ ids }) }),
  addComment: (taskId: string, body: string, mentionMemberIds?: string[]) =>
    request<TaskComment>(`/tasks/${taskId}/comments`, {
      method: "POST",
      body: JSON.stringify({ body, mentionMemberIds }),
    }),
  deleteComment: (taskId: string, commentId: string) =>
    request<{ ok: boolean }>(`/tasks/${taskId}/comments/${commentId}`, { method: "DELETE" }),
  toggleWatch: (taskId: string) =>
    request<{ watching: boolean }>(`/tasks/${taskId}/watchers/toggle`, { method: "POST" }),
  addDependency: (taskId: string, dependsOnId: string) =>
    request<TaskDependency>(`/tasks/${taskId}/dependencies`, {
      method: "POST",
      body: JSON.stringify({ dependsOnId }),
    }),
  removeDependency: (taskId: string, depId: string) =>
    request<{ ok: boolean }>(`/tasks/${taskId}/dependencies/${depId}`, { method: "DELETE" }),
  logTime: (taskId: string, minutes: number, note?: string | null) =>
    request<TimeEntry>(`/tasks/${taskId}/time`, { method: "POST", body: JSON.stringify({ minutes, note }) }),
  addAttachment: (taskId: string, payload: AddAttachmentPayload) =>
    request<TaskAttachment>(`/tasks/${taskId}/attachments`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  deleteAttachment: (taskId: string, attachmentId: string) =>
    request<{ ok: boolean }>(`/tasks/${taskId}/attachments/${attachmentId}`, { method: "DELETE" }),
  // Sprints
  listSprints: () => request<Sprint[]>("/sprints"),
  createSprint: (payload: { name: string; goal?: string | null; startsAt: string; endsAt: string }) =>
    request<Sprint>("/sprints", { method: "POST", body: JSON.stringify(payload) }),
  updateSprint: (id: string, payload: Partial<{ name: string; goal: string | null; startsAt: string; endsAt: string }>) =>
    request<Sprint>(`/sprints/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteSprint: (id: string) => request<{ ok: boolean }>(`/sprints/${id}`, { method: "DELETE" }),
};
