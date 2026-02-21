"use client";

import { useQuery } from "@tanstack/react-query";
import { teamApi } from "./api";
import type { TeamMembersListParams } from "./types";

const teamMembersKey = ["team", "members"] as const;

export function useTeamMembersList(params?: TeamMembersListParams) {
  return useQuery({
    queryKey: [...teamMembersKey, params],
    queryFn: () => teamApi.listMembers(params),
  });
}
