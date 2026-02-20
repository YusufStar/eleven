"use client";

import { useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "LEAD", label: "Lead" },
  { value: "PROSPECT", label: "Prospect" },
  { value: "CUSTOMER", label: "Customer" },
  { value: "CHURNED", label: "Churned" },
  { value: "PARTNER", label: "Partner" },
];

export type AddContactPeopleModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const defaultValues: AddContactPersonSchema = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  title: "",
  companyName: "",
  status: "LEAD",
};

function emptyStrToUndefined<T>(v: T): T | undefined {
  if (typeof v === "string" && v.trim() === "") return undefined;
  return v;
}

export function AddContactPeopleModal({ open, onOpenChange }: AddContactPeopleModalProps) {
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
        firstName: data.firstName.trim(),
        lastName: emptyStrToUndefined(data.lastName)?.trim() ?? undefined,
        email: emptyStrToUndefined(data.email)?.trim() ?? undefined,
        phone: emptyStrToUndefined(data.phone)?.trim() ?? undefined,
        title: emptyStrToUndefined(data.title)?.trim() ?? undefined,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Add contact</DialogTitle>
          <DialogDescription>Add a new person to your contact directory.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} id="add-contact-form">
          <FieldGroup className="gap-4">
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
              <FieldLabel htmlFor="add-contact-companyName">Company</FieldLabel>
              <Input
                id="add-contact-companyName"
                type="text"
                placeholder="Acme Inc."
                {...form.register("companyName")}
              />
              <FieldError>{form.formState.errors.companyName?.message}</FieldError>
            </Field>

            <Field>
              <FieldLabel>Status</FieldLabel>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select
                    value={field.value ?? "LEAD"}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full" id="add-contact-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
  );
}
