"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ViewIcon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { authClient } from "@/lib/auth-client";
import { useQueryClient } from "@tanstack/react-query";
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
import type { OrgInvitation } from "./columns";

export function InviteRowActions({ invitation }: { invitation: OrgInvitation }) {
  const queryClient = useQueryClient();
  const [cancelTarget, setCancelTarget] = useState<OrgInvitation | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["organization", "invitations"] });

  const handleCancelConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!cancelTarget) return;
    setCancelling(true);
    const { error } = await authClient.organization.cancelInvitation({
      invitationId: cancelTarget.id,
    });
    setCancelling(false);
    if (error) {
      toast.error(error.message ?? "Failed to cancel invitation.");
      return;
    }
    toast.success("Invitation cancelled.");
    setCancelTarget(null);
    invalidate();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="h-8 w-8">
            <span className="sr-only">Menu</span>
            <HugeiconsIcon icon={ViewIcon} className="size-4" strokeWidth={2} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-56" align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setCancelTarget(invitation)}
          >
            <HugeiconsIcon icon={Cancel01Icon} className="size-4 mr-2" strokeWidth={2} />
            Cancel invitation
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
      >
        <AlertDialogContent size="default" className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the invitation for{" "}
              <strong className="font-medium text-foreground">{cancelTarget?.email}</strong>.
              They will not be able to join using this link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleCancelConfirm}
              disabled={cancelling}
            >
              {cancelling ? "Cancelling..." : "Cancel invitation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
