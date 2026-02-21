"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { useQueryClient } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

const inviteMemberSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
  role: z.enum(["member", "admin", "owner"]),
  resend: z.boolean().optional(),
});

type InviteMemberSchema = z.infer<typeof inviteMemberSchema>;

const ROLE_OPTIONS: { value: InviteMemberSchema["role"]; label: string }[] = [
  { value: "member", label: "Member" },
  { value: "admin", label: "Admin" },
  { value: "owner", label: "Owner" },
];

export type InviteMemberModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const defaultValues: InviteMemberSchema = {
  email: "",
  role: "member",
  resend: false,
};

export function InviteMemberModal({ open, onOpenChange }: InviteMemberModalProps) {
  const queryClient = useQueryClient();
  const form = useForm<InviteMemberSchema>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!open) form.reset(defaultValues);
  }, [open, form]);

  const onSubmit = async (data: InviteMemberSchema) => {
    const { data: result, error } = await authClient.organization.inviteMember({
      email: data.email.trim(),
      role: data.role,
      resend: data.resend ?? false,
    });
    if (error) {
      toast.error(error.message ?? "Failed to send invitation.");
      return;
    }
    toast.success("Invitation sent.");
    queryClient.invalidateQueries({ queryKey: ["organization", "invitations"] });
    onOpenChange(false);
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Invite member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your organization. They will receive an email with a link to accept.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} id="invite-member-form">
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="invite-email">Email</FieldLabel>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@company.com"
                autoComplete="email"
                {...form.register("email")}
              />
              <FieldError>{form.formState.errors.email?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="invite-role">Role</FieldLabel>
              <Select
                value={form.watch("role")}
                onValueChange={(v) => form.setValue("role", v as InviteMemberSchema["role"])}
              >
                <SelectTrigger id="invite-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError>{form.formState.errors.role?.message}</FieldError>
            </Field>
            <Field>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="invite-resend"
                  className="h-4 w-4 rounded border-input"
                  {...form.register("resend")}
                />
                <FieldLabel htmlFor="invite-resend" className="mb-0! font-normal cursor-pointer">
                  Resend if already invited
                </FieldLabel>
              </div>
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter showCloseButton={false} className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="invite-member-form" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <Spinner className="size-4" />
                Sending...
              </span>
            ) : (
              "Send invitation"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
