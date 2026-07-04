export interface TeamMemberUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  githubProfile?: { githubLogin: string; avatarUrl: string | null } | null;
}

export interface TeamMember {
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  createdAt: string;
  statusEmoji: string | null;
  statusText: string | null;
  workingOn: string | null;
  timezone: string | null;
  skills: string[];
  lastSeenAt: string | null;
  user: TeamMemberUser;
}

export type UpdateMePayload = Partial<{
  statusEmoji: string | null;
  statusText: string | null;
  workingOn: string | null;
  timezone: string | null;
  skills: string[];
}>;

export type TeamMembersListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string | "all";
};

export interface PaginatedTeamMembers {
  data: TeamMember[];
  total: number;
  page: number;
  pageSize: number;
}
