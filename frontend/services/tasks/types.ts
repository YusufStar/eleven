export interface TaskMemberUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

export interface TaskAssignee {
  id: string;
  user: TaskMemberUser;
}

export interface TaskProject {
  id: string;
  name: string;
  slug: string;
}

export interface Task {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueAt: string | null;
  completedAt: string | null;
  assigneeId: string | null;
  creatorId: string | null;
  projectId: string | null;
  contactId: string | null;
  dealId: string | null;
  parentTaskId: string | null;
  createdAt: string;
  updatedAt: string;
  assignee?: TaskAssignee | null;
  creator?: { id: string; user: TaskMemberUser } | null;
  project?: TaskProject | null;
}

export type TasksListParams = {
  page?: number;
  pageSize?: number;
  assigneeId?: string;
  projectId?: string;
  mine?: boolean;
};

export interface PaginatedTasks {
  data: Task[];
  total: number;
  page: number;
  pageSize: number;
}
