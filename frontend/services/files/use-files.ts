"use client";

import { useQuery } from "@tanstack/react-query";
import { filesApi, type OrgFilesParams } from "./api";

const filesKey = ["files"] as const;

export function useOrgFiles(params?: OrgFilesParams) {
  return useQuery({
    queryKey: [...filesKey, "list", params],
    queryFn: () => filesApi.list(params),
  });
}

export function useRecentFiles() {
  return useQuery({
    queryKey: [...filesKey, "recent"],
    queryFn: () => filesApi.recent(),
  });
}
