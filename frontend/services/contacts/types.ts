export type ContactType = "PERSON" | "COMPANY";
export type ContactStatus = "LEAD" | "PROSPECT" | "CUSTOMER" | "CHURNED" | "PARTNER";
export type ContactSource = "MANUAL" | "CSV_IMPORT" | "WEB_FORM" | "EMAIL" | "API";

export interface Contact {
  id: string;
  organizationId: string;
  type: ContactType;
  status: ContactStatus;
  source: ContactSource;
  avatar: string | null;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
  companyName: string | null;
  website: string | null;
  industry: string | null;
  employeeCount: number | null;
  companyId: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  ownerId: string | null;
  notes: string | null;
  tags: string[];
  customFields: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export type ContactCreatePayload = Pick<Contact, "firstName"> &
  Partial<Omit<Contact, "id" | "organizationId" | "firstName" | "createdAt" | "updatedAt">>;

export type ContactUpdatePayload = Partial<Omit<Contact, "id" | "organizationId" | "createdAt" | "updatedAt">>;

export type PaginatedContacts = {
  data: Contact[];
  total: number;
  page: number;
  pageSize: number;
};

export type ContactsListParams = { page?: number; pageSize?: number; search?: string; status?: ContactStatus | "" | "all" };

// Detail: minimal related entities for contact detail page
export interface ContactDetailDeal {
  id: string;
  title: string;
  value: string | null;
  currency: string;
  status: string;
  stageId: string;
  expectedClose: string | null;
  stage: { name: string; color: string | null };
  pipeline: { name: string };
}

export interface ContactDetailActivity {
  id: string;
  type: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  isDone: boolean;
  completedAt: string | null;
  createdAt: string;
}

export interface ContactDetailTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueAt: string | null;
  completedAt: string | null;
}

export interface ContactDetailCompanyRef {
  id: string;
  companyName: string | null;
  website: string | null;
  industry: string | null;
  status: ContactStatus;
  avatar: string | null;
}

export interface ContactDetailEmployeeRef {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  title: string | null;
  phone: string | null;
  status: ContactStatus;
  avatar: string | null;
}

export interface ContactPersonDetailResponse {
  contact: Contact;
  company: ContactDetailCompanyRef | null;
  deals: ContactDetailDeal[];
  activities: ContactDetailActivity[];
  tasks: ContactDetailTask[];
}

export interface ContactCompanyDetailResponse {
  contact: Contact;
  employees: ContactDetailEmployeeRef[];
  deals: ContactDetailDeal[];
  activities: ContactDetailActivity[];
  tasks: ContactDetailTask[];
}
