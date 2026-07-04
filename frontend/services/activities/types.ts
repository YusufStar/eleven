export type ActivityAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "VIEW"
  | "COMMENT"
  | "ASSIGN"
  | "COMPLETE"
  | "MENTION";

export type ActivityEntityType =
  | "PROJECT"
  | "TASK"
  | "SPRINT"
  | "MILESTONE"
  | "PROJECT_FILE"
  | "TASK_ATTACHMENT"
  | "PROJECT_MEMBER"
  | "MESSAGE"
  | "MEETING"
  | "MEMBER"
  | "AI_REPORT";

export interface ActivityListItem {
  id: string;
  organizationId: string;
  memberId: string;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId: string;
  entityTitle: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  member: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string | null;
      image: string | null;
    };
  };
}

export type ActivitiesListParams = {
  page?: number;
  pageSize?: number;
  action?: ActivityAction;
  entityType?: ActivityEntityType;
  memberId?: string;
  entityId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
};

export interface PaginatedActivities {
  data: ActivityListItem[];
  total: number;
  page: number;
  pageSize: number;
}
