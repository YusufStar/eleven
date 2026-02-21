"use client";

import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ViewIcon, Delete02Icon, UserGroupIcon } from "@hugeicons/core-free-icons";
import type { TeamMember } from "@/services/team";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROLE_OPTIONS = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
] as const;

export function MemberRowActions({ member }: { member: TeamMember }) {
  const queryClient = useQueryClient();
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);
  const [roleTarget, setRoleTarget] = useState<TeamMember | null>(null);
  const [newRole, setNewRole] = useState<string>(member.role);
  const [removing, setRemoving] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);

  useEffect(() => {
    if (roleTarget) setNewRole(roleTarget.role);
  }, [roleTarget]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["team", "members"] });

  const handleRemoveConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!removeTarget) return;
    setRemoving(true);
    const { error } = await authClient.organization.removeMember({
      memberIdOrEmail: removeTarget.id,
    });
    setRemoving(false);
    if (error) {
      toast.error(error.message ?? "Failed to remove member.");
      return;
    }
    toast.success("Member removed from organization.");
    setRemoveTarget(null);
    invalidate();
  };

  const handleRoleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!roleTarget || newRole === roleTarget.role) {
      setRoleTarget(null);
      return;
    }
    setUpdatingRole(true);
    const { error } = await authClient.organization.updateMemberRole({
      memberId: roleTarget.id,
      role: newRole,
    });
    setUpdatingRole(false);
    if (error) {
      toast.error(error.message ?? "Failed to update role.");
      return;
    }
    toast.success("Role updated.");
    setRoleTarget(null);
    invalidate();
  };

  const summary = `${member.user?.name?.trim() ?? "—"}${member.user?.email ? ` (${member.user.email})` : ""}`;

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
          <DropdownMenuItem onClick={() => setRoleTarget(member)}>
            <HugeiconsIcon icon={UserGroupIcon} className="size-4 mr-2" strokeWidth={2} />
            Change role
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setRemoveTarget(member)}
          >
            <HugeiconsIcon icon={Delete02Icon} className="size-4 mr-2" strokeWidth={2} />
            Remove from organization
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent size="default" className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong className="font-medium text-foreground">{summary}</strong> from the organization. They will lose access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleRemoveConfirm} disabled={removing}>
              {removing ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!roleTarget} onOpenChange={(open) => !open && setRoleTarget(null)}>
        <AlertDialogContent size="default" className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Change role</AlertDialogTitle>
            <AlertDialogDescription>
              Set a new role for <strong className="font-medium text-foreground">{roleTarget ? `${roleTarget.user?.name?.trim() ?? "—"}` : ""}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {roleTarget && (
            <div className="py-2">
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((opt) => (
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
            <AlertDialogAction onClick={handleRoleConfirm} disabled={updatingRole || (roleTarget?.role === newRole)}>
              {updatingRole ? "Updating..." : "Update role"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
