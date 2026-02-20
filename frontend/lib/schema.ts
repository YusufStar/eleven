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