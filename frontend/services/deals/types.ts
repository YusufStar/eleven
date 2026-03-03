export type DealStatus = "OPEN" | "WON" | "LOST";

export interface Stage {
  id: string;
  pipelineId: string;
  name: string;
  order: number;
  color: string | null;
}

export interface Pipeline {
  id: string;
  organizationId: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  stages: Stage[];
}

export interface DealContactRef {
  id: string;
  firstName: string;
  lastName: string | null;
  companyName: string | null;
  email: string | null;
}

export interface DealListItem {
  id: string;
  organizationId: string;
  title: string;
  value: string | null;
  currency: string;
  probability: number | null;
  expectedClose: string | null;
  status: DealStatus;
  lostReason: string | null;
  contactId: string | null;
  stageId: string;
  pipelineId: string;
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
  stage: { id: string; name: string; order: number; color: string | null };
  pipeline: { id: string; name: string };
  contact: DealContactRef | null;
  owner: { id: string; user: { id: string; name: string } } | null;
}

export interface DealDetailActivity {
  id: string;
  type: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  isDone: boolean;
  completedAt: string | null;
  createdAt: string;
}

export interface DealDetailTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueAt: string | null;
  completedAt: string | null;
}

export interface DealDetail extends DealListItem {
  contact: DealContactRef | null;
  activities: DealDetailActivity[];
  tasks: DealDetailTask[];
}

export type DealsListParams = {
  page?: number;
  pageSize?: number;
  pipelineId?: string;
  stageId?: string;
  contactId?: string;
  status?: DealStatus;
  search?: string;
};

export interface PaginatedDeals {
  data: DealListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PipelinesResponse {
  data: Pipeline[];
}
