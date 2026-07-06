"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCreateProject, useUpdateProject, type Project } from "@/services/projects";
import { useSettingsGithubRepos } from "@/services/settings/use-settings-github";
import { addProjectSchema, type AddProjectSchema } from "@/lib/schema";
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
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrgMemberMultiSelect } from "@/components/projects/org-member-multi-select";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, LinkSquare01Icon, MoveIcon, Github01Icon } from "@hugeicons/core-free-icons";
import type { GithubRepoItem } from "@/services/settings/api";

export type AddProjectModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the modal edits this project instead of creating a new one. */
  project?: Project | null;
};

const defaultValues: AddProjectSchema = {
  name: "",
  description: "",
  memberIds: [],
  links: [],
};

function SortableLinkRow({
  link,
  index,
  onUpdate,
  onRemove,
}: {
  link: { title: string; url: string };
  index: number;
  onUpdate: (title: string, url: string) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: index,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-md border bg-muted/30 p-2 ${isDragging ? "opacity-50" : ""}`}
    >
      <button type="button" className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground" {...attributes} {...listeners} aria-label="Drag to reorder">
        <HugeiconsIcon icon={MoveIcon} className="size-4" />
      </button>
      <Input
        placeholder="Key (e.g. Figma)"
        value={link.title}
        onChange={(e) => onUpdate(e.target.value, link.url)}
        className="flex-1 min-w-0"
      />
      <Input
        placeholder="URL"
        value={link.url}
        onChange={(e) => onUpdate(link.title, e.target.value)}
        className="flex-1 min-w-0"
      />
      <IconButton type="button" variant="ghost" className="shrink-0" onClick={onRemove} label="Remove link">
        <HugeiconsIcon icon={Delete02Icon} className="size-4 text-destructive" />
      </IconButton>
    </div>
  );
}

export function AddProjectModal({ open, onOpenChange, project }: AddProjectModalProps) {
  const isEdit = !!project;
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject(project?.id ?? "");
  const pending = isEdit ? updateMutation.isPending : createMutation.isPending;
  const { data: reposData } = useSettingsGithubRepos();
  const [selectedRepo, setSelectedRepo] = useState<GithubRepoItem | null>(null);
  const form = useForm<AddProjectSchema>({
    resolver: zodResolver(addProjectSchema),
    defaultValues,
  });
  const { fields: linkFields, append, remove, move } = useFieldArray({ control: form.control, name: "links" });
  const repos = reposData?.repos ?? [];

  useEffect(() => {
    if (!open) {
      form.reset(defaultValues);
      setSelectedRepo(null);
      return;
    }
    if (project) {
      form.reset({
        name: project.name,
        description: project.description ?? "",
        memberIds: [],
        links: project.links ?? [],
      });
      setSelectedRepo(
        project.githubRepoFullName && project.githubRepoUrl
          ? { id: -1, name: project.githubRepoFullName, fullName: project.githubRepoFullName, htmlUrl: project.githubRepoUrl }
          : null
      );
    }
  }, [open, project, form]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && typeof active.id === "number" && typeof over.id === "number") {
      move(active.id, over.id);
    }
  };

  const onSubmit = (data: AddProjectSchema) => {
    const validLinks = data.links?.filter((l) => l.title.trim() && l.url.trim()).map((l) => ({ title: l.title.trim(), url: l.url.trim() })) ?? [];
    if (isEdit) {
      updateMutation.mutate(
        {
          name: data.name.trim(),
          description: data.description?.trim() || "",
          links: validLinks,
          githubRepoFullName: selectedRepo?.fullName ?? null,
          githubRepoUrl: selectedRepo?.htmlUrl ?? null,
        },
        {
          onSuccess: () => {
            toast.success("Project updated.");
            onOpenChange(false);
          },
          onError: (err) => toast.error(err.message ?? "Failed to update project."),
        }
      );
      return;
    }
    createMutation.mutate(
      {
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
        memberIds: data.memberIds?.length ? data.memberIds : undefined,
        links: validLinks.length ? validLinks : undefined,
        githubRepoFullName: selectedRepo?.fullName,
        githubRepoUrl: selectedRepo?.htmlUrl,
      },
      {
        onSuccess: () => {
          toast.success("Project created.");
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
          <DialogTitle>{isEdit ? "Edit project" : "Create project"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update project details. Manage members from the project page." : "Add a new project. You will be added as a member."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} id="add-project-form">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="add-project-name">Name</FieldLabel>
              <Input
                id="add-project-name"
                placeholder="Project name"
                {...form.register("name")}
              />
              <FieldError>{form.formState.errors.name?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="add-project-description">Description (optional)</FieldLabel>
              <Textarea
                id="add-project-description"
                placeholder="Brief description"
                rows={2}
                className="resize-none"
                {...form.register("description")}
              />
              <FieldError>{form.formState.errors.description?.message}</FieldError>
            </Field>
            {!isEdit && (
              <Field>
                <FieldLabel>Members (optional)</FieldLabel>
                <Controller
                  control={form.control}
                  name="memberIds"
                  render={({ field }) => (
                    <OrgMemberMultiSelect
                      value={field.value ?? []}
                      onChange={field.onChange}
                      placeholder="Select members to add to project..."
                    />
                  )}
                />
              </Field>
            )}
            <Field>
              <FieldLabel className="inline-flex items-center gap-2">
                <HugeiconsIcon icon={Github01Icon} className="size-4" />
                GitHub repository (optional)
              </FieldLabel>
              {repos.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Connect GitHub in Organization settings to link a repository.
                </p>
              ) : (
                <Select
                  value={selectedRepo?.htmlUrl ?? "__none__"}
                  onValueChange={(value) => {
                    if (value === "__none__") setSelectedRepo(null);
                    else setSelectedRepo(repos.find((r) => r.htmlUrl === value) ?? null);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {repos.map((r) => (
                      <SelectItem key={r.id} value={r.htmlUrl}>
                        {r.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </Field>
            <Field>
              <FieldLabel className="inline-flex items-center gap-2">
                <HugeiconsIcon icon={LinkSquare01Icon} className="size-4" />
                Links (optional)
              </FieldLabel>
              <p className="text-xs text-muted-foreground mb-2">Add links (e.g. Figma, Github). Drag to reorder.</p>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={linkFields.map((_, i) => i)} strategy={verticalListSortingStrategy}>
                  <div className="flex flex-col gap-2">
                    {linkFields.map((field, i) => (
                      <SortableLinkRow
                        key={field.id}
                        link={form.watch(`links.${i}`) ?? { title: "", url: "" }}
                        index={i}
                        onUpdate={(title, url) => {
                          form.setValue(`links.${i}.title`, title);
                          form.setValue(`links.${i}.url`, url);
                        }}
                        onRemove={() => remove(i)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => append({ title: "", url: "" })}
              >
                Add link
              </Button>
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" form="add-project-form" disabled={pending}>
              {pending ? <Spinner className="size-4" /> : isEdit ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
