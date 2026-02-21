"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller } from "react-hook-form";
import { addContactPersonSchema, type AddContactPersonSchema } from "@/lib/schema";
import { useCreateContactMutation } from "@/services/contacts";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { CompanySelect } from "@/components/contacts/people/company-select";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UploadModal } from "@/components/ui/upload-modal";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserIcon } from "@hugeicons/core-free-icons";
import {
  SparklesIcon,
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

type StatusValue = NonNullable<AddContactPersonSchema["status"]>;

const STATUS_BADGES: Record<
  StatusValue,
  { label: string; icon: typeof SparklesIcon; className: string }
> = {
  LEAD: {
    label: "Lead",
    icon: SparklesIcon,
    className:
      "bg-amber-500/12 text-amber-700 dark:text-amber-400 border-amber-500/20 [&_svg]:text-amber-600 dark:[&_svg]:text-amber-400",
  },
  PROSPECT: {
    label: "Prospect",
    icon: ArrowRight01Icon,
    className:
      "bg-blue-500/12 text-blue-700 dark:text-blue-400 border-blue-500/20 [&_svg]:text-blue-600 dark:[&_svg]:text-blue-400",
  },
  CUSTOMER: {
    label: "Customer",
    icon: CheckmarkCircle01Icon,
    className:
      "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 [&_svg]:text-emerald-600 dark:[&_svg]:text-emerald-400",
  },
  CHURNED: {
    label: "Churned",
    icon: Cancel01Icon,
    className:
      "bg-red-500/12 text-red-700 dark:text-red-400 border-red-500/20 [&_svg]:text-red-600 dark:[&_svg]:text-red-400",
  },
  PARTNER: {
    label: "Partner",
    icon: UserGroupIcon,
    className:
      "bg-violet-500/12 text-violet-700 dark:text-violet-400 border-violet-500/20 [&_svg]:text-violet-600 dark:[&_svg]:text-violet-400",
  },
};

export type AddContactPeopleModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const defaultValues: AddContactPersonSchema = {
  avatar: undefined,
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  title: "",
  companyId: null,
  companyName: "",
  status: "LEAD",
};

function emptyStrToUndefined<T>(v: T): T | undefined {
  if (typeof v === "string" && v.trim() === "") return undefined;
  return v;
}

export function AddContactPeopleModal({ open, onOpenChange }: AddContactPeopleModalProps) {
  const [openUploadModal, setOpenUploadModal] = useState(false);
  const createMutation = useCreateContactMutation();

  const form = useForm<AddContactPersonSchema>({
    resolver: zodResolver(addContactPersonSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!open) {
      form.reset(defaultValues);
    }
  }, [open, form]);

  const onSubmit = async (data: AddContactPersonSchema) => {
    try {
      await createMutation.mutateAsync({
        type: "PERSON",
        avatar: data.avatar ?? undefined,
        firstName: data.firstName.trim(),
        lastName: emptyStrToUndefined(data.lastName)?.trim() ?? undefined,
        email: emptyStrToUndefined(data.email)?.trim() ?? undefined,
        phone: emptyStrToUndefined(data.phone)?.trim() ?? undefined,
        title: emptyStrToUndefined(data.title)?.trim() ?? undefined,
        companyId: data.companyId ?? undefined,
        companyName: emptyStrToUndefined(data.companyName)?.trim() ?? undefined,
        status: data.status ?? "LEAD",
      });
      toast.success("Contact added.");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add contact.");
    }
  };

  const isSubmitting = createMutation.isPending;

  return (
    <>
      <UploadModal
        isAvatar
        open={openUploadModal}
        onOpenChange={setOpenUploadModal}
        title="Upload profile photo"
        onDrop={(_, __, url) => {
          if (url) form.setValue("avatar", url);
        }}
        accept={{ "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp"] }}
        maxFiles={1}
        maxSize={10 * 1024 * 1024}
      />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Add contact</DialogTitle>
            <DialogDescription>Add a new person to your contact directory.</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} id="add-contact-form">
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel>Profile photo</FieldLabel>
                <Avatar
                  className="size-16 rounded-full cursor-pointer after:rounded-full"
                  onClick={() => setOpenUploadModal(true)}
                >
                  <AvatarImage src={form.watch("avatar")} />
                  <AvatarFallback>
                    <HugeiconsIcon icon={UserIcon} className="size-8" strokeWidth={2} />
                  </AvatarFallback>
                </Avatar>
              </Field>
              <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="add-contact-firstName">First name</FieldLabel>
                <Input
                  id="add-contact-firstName"
                  type="text"
                  placeholder="Jane"
                  autoComplete="given-name"
                  {...form.register("firstName")}
                />
                <FieldError>{form.formState.errors.firstName?.message}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="add-contact-lastName">Last name</FieldLabel>
                <Input
                  id="add-contact-lastName"
                  type="text"
                  placeholder="Doe"
                  autoComplete="family-name"
                  {...form.register("lastName")}
                />
                <FieldError>{form.formState.errors.lastName?.message}</FieldError>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="add-contact-email">Email</FieldLabel>
              <Input
                id="add-contact-email"
                type="email"
                placeholder="jane@company.com"
                autoComplete="email"
                {...form.register("email")}
              />
              <FieldError>{form.formState.errors.email?.message}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="add-contact-phone">Phone</FieldLabel>
              <Controller
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <PhoneInput
                    id="add-contact-phone"
                    defaultCountry="US"
                    placeholder="Enter phone number"
                    value={field.value || undefined}
                    onChange={(v) => field.onChange(v ?? "")}
                    onBlur={field.onBlur}
                  />
                )}
              />
              <FieldError>{form.formState.errors.phone?.message}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="add-contact-title">Title</FieldLabel>
              <Input
                id="add-contact-title"
                type="text"
                placeholder="e.g. Marketing Manager"
                {...form.register("title")}
              />
              <FieldError>{form.formState.errors.title?.message}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="add-contact-company">Company</FieldLabel>
              <Controller
                control={form.control}
                name="companyId"
                render={({ field }) => (
                  <CompanySelect
                    id="add-contact-company"
                    value={field.value ?? null}
                    onChange={(id, companyName) => {
                      field.onChange(id);
                      form.setValue("companyName", id ? (companyName ?? "") : "");
                    }}
                    placeholder="Select company..."
                  />
                )}
              />
              <FieldError>{form.formState.errors.companyId?.message}</FieldError>
            </Field>

            <Field>
              <FieldLabel>Status</FieldLabel>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Status">
                    {(Object.keys(STATUS_BADGES) as StatusValue[]).map((value) => {
                      const config = STATUS_BADGES[value];
                      const Icon = config.icon;
                      const selected = (field.value ?? "LEAD") === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => field.onChange(value)}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors [&_svg]:size-3.5",
                            config.className,
                            selected
                              ? "ring-2 ring-offset-2 ring-offset-background ring-foreground/20"
                              : "opacity-80 hover:opacity-100"
                          )}
                        >
                          <HugeiconsIcon icon={Icon} strokeWidth={2} />
                          {config.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              />
              <FieldError>{form.formState.errors.status?.message}</FieldError>
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter showCloseButton={false} className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" form="add-contact-form" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <Spinner className="size-4" />
                Adding...
              </span>
            ) : (
              "Add contact"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
