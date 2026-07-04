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

export interface TaskSprint {
  id: string;
  name: string;
  startsAt?: string;
  endsAt?: string;
}

export interface TaskMilestone {
  id: string;
  name: string;
  dueAt: string | null;
}

export interface Task {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  detailsMarkdown?: string | null;
  status: string;
  priority: string;
  labels: string[];
  estimate: number | null;
  timeSpentMinutes: number;
  dueAt: string | null;
  completedAt: string | null;
  assigneeId: string | null;
  creatorId: string | null;
  projectId: string | null;
  sprintId: string | null;
  milestoneId: string | null;
  parentTaskId: string | null;
  createdAt: string;
  updatedAt: string;
  assignee?: TaskAssignee | null;
  creator?: { id: string; user: TaskMemberUser } | null;
  project?: TaskProject | null;
  sprint?: TaskSprint | null;
  _count?: { subTasks: number; comments: number };
}

export interface TaskParentOrSub {
  id: string;
  title: string;
  status: string;
  priority?: string;
  assigneeId?: string | null;
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

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author?: { id: string; user: TaskMemberUser } | null;
}

export interface TaskWatcher {
  id: string;
  taskId: string;
  memberId: string;
  member?: { id: string; user: TaskMemberUser } | null;
}

export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnId: string;
  dependsOn?: TaskParentOrSub;
  task?: TaskParentOrSub;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  memberId: string;
  minutes: number;
  note: string | null;
  createdAt: string;
  member?: { id: string; user: TaskMemberUser } | null;
}

export interface TaskDetail extends Task {
  milestone?: TaskMilestone | null;
  parentTask?: TaskParentOrSub | null;
  subTasks?: TaskParentOrSub[];
  attachments?: TaskAttachment[];
  comments?: TaskComment[];
  watchers?: TaskWatcher[];
  dependsOn?: TaskDependency[];
  dependedOnBy?: TaskDependency[];
  timeEntries?: TimeEntry[];
}

export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "DONE", "CANCELLED"] as const;
export type TaskStatusValue = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export type TaskPriorityValue = (typeof TASK_PRIORITIES)[number];

export type TasksListParams = {
  page?: number;
  pageSize?: number;
  /** When true, fetch all tasks (no pagination). Used for Kanban. */
  all?: boolean;
  mine?: boolean;
  assigneeIds?: string[];
  projectId?: string | null;
  sprintId?: string | null;
  label?: string | null;
  search?: string;
  status?: TaskStatusValue | TaskStatusValue[];
};

export interface PaginatedTasks {
  data: Task[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Sprint {
  id: string;
  name: string;
  goal: string | null;
  startsAt: string;
  endsAt: string;
  state: "upcoming" | "active" | "done";
  taskCount: number;
  doneCount: number;
  committedPoints: number;
  completedPoints: number;
}
