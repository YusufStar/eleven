export interface Project {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description: string | null;
  links?: ProjectLinkItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectLinkItem {
  title: string;
  url: string;
}

export interface ProjectMemberUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

export interface ProjectMemberRow {
  id: string;
  projectId: string;
  memberId: string;
  createdAt: string;
  member: { id: string; user: ProjectMemberUser };
}

export interface ProjectFileRow {
  id: string;
  projectId: string;
  fileName: string;
  fileUrl: string;
  fileType: string | null;
  fileSize: number | null;
  uploadedById: string | null;
  createdAt: string;
  uploadedBy?: { id: string; user: { id: string; name: string } } | null;
}

export interface ProjectDetail extends Project {
  tasks: unknown[];
  members: ProjectMemberRow[];
  files: ProjectFileRow[];
}

export type ProjectsListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export interface PaginatedProjects {
  data: Project[];
  total: number;
  page: number;
  pageSize: number;
}
