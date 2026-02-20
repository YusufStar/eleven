"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { contactQueryKeys } from "./query-keys";
import { contactsApi } from "./api";
import type { ContactCreatePayload, ContactUpdatePayload, ContactsListParams } from "./types";

export function useContactsPeopleList(params?: ContactsListParams) {
  return useQuery({
    queryKey: contactQueryKeys.people(params),
    queryFn: () => contactsApi.listPeople(params),
  });
}

export function useContactsCompaniesList(params?: ContactsListParams) {
  return useQuery({
    queryKey: contactQueryKeys.companies(params),
    queryFn: () => contactsApi.listCompanies(params),
  });
}

export function useContact(id: string | null) {
  return useQuery({
    queryKey: contactQueryKeys.detail(id ?? ""),
    queryFn: () => contactsApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateContactMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ContactCreatePayload) => contactsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: contactQueryKeys.all }),
  });
}

export function useUpdateContactMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ContactUpdatePayload }) => contactsApi.update(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: contactQueryKeys.all });
      qc.invalidateQueries({ queryKey: contactQueryKeys.detail(id) });
    },
  });
}

export function useDeleteContactMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => contactsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: contactQueryKeys.all }),
  });
}
