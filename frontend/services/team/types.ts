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
  user: TeamMemberUser;
}

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
