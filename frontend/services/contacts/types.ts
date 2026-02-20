export type ContactType = "PERSON" | "COMPANY";
export type ContactStatus = "LEAD" | "PROSPECT" | "CUSTOMER" | "CHURNED" | "PARTNER";
export type ContactSource = "MANUAL" | "CSV_IMPORT" | "WEB_FORM" | "EMAIL" | "API";

export interface Contact {
  id: string;
  organizationId: string;
  type: ContactType;
  status: ContactStatus;
  source: ContactSource;
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

export type ContactsListParams = { page?: number; pageSize?: number };
