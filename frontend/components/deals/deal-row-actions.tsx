"use client";

import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ViewIcon, Flag03Icon } from "@hugeicons/core-free-icons";
import type { DealListItem, DealStatus } from "@/services/deals";
import { useUpdateDeal } from "@/services/deals";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS: { value: DealStatus; label: string }[] = [
  { value: "OPEN", label: "Open" },
  { value: "WON", label: "Won" },
  { value: "LOST", label: "Lost" },
];

export function DealRowActions({ deal }: { deal: DealListItem }) {
  const updateDeal = useUpdateDeal();
  const [statusTarget, setStatusTarget] = useState<DealListItem | null>(null);
  const [newStatus, setNewStatus] = useState<DealStatus>(deal.status);

  useEffect(() => {
    if (statusTarget) setNewStatus(statusTarget.status);
  }, [statusTarget]);

  const handleStatusConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!statusTarget || newStatus === statusTarget.status) {
      setStatusTarget(null);
      return;
    }
    updateDeal.mutate(
      { id: statusTarget.id, body: { status: newStatus } },
      {
        onSuccess: () => {
          toast.success("Deal status updated.");
          setStatusTarget(null);
        },
        onError: (err) => toast.error(err.message ?? "Failed to update status."),
      }
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <span className="sr-only">Actions</span>
            <HugeiconsIcon icon={ViewIcon} className="size-4" strokeWidth={2} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-48" align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setStatusTarget(deal)}>
            <HugeiconsIcon icon={Flag03Icon} className="size-4 mr-2" strokeWidth={2} />
            Update status
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={!!statusTarget} onOpenChange={(o) => !o && setStatusTarget(null)}>
        <AlertDialogContent size="default" className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Update status</AlertDialogTitle>
            <AlertDialogDescription>
              Set status for <strong className="font-medium text-foreground">{statusTarget?.title?.trim() || "this deal"}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {statusTarget && (
            <div className="py-2">
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as DealStatus)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusConfirm}
              disabled={updateDeal.isPending || (statusTarget?.status === newStatus)}
            >
              {updateDeal.isPending ? "Updating..." : "Update status"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
