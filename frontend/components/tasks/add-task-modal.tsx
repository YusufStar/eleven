"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addTaskSchema, type AddTaskSchema } from "@/lib/schema";
import { useCreateTask, useAddTaskAttachment, useSprints } from "@/services/tasks";
import { useUploadFileMutation } from "@/services/upload";
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
import { ProjectSelect } from "@/components/projects/project-select";
import { OrgMemberMultiSelect } from "@/components/projects/org-member-multi-select";
import { TaskSelect } from "@/components/tasks/task-select";
import { TaskDetailsEditor } from "@/components/tasks/task-details-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { TASK_STATUSES, type TaskStatusValue } from "@/services/tasks/types";
import { HugeiconsIcon } from "@hugeicons/react";
import { AttachmentIcon, Delete02Icon } from "@hugeicons/core-free-icons";
import { useDropzone } from "react-dropzone";

const defaultValues: AddTaskSchema = {
  title: "",
  description: "",
  detailsMarkdown: "",
  assigneeId: null,
  projectId: null,
  sprintId: null,
  parentTaskId: null,
  labels: [],
  estimate: null,
  status: "TODO",
  priority: "MEDIUM",
  dueAt: null,
};

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

export type AddTaskModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProjectId?: string | null;
};

type PendingAttachment = { file: File; fileUrl?: string; fileName: string; fileType?: string; fileSize?: number };

