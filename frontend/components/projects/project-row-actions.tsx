"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Task01Icon, UserIcon, Delete02Icon, File02Icon } from "@hugeicons/core-free-icons";
import type { Project } from "@/services/projects";
import { useDeleteProject } from "@/services/projects";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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

export type ProjectRowActionsProps = {
  project: Project;
};

export function ProjectRowActions({ project }: ProjectRowActionsProps) {
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const deleteMutation = useDeleteProject();

  const handleDeleteConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Project deleted.");
        setDeleteTarget(null);
      },
      onError: (err) => toast.error(err.message ?? "Failed to delete."),
    });
  };

  const summary = [
    project.name?.trim() && `Name: ${project.name.trim()}`,
    project.slug && `Slug: ${project.slug}`,
    project.description?.trim() && `Description: ${project.description.trim()}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <div className="flex items-center justify-end gap-1.5">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/tasks?projectId=${project.id}`}>
            <HugeiconsIcon icon={Task01Icon} className="size-4 mr-1.5" strokeWidth={2} />
            Tasks
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/files?projectId=${project.id}`}>
            <HugeiconsIcon icon={File02Icon} className="size-4 mr-1.5" strokeWidth={2} />
            Files
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => setDeleteTarget(project)}
        >
          <HugeiconsIcon icon={Delete02Icon} className="size-4 mr-1.5" strokeWidth={2} />
          Delete
        </Button>
      </div>
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent size="default" className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the project.
              {summary && (
                <span className="mt-2 block font-medium text-foreground">{summary}</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
