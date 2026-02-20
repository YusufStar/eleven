"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CreateOrganizationSchema, createOrganizationSchema } from "@/lib/schema"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { UserIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { UploadModal } from "../ui/upload-modal"

export type CreateOrgModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateOrgModal({
  open,
  onOpenChange,
}: CreateOrgModalProps) {
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

  useEffect(() => {
    if (!open) {
      form.reset({ avatar: undefined, name: "", slug: "" })
    }
  }, [open, form])

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
      if (response.data?.id) {
        toast.success("Organization created")
        await authClient.organization.setActive({
          organizationId: response.data.id,
          organizationSlug: response.data.slug,
        })
        onOpenChange(false)
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
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Create organization</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Avatar
                className="size-16 rounded-lg cursor-pointer mx-auto"
                onClick={() => setOpenUploadModal(true)}
              >
                <AvatarImage src={form.watch("avatar")} className="rounded-lg" />
                <AvatarFallback className="rounded-lg">
                  <HugeiconsIcon icon={UserIcon} className="size-4" />
                </AvatarFallback>
              </Avatar>

              <Field>
                <FieldLabel htmlFor="create-org-name">Organization name</FieldLabel>
                <Input
                  id="create-org-name"
                  type="text"
                  placeholder="Acme Inc."
                  {...form.register("name")}
                />
                <FieldError>
                  {form.formState.errors.name?.message}
                </FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="create-org-slug">Slug</FieldLabel>
                <Input
                  id="create-org-slug"
                  type="text"
                  placeholder="acme"
                  {...form.register("slug")}
                />
                <FieldError>
                  {form.formState.errors.slug?.message}
                </FieldError>
              </Field>
              <Field>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Spinner /> Creating...
                    </span>
                  ) : (
                    "Create organization"
                  )}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
