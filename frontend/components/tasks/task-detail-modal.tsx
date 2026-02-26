"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Task01Icon,
  NoteIcon,
  Flag03Icon,
  Calendar03Icon,
  UserIcon,
  Folder01Icon,
  UserCircleIcon,
  LinkSquare01Icon,
  HierarchyIcon,
  AttachmentIcon,
} from "@hugeicons/core-free-icons";
import { useTaskDetail } from "@/services/tasks";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

function formatDate(s: string | null | undefined): string {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

function DetailRow({
  icon: Icon,
  label,
  children,
  className,
}: {
  icon: typeof Task01Icon;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-3 py-2", className)}>
      <HugeiconsIcon icon={Icon} className="mt-0.5 size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className="mt-0.5 text-sm text-foreground">{children}</div>
      </div>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-border/60 pb-6 last:border-0 last:pb-0">
      <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  );
}

export interface TaskDetailModalProps {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailModal({ taskId, open, onOpenChange }: TaskDetailModalProps) {
  const { data: task, isPending } = useTaskDetail(open && taskId ? taskId : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] max-w-4xl! overflow-hidden flex flex-col p-0 gap-0"
        showCloseButton
      >
        <DialogHeader className="shrink-0 border-b border-border/60 px-6 py-4">
          <DialogTitle className="text-lg font-semibold pr-8">
            {task ? task.title?.trim() || "Untitled task" : "Task details"}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isPending ? (
            <div className="space-y-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : task ? (
            <div className="space-y-6">
              <DetailSection title="Overview">
                <DetailRow icon={Task01Icon} label="Title">
                  <span className="font-medium">{task.title?.trim() || "—"}</span>
                </DetailRow>
                <DetailRow icon={NoteIcon} label="Description">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {task.description?.trim() || "No description."}
                  </p>
                </DetailRow>
                <div className="grid grid-cols-2 gap-x-6">
                  <DetailRow icon={Flag03Icon} label="Status">
                    <TaskStatusBadge status={task.status} />
                  </DetailRow>
                  <DetailRow icon={Flag03Icon} label="Priority">
                    <span className="text-sm">
                      {PRIORITY_LABELS[task.priority] ?? task.priority}
                    </span>
                  </DetailRow>
                </div>
                <div className="grid grid-cols-2 gap-x-6">
                  <DetailRow icon={Calendar03Icon} label="Due date">
                    {formatDate(task.dueAt)}
                  </DetailRow>
                  <DetailRow icon={Calendar03Icon} label="Completed at">
                    {formatDate(task.completedAt)}
                  </DetailRow>
                </div>
              </DetailSection>

              <DetailSection title="People & context">
                <DetailRow icon={UserIcon} label="Assignee">
                  {task.assignee?.user?.name ? (
                    <span>{task.assignee.user.name}</span>
                  ) : (
                    <span className="text-muted-foreground">Unassigned</span>
                  )}
                </DetailRow>
                <DetailRow icon={UserCircleIcon} label="Created by">
                  {task.creator?.user?.name ?? "—"}
                </DetailRow>
                <DetailRow icon={Folder01Icon} label="Project">
                  {task.project?.name ? (
                    <span>{task.project.name}</span>
                  ) : (
                    <span className="text-muted-foreground">No project</span>
                  )}
                </DetailRow>
              </DetailSection>

              {(task.contact || task.deal) && (
                <DetailSection title="Related">
                  {task.contact && (
                    <DetailRow icon={UserIcon} label="Contact">
                      <span>
                        {[task.contact.firstName, task.contact.lastName].filter(Boolean).join(" ")}
                        {task.contact.companyName ? ` · ${task.contact.companyName}` : ""}
                      </span>
                      {task.contact.email && (
                        <p className="mt-1 text-xs text-muted-foreground">{task.contact.email}</p>
                      )}
                    </DetailRow>
                  )}
                  {task.deal && (
                    <DetailRow icon={LinkSquare01Icon} label="Deal">
                      <span>{task.deal.title}</span>
                      {task.deal.value != null && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {String(task.deal.value)} {task.deal.currency}
                        </p>
                      )}
                    </DetailRow>
                  )}
                </DetailSection>
              )}

              {(task.parentTask || (task.subTasks && task.subTasks.length > 0)) && (
                <DetailSection title="Hierarchy">
                  {task.parentTask && (
                    <DetailRow icon={HierarchyIcon} label="Parent task">
                      <span className="text-sm">{task.parentTask.title}</span>
                      <TaskStatusBadge status={task.parentTask.status} className="ml-2" />
                    </DetailRow>
                  )}
                  {task.subTasks && task.subTasks.length > 0 && (
                    <DetailRow icon={HierarchyIcon} label="Sub-tasks">
                      <ul className="list-inside list-disc space-y-1 text-sm">
                        {task.subTasks.map((st) => (
                          <li key={st.id}>
                            <span>{st.title}</span>
                            <TaskStatusBadge status={st.status} className="ml-2" />
                          </li>
                        ))}
                      </ul>
                    </DetailRow>
                  )}
                </DetailSection>
              )}

              {task.attachments && task.attachments.length > 0 && (
                <DetailSection title="Attachments">
                  <DetailRow icon={AttachmentIcon} label="Files">
                    <ul className="space-y-1">
                      {task.attachments.map((a) => (
                        <li key={a.id}>
                          <a
                            href={a.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary underline underline-offset-2 hover:no-underline"
                          >
                            {a.fileName}
                          </a>
                          {a.fileSize != null && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({(a.fileSize / 1024).toFixed(1)} KB)
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </DetailRow>
                </DetailSection>
              )}

              <DetailSection title="Timestamps">
                <div className="grid grid-cols-2 gap-x-6">
                  <DetailRow icon={Calendar03Icon} label="Created">
                    {formatDate(task.createdAt)}
                  </DetailRow>
                  <DetailRow icon={Calendar03Icon} label="Last updated">
                    {formatDate(task.updatedAt)}
                  </DetailRow>
                </div>
              </DetailSection>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
