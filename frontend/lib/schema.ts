import { z } from "zod"

export const loginSchema = z.object({
    email: z.email("Invalid email address").min(1, "Email is required"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
})
export type LoginSchema = z.infer<typeof loginSchema>

export const signupSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.email("Invalid email address").min(1, "Email is required"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    confirmPassword: z.string().min(8, "Password must be at least 8 characters long"),
}).refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
})
export type SignupSchema = z.infer<typeof signupSchema>

export const createOrganizationSchema = z.object({
    avatar: z.string().optional(),
    name: z.string().min(1, "Name is required"),
    slug: z.string().min(1, "Slug is required"),
})
export type CreateOrganizationSchema = z.infer<typeof createOrganizationSchema>

const contactStatusEnum = z.enum(["LEAD", "PROSPECT", "CUSTOMER", "CHURNED", "PARTNER"])

export const addContactPersonSchema = z.object({
    avatar: z.string().optional(),
    firstName: z.string().min(1, "First name is required").max(120, "First name is too long"),
    lastName: z.string().min(1, "Last name is required").max(120, "Last name is too long"),
    email: z.string().min(1, "Email is required").email("Invalid email"),
    phone: z.string().max(40).optional().or(z.literal("")),
    title: z.string().min(1, "Title is required").max(120, "Title is too long"),
    companyId: z.string().nullable().optional(),
    companyName: z.string().max(200).optional().or(z.literal("")),
    status: contactStatusEnum.optional(),
})
export type AddContactPersonSchema = z.infer<typeof addContactPersonSchema>

export const addContactCompanySchema = z.object({
    avatar: z.string().optional(),
    companyName: z.string().min(1, "Company name is required").max(200, "Company name is too long"),
    website: z.string().max(500).optional().or(z.literal("")),
    industry: z.string().max(120).optional().or(z.literal("")),
    employeeCount: z.preprocess(
      (v): number | undefined => (v === "" || v === undefined ? undefined : Number(v)),
      z.number().int().min(0).optional()
    ),
    status: contactStatusEnum.optional(),
})
export type AddContactCompanySchema = z.infer<typeof addContactCompanySchema>

const projectLinkSchema = z.object({
  title: z.string(),
  url: z.string(),
})

export const addProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name is too long"),
  description: z.string().max(2000).optional().or(z.literal("")),
  memberIds: z.array(z.string()).optional(),
  links: z.array(projectLinkSchema).optional(),
})
export type AddProjectSchema = z.infer<typeof addProjectSchema>

const taskStatusEnum = z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"])
const taskPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"])

export const addTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(500, "Title is too long"),
  description: z.string().max(5000).optional().or(z.literal("")),
  detailsMarkdown: z.string().max(100_000).optional().or(z.literal("")),
  assigneeId: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
  contactId: z.string().nullable().optional(),
  parentTaskId: z.string().nullable().optional(),
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  dueAt: z.string().nullable().optional(),
})
export type AddTaskSchema = z.infer<typeof addTaskSchema>

export const updateTaskSchema = addTaskSchema.partial().extend({
  title: z.string().min(1).max(500).optional(),
})
export type UpdateTaskSchema = z.infer<typeof updateTaskSchema>