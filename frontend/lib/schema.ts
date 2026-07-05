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

const projectLinkSchema = z.object({
  title: z.string(),
  url: z.string(),
})

export const addProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name is too long"),
  description: z.string().max(2000).optional().or(z.literal("")),
  memberIds: z.array(z.string()).optional(),
  links: z.array(projectLinkSchema).optional(),
  githubRepoFullName: z.string().optional().or(z.literal("")),
  githubRepoUrl: z.string().url().optional().or(z.literal("")),
})
export type AddProjectSchema = z.infer<typeof addProjectSchema>

const taskStatusEnum = z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "DONE", "CANCELLED"])
const taskPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"])

export const addTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(500, "Title is too long"),
  description: z.string().max(5000).optional().or(z.literal("")),
  detailsMarkdown: z.string().max(100_000).optional().or(z.literal("")),
  assigneeId: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
  sprintId: z.string().nullable().optional(),
  parentTaskId: z.string().nullable().optional(),
  labels: z.array(z.string().max(40)).max(10).optional(),
  estimate: z.number().int().min(0).max(1000).nullable().optional(),
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  dueAt: z.string().nullable().optional(),
})
export type AddTaskSchema = z.infer<typeof addTaskSchema>

export const updateTaskSchema = addTaskSchema.partial().extend({
  title: z.string().min(1).max(500).optional(),
})
export type UpdateTaskSchema = z.infer<typeof updateTaskSchema>