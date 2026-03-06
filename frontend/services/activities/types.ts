export type ActivityAction = "CREATE" | "UPDATE" | "DELETE" | "VIEW";

export type ActivityEntityType =
  | "CONTACT"
  | "DEAL"
  | "PROJECT"
  | "TASK"
  | "PIPELINE"
  | "STAGE"
  | "PROJECT_FILE"
  | "TASK_ATTACHMENT"
  | "PROJECT_MEMBER";

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
