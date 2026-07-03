export type NotificationType =
  | "TASK_ASSIGNED"
  | "DEAL_STAGE_CHANGED"
  | "DEAL_WON"
  | "PROJECT_MEMBER_ADDED"
  | "MEETING_INVITED"
  | "CONTACTS_IMPORTED"
  | "GENERIC";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
  actor: { id: string; user: { name: string; image: string | null } } | null;
}

export interface NotificationsListResponse {
  data: AppNotification[];
  total: number;
  page: number;
  pageSize: number;
}
