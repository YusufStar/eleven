"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ViewIcon, Delete02Icon } from "@hugeicons/core-free-icons";
import type { Contact } from "@/services/contacts";
import { useDeleteContactMutation } from "@/services/contacts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function formatPersonName(c: Contact) {
  const first = (c.firstName ?? "").trim();
  const last = (c.lastName ?? "").trim();
  return last ? `${first} ${last}`.trim() : first || "—";
}

export type ContactRowActionsProps = {
  contact: Contact;
  type: "PERSON" | "COMPANY";
};

export function ContactRowActions({ contact, type }: ContactRowActionsProps) {
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
  const deleteMutation = useDeleteContactMutation();

  const handleDeleteConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success(type === "PERSON" ? "Contact deleted." : "Company deleted.");
        setDeleteTarget(null);
      },
      onError: (err) => {
        toast.error(err.message ?? "Failed to delete.");
      },
    });
  };

  const summary =
    type === "PERSON"
      ? `${formatPersonName(contact)}${contact.email ? ` (${contact.email})` : ""}`
      : `${contact.companyName?.trim() ?? "—"}${contact.website ? ` · ${contact.website}` : ""}`;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="h-8 w-8">
            <span className="sr-only">Menu</span>
            <HugeiconsIcon icon={ViewIcon} className="size-4" strokeWidth={2} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => {}}>
            <HugeiconsIcon icon={ViewIcon} className="size-4 mr-2" strokeWidth={2} />
            View
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setDeleteTarget(contact)}
          >
            <HugeiconsIcon icon={Delete02Icon} className="size-4 mr-2" strokeWidth={2} />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent size="default" className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {type === "PERSON" ? "contact" : "company"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove: <strong className="font-medium text-foreground">{summary}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDeleteConfirm} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
