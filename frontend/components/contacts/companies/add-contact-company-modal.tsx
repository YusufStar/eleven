"use client";

import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller } from "react-hook-form";
import { addContactCompanySchema, type AddContactCompanySchema } from "@/lib/schema";
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
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UploadModal } from "@/components/ui/upload-modal";
import { HugeiconsIcon } from "@hugeicons/react";
import { Building01Icon } from "@hugeicons/core-free-icons";
import {
  SparklesIcon,
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

type StatusValue = NonNullable<AddContactCompanySchema["status"]>;

const STATUS_BADGES: Record<
  StatusValue,
  { label: string; icon: typeof SparklesIcon; className: string }
> = {
  LEAD: { label: "Lead", icon: SparklesIcon, className: "bg-amber-500/12 text-amber-700 dark:text-amber-400 border-amber-500/20 [&_svg]:text-amber-600 dark:[&_svg]:text-amber-400" },
  PROSPECT: { label: "Prospect", icon: ArrowRight01Icon, className: "bg-blue-500/12 text-blue-700 dark:text-blue-400 border-blue-500/20 [&_svg]:text-blue-600 dark:[&_svg]:text-blue-400" },
  CUSTOMER: { label: "Customer", icon: CheckmarkCircle01Icon, className: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 [&_svg]:text-emerald-600 dark:[&_svg]:text-emerald-400" },
  CHURNED: { label: "Churned", icon: Cancel01Icon, className: "bg-red-500/12 text-red-700 dark:text-red-400 border-red-500/20 [&_svg]:text-red-600 dark:[&_svg]:text-red-400" },
  PARTNER: { label: "Partner", icon: UserGroupIcon, className: "bg-violet-500/12 text-violet-700 dark:text-violet-400 border-violet-500/20 [&_svg]:text-violet-600 dark:[&_svg]:text-violet-400" },
};

export type AddContactCompanyModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const defaultValues: AddContactCompanySchema = {
  avatar: undefined,
  companyName: "",
  website: "",
  industry: "",
  employeeCount: undefined,
  status: "LEAD",
};

function emptyStrToUndefined<T>(v: T): T | undefined {
  if (typeof v === "string" && v.trim() === "") return undefined;
  return v;
}

export function AddContactCompanyModal({ open, onOpenChange }: AddContactCompanyModalProps) {
  const [openUploadModal, setOpenUploadModal] = useState(false);
  const createMutation = useCreateContactMutation();
  const form = useForm<AddContactCompanySchema>({
    resolver: zodResolver(addContactCompanySchema) as Resolver<AddContactCompanySchema>,
    defaultValues,
  });

  useEffect(() => {
    if (!open) form.reset(defaultValues);
  }, [open, form]);

  const onSubmit = async (data: AddContactCompanySchema) => {
    try {
      await createMutation.mutateAsync({
        type: "COMPANY",
        firstName: "",
        avatar: data.avatar ?? undefined,
        companyName: data.companyName.trim(),
        website: emptyStrToUndefined(data.website)?.trim() ?? undefined,
        industry: emptyStrToUndefined(data.industry)?.trim() ?? undefined,
        employeeCount: typeof data.employeeCount === "number" && Number.isInteger(data.employeeCount) ? data.employeeCount : undefined,
        status: data.status ?? "LEAD",
      });
      toast.success("Company added.");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add company.");
    }
  };

  const isSubmitting = createMutation.isPending;

  return (
    <>
      <UploadModal
        isAvatar
        open={openUploadModal}
        onOpenChange={setOpenUploadModal}
        title="Upload company logo"
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
            <DialogTitle>Add company</DialogTitle>
            <DialogDescription>Add a new company to your contact directory.</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} id="add-company-form">
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel>Company logo</FieldLabel>
                <Avatar
                  className="size-16! rounded-lg cursor-pointer mx-auto after:rounded-lg"
                  onClick={() => setOpenUploadModal(true)}
                >
                  <AvatarImage src={form.watch("avatar")} className="rounded-lg" />
                  <AvatarFallback className="rounded-lg">
                    <HugeiconsIcon icon={Building01Icon} className="size-8" strokeWidth={2} />
                  </AvatarFallback>
                </Avatar>
              </Field>
              <Field>
                <FieldLabel htmlFor="add-company-companyName">Company name</FieldLabel>
                <Input id="add-company-companyName" type="text" placeholder="Acme Inc." {...form.register("companyName")} />
                <FieldError>{form.formState.errors.companyName?.message}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="add-company-website">Website</FieldLabel>
                <Input id="add-company-website" type="url" placeholder="https://example.com" {...form.register("website")} />
                <FieldError>{form.formState.errors.website?.message}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="add-company-industry">Industry</FieldLabel>
                <Input id="add-company-industry" type="text" placeholder="e.g. Technology" {...form.register("industry")} />
                <FieldError>{form.formState.errors.industry?.message}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="add-company-employeeCount">Employee count</FieldLabel>
                <Input id="add-company-employeeCount" type="number" min={0} placeholder="0" {...form.register("employeeCount")} />
                <FieldError>{form.formState.errors.employeeCount?.message}</FieldError>
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
                              selected ? "ring-2 ring-offset-2 ring-offset-background ring-foreground/20" : "opacity-80 hover:opacity-100"
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" form="add-company-form" disabled={isSubmitting}>
              {isSubmitting ? <span className="inline-flex items-center gap-2"><Spinner className="size-4" />Adding...</span> : "Add company"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
