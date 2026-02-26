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
  detailsMarkdown?: string | null;
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

export interface TaskContact {
  id: string;
  firstName: string;
  lastName: string | null;
  companyName: string | null;
  email: string | null;
  phone: string | null;
}

export interface TaskDeal {
  id: string;
  title: string;
  value: string | number | null;
  status: string;
  currency: string;
}

export interface TaskParentOrSub {
  id: string;
  title: string;
  status: string;
}

export interface TaskAttachment {
  id: string;
  taskId: string;
  fileName: string;
  fileUrl: string;
  fileType: string | null;
  fileSize: number | null;
  createdAt: string;
}

export interface TaskDetail extends Task {
  contact?: TaskContact | null;
  deal?: TaskDeal | null;
  parentTask?: TaskParentOrSub | null;
  subTasks?: TaskParentOrSub[];
  attachments?: TaskAttachment[];
}

export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "DONE", "CANCELLED"] as const;
export type TaskStatusValue = (typeof TASK_STATUSES)[number];

export type TasksListParams = {
  page?: number;
  pageSize?: number;
  /** When true, fetch all tasks (no pagination). Used for Kanban. */
  all?: boolean;
  mine?: boolean;
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
