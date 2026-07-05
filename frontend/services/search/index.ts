"use client";

import { useQuery } from "@tanstack/react-query";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

export interface SearchResults {
  tasks: { id: string; title: string; status: string; priority: string }[];
  projects: { id: string; name: string }[];
  sprints: { id: string; name: string; startsAt: string; endsAt: string }[];
  files: { id: string; fileName: string; fileUrl: string; projectId: string }[];
  people: { id: string; user: { id: string; name: string; email: string; image: string | null } }[];
}

const EMPTY: SearchResults = { tasks: [], projects: [], sprints: [], files: [], people: [] };

async function search(q: string): Promise<SearchResults> {
  const res = await fetch(`${BASE}/search?q=${encodeURIComponent(q)}`, { credentials: "include" });
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

export function useGlobalSearch(q: string) {
  const query = q.trim();
  return useQuery({
    queryKey: ["global-search", query],
    queryFn: () => search(query),
    enabled: query.length >= 2,
    placeholderData: (prev) => prev ?? EMPTY,
    staleTime: 10_000,
  });
}