export function AddTaskModal({ open, onOpenChange, defaultProjectId }: AddTaskModalProps) {
  const createMutation = useCreateTask();
  const addAttachmentMutation = useAddTaskAttachment();
  const uploadFile = useUploadFileMutation();
  const { data: sprints } = useSprints();
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);

  const form = useForm<AddTaskSchema>({
    resolver: zodResolver(addTaskSchema),
    defaultValues: { ...defaultValues, projectId: defaultProjectId ?? null },
  });

  useEffect(() => {
    if (!open) {
      form.reset({ ...defaultValues, projectId: defaultProjectId ?? null });
      setPendingAttachments([]);
    }
  }, [open, form, defaultProjectId]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        try {
          const res = await uploadFile.mutateAsync(file);
          setPendingAttachments((prev) => [
            ...prev,
            { file, fileUrl: res.url, fileName: res.fileName, fileType: res.fileType, fileSize: res.fileSize },
          ]);
        } catch {
          toast.error(`Failed to upload ${file.name}`);
        }
      }
    },
    [uploadFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 20 * 1024 * 1024,
    disabled: uploadFile.isPending,
  });

  const removePending = (index: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: AddTaskSchema) => {
    try {
      const task = await createMutation.mutateAsync({
        title: data.title.trim(),
        description: data.description?.trim() || undefined,
        detailsMarkdown: data.detailsMarkdown?.trim() || undefined,
        assigneeId: data.assigneeId ?? undefined,
        projectId: data.projectId ?? undefined,
        sprintId: data.sprintId ?? undefined,
        parentTaskId: data.parentTaskId ?? undefined,
        labels: data.labels ?? undefined,
        estimate: data.estimate ?? undefined,
        status: data.status,
        priority: data.priority,
        dueAt: data.dueAt ?? undefined,
      });
      for (const att of pendingAttachments) {
        if (att.fileUrl)
          await addAttachmentMutation.mutateAsync({
            taskId: task.id,
            payload: {
              fileUrl: att.fileUrl,
              fileName: att.fileName,
              fileType: att.fileType ?? null,
              fileSize: att.fileSize ?? null,
            },
          });
      }
      toast.success("Task created.");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create task.");
    }
  };

  const isSubmitting = createMutation.isPending || addAttachmentMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl! max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0" showCloseButton>
        <DialogHeader className="shrink-0 border-b border-border/60 px-6 py-4">
          <DialogTitle>Create task</DialogTitle>
          <DialogDescription>Add a new task. Fill in the details below.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} id="add-task-form" className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="add-task-title">Title</FieldLabel>
                <Input
                  id="add-task-title"
                  placeholder="Task title"
                  {...form.register("title")}
                />
                <FieldError>{form.formState.errors.title?.message}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="add-task-description">Description (optional)</FieldLabel>
                <Textarea
                  id="add-task-description"
                  placeholder="Short description"
                  rows={2}
                  className="resize-none"
                  {...form.register("description")}
                />
                <FieldError>{form.formState.errors.description?.message}</FieldError>
              </Field>
              <Field>
                <FieldLabel>Task details (Markdown)</FieldLabel>
                <Controller
                  control={form.control}
                  name="detailsMarkdown"
                  render={({ field }) => (
                    <TaskDetailsEditor
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      minHeight="10rem"
                    />
                  )}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Status</FieldLabel>
                  <Controller
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <Select
                        value={field.value ?? "TODO"}
                        onValueChange={(v) => field.onChange(v as TaskStatusValue)}
                      >
                        <SelectTrigger id="add-task-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TASK_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s.replace("_", " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
                <Field>
                  <FieldLabel>Priority</FieldLabel>
                  <Controller
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <Select value={field.value ?? "MEDIUM"} onValueChange={field.onChange}>
                        <SelectTrigger id="add-task-priority">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORITY_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
              </div>
              <Controller
                control={form.control}
                name="dueAt"
                render={({ field }) => (
                  <DateTimePicker
                    id="add-task-dueAt"
                    label="Due date (optional)"
                    value={field.value ? new Date(field.value) : null}
                    onChange={(v) => field.onChange(v ? v.toISOString() : null)}
                    placeholder="Pick date and time"
                    error={form.formState.errors.dueAt?.message}
                  />
                )}
              />
              <Field>
                <FieldLabel>Assignee</FieldLabel>
                <Controller
                  control={form.control}
                  name="assigneeId"
                  render={({ field }) => (
                    <OrgMemberMultiSelect
                      value={field.value ? [field.value] : []}
                      onChange={(ids) => field.onChange(ids[0] ?? null)}
                      placeholder="Select assignee..."
                      includeCurrentUser
                      triggerDisplay="badges"
                    />
                  )}
                />
              </Field>
              <Field>
                <FieldLabel>Project</FieldLabel>
                <Controller
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <ProjectSelect
                      value={field.value ?? null}
                      onChange={(id) => field.onChange(id)}
                      placeholder="Select project..."
                    />
                  )}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Sprint</FieldLabel>
                  <Controller
                    control={form.control}
                    name="sprintId"
                    render={({ field }) => (
                      <Select
                        value={field.value ?? "none"}
                        onValueChange={(v) => field.onChange(v === "none" ? null : v)}
                      >
                        <SelectTrigger id="add-task-sprint">
                          <SelectValue placeholder="No sprint" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No sprint</SelectItem>
                          {(sprints ?? []).map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="add-task-estimate">Estimate (points)</FieldLabel>
                  <Controller
                    control={form.control}
                    name="estimate"
                    render={({ field }) => (
                      <Input
                        id="add-task-estimate"
                        type="number"
                        min={0}
                        placeholder="e.g. 3"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                      />
                    )}
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="add-task-labels">Labels (comma separated)</FieldLabel>
                <Controller
                  control={form.control}
                  name="labels"
                  render={({ field }) => (
                    <Input
                      id="add-task-labels"
                      placeholder="frontend, bug, design"
                      value={(field.value ?? []).join(", ")}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            .split(",")
                            .map((l) => l.trim())
                            .filter(Boolean)
                        )
                      }
                    />
                  )}
                />
              </Field>
              <Field>
                <FieldLabel>Parent task</FieldLabel>
                <Controller
                  control={form.control}
                  name="parentTaskId"
                  render={({ field }) => (
                    <TaskSelect
                      value={field.value ?? null}
                      onChange={(id) => field.onChange(id)}
                      projectId={form.watch("projectId") ?? undefined}
                      placeholder="None"
                    />
                  )}
                />
              </Field>
              <Field>
                <FieldLabel className="inline-flex items-center gap-2">
                  <HugeiconsIcon icon={AttachmentIcon} className="size-4" />
                  Attachments
                </FieldLabel>
                <div
                  {...getRootProps()}
                  className={`rounded-lg border border-dashed p-4 text-center text-sm transition-colors ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-muted-foreground/50"
                    }`}
                >
                  <input {...getInputProps()} />
                  {uploadFile.isPending ? "Uploading..." : "Drop files here or click to select"}
                </div>
                {pendingAttachments.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {pendingAttachments.map((att, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <span className="truncate flex-1">{att.fileName}</span>
                        <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => removePending(i)} aria-label="Remove">
                          <HugeiconsIcon icon={Delete02Icon} className="size-4 text-destructive" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </Field>
            </FieldGroup>
          </div>
          <DialogFooter className="shrink-0 border-t border-border/60 px-6! p-4 mb-0!">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" form="add-task-form" disabled={isSubmitting}>
              {isSubmitting ? <Spinner className="size-4" /> : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
