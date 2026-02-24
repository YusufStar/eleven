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
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { UserIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { UploadModal } from "../ui/upload-modal"

export function FirstOrgCreate() {
  const router = useRouter()
  const [openUploadModal, setOpenUploadModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const form = useForm<CreateOrganizationSchema>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      avatar: undefined,
      name: "",
      slug: "",
    },
  })

  const onSubmit = async (data: CreateOrganizationSchema) => {
    try {
      setIsSubmitting(true)
      const response = await authClient.organization.create({
        logo: data.avatar,
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
    <>
      <UploadModal
        isAvatar={true}
        open={openUploadModal}
        onOpenChange={setOpenUploadModal}
        title="Upload your organization logo"
        onDrop={(_, __, url) => {
          if (url) form.setValue("avatar", url)
        }}
        accept={{ "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp"] }}
        maxFiles={1}
        maxSize={10 * 1024 * 1024}
      />
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
              <Avatar className="size-16 rounded-lg cursor-pointer mx-auto after:rounded-lg" onClick={() => setOpenUploadModal(true)}>
                <AvatarImage src={form.watch("avatar")} className="rounded-lg"/>
                <AvatarFallback className="rounded-lg">
                  <HugeiconsIcon icon={UserIcon} className="size-4" />
                </AvatarFallback>
              </Avatar>

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
    </>
  )
}
