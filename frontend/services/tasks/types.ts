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

export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "DONE", "CANCELLED"] as const;
export type TaskStatusValue = (typeof TASK_STATUSES)[number];

export type TasksListParams = {
  page?: number;
  pageSize?: number;
  /** When true, filter by current user as assignee (frontend default). */
  mine?: boolean;
  /** When set, filter by these assignee member ids (ignored if mine is true). */
  assigneeIds?: string[];
  projectId?: string | null;
  search?: string;
  status?: TaskStatusValue | TaskStatusValue[];
};

export interface PaginatedTasks {
  data: Task[];
  total: number;
  page: number;
  pageSize: number;
}
