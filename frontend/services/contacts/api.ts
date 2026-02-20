import type { Contact, ContactCreatePayload, ContactUpdatePayload, PaginatedContacts, ContactsListParams } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

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

function paginatedPath(path: string, params?: ContactsListParams) {
  const u = new URL(path, "http://_");
  if (params?.page != null) u.searchParams.set("page", String(params.page));
  if (params?.pageSize != null) u.searchParams.set("pageSize", String(params.pageSize));
  if (params?.search != null && params.search !== "") u.searchParams.set("search", params.search);
  const search = u.search;
  if (!search) return path;
  return `${path}${search}`;
}

export const contactsApi = {
  listPeople: (params?: ContactsListParams) => request<PaginatedContacts>(paginatedPath("/contacts/people", params)),
  listCompanies: (params?: ContactsListParams) => request<PaginatedContacts>(paginatedPath("/contacts/companies", params)),
  get: (id: string) => request<Contact>(`/contacts/get/${id}`),
  create: (payload: ContactCreatePayload) => request<Contact>("/contacts/create", { method: "POST", body: payload }),
  update: (id: string, payload: ContactUpdatePayload) => request<Contact>(`/contacts/update/${id}`, { method: "PATCH", body: payload }),
  delete: (id: string) => request<{ ok: boolean }>(`/contacts/delete/${id}`, { method: "DELETE" }),
};
