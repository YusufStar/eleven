export type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_COMPLETED"
  | "TASK_COMMENT"
  | "MENTION"
  | "PROJECT_MEMBER_ADDED"
  | "PROJECT_FILE_ADDED"
  | "MEETING_INVITED"
  | "SPRINT_STARTED"
  | "GENERIC";

export type NotificationCategory = "task" | "mention" | "project" | "meeting" | "system";
export type NotificationPriority = "low" | "normal" | "high";

export interface AppNotification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  archivedAt: string | null;
  snoozedUntil: string | null;
  createdAt: string;
  actor: { id: string; user: { name: string; image: string | null } } | null;
}

export interface NotificationsListResponse {
  data: AppNotification[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CategoryPref {
  inApp: boolean;
  email: boolean;
}

export interface NotificationPreferences {
  memberId?: string;
  categories: Partial<Record<NotificationCategory, CategoryPref>>;
  emailEnabled: boolean;
  pushEnabled: boolean;
  quietHoursStart: number | null;
  quietHoursEnd: number | null;
  digest: "off" | "daily" | "weekly";
}

export type NotificationsListParams = {
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
  archived?: boolean;
  category?: NotificationCategory;
};
