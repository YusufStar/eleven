"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CreateOrganizationSchema, createOrganizationSchema } from "@/lib/schema"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"
import { useState } from "react"
import { Spinner } from "@/components/ui/spinner"

export function FirstOrgCreate() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const form = useForm<CreateOrganizationSchema>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  })

  const onSubmit = async (data: CreateOrganizationSchema) => {
    try {
      setIsSubmitting(true)
      const response = await authClient.organization.create({
        name: data.name,
        slug: data.slug,
      })
      if (response.error) {
        toast.error(response.error.message)
        return
      }
      if (response.data) {
        toast.success("Organization created")
        router.replace("/dashboard")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Create your first organization</CardTitle>
        <CardDescription>
          Create your first organization to get started
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Organization name</FieldLabel>
              <Input
                id="name"
                type="text"
                placeholder="Acme Inc."
                {...form.register("name")}
              />
              <FieldError>
                {form.formState.errors.name?.message}
              </FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="slug">Slug</FieldLabel>
              <Input
                id="slug"
                type="text"
                placeholder="acme"
                {...form.register("slug")}
              />
              <FieldError>
                {form.formState.errors.slug?.message}
              </FieldError>
            </Field>
            <Field>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Spinner /> Creating...
                  </span>
                ) : (
                  "Create organization"
                )}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
