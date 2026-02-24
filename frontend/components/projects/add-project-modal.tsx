"use client";

import { useState } from "react";
import { useCreateProject } from "@/services/projects";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { OrgMemberMultiSelect } from "@/components/projects/org-member-multi-select";

export type AddProjectModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddProjectModal({ open, onOpenChange }: AddProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const createMutation = useCreateProject();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    createMutation.mutate(
      { name: trimmed, description: description.trim() || undefined, memberIds },
      {
        onSuccess: () => {
          toast.success("Project created.");
          setName("");
          setDescription("");
          setMemberIds([]);
          onOpenChange(false);
        },
        onError: (err) => toast.error(err.message ?? "Failed to create project."),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Create project</DialogTitle>
          <DialogDescription>Add a new project. You will be added as a member.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Project name"
                required
              />
              <FieldError />
            </Field>
            <Field>
              <FieldLabel>Description (optional)</FieldLabel>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description"
                rows={2}
                className="resize-none"
              />
            </Field>
            <Field>
              <FieldLabel>Members (optional)</FieldLabel>
              <OrgMemberMultiSelect
                value={memberIds}
                onChange={setMemberIds}
                placeholder="Select members to add to project..."
              />
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || createMutation.isPending}>
              {createMutation.isPending ? <Spinner className="size-4" /> : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
