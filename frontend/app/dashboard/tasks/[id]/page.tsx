"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02Icon,
  AttachmentIcon,
  Calendar03Icon,
  CheckmarkCircle01Icon,
  Delete02Icon,
  Edit02Icon,
  Folder01Icon,
  HierarchyIcon,
  Link01Icon,
  LinkSquare01Icon,
  Upload01Icon,
  UserIcon,
  EyeIcon,
  Clock01Icon,
  Comment01Icon,
  ArrowRight02Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { MarkdownView } from "@/components/ui/markdown-view";
import { TaskDetailsEditor } from "@/components/tasks/task-details-editor";
import { StatusBadge } from "@/components/ui/status-badge";
import { authClient } from "@/lib/auth-client";
import { useTeamMembersList } from "@/services/team";
import { useUploadFileMutation } from "@/services/upload";
import {
  TASK_STATUSES,
  useAddTaskAttachment,
  useAddTaskComment,
  useAddTaskDependency,
  useDeleteTaskAttachment,
  useDeleteTaskComment,
  useLogTaskTime,
  useRemoveTaskDependency,
  useSprints,
  useTaskDetail,
  useToggleTaskWatch,
  useUpdateTask,
  type TaskAttachment,
  type TaskDetail,
} from "@/services/tasks";
import { useActivitiesList } from "@/services/activities";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useMentionAutocomplete, MentionSuggestions } from "@/components/mentions/mention-autocomplete";
import { TaskSelect } from "@/components/tasks/task-select";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
const STATUS_LABELS: Record<string, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  IN_REVIEW: "In review",
  BLOCKED: "Blocked",
  DONE: "Done",
  CANCELLED: "Archived",
};

function attachmentKind(a: TaskAttachment): "image" | "video" | "link" | "file" {
  if (a.fileType === "link") return "link";
  if (a.fileType?.startsWith("image/")) return "image";
  if (a.fileType?.startsWith("video/")) return "video";
  return "file";
}

function fmtSize(bytes: number | null) {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

function fmtDate(s: string | null | undefined) {
  if (!s) return "—";
  return new Date(s).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function PropertyRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="shrink-0 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="min-w-0 text-right text-sm">{children}</div>
    </div>
  );
}

function AttachmentsCard({ taskId, attachments }: { taskId: string; attachments: TaskAttachment[] }) {
  const upload = useUploadFileMutation();
  const addAttachment = useAddTaskAttachment();
  const deleteAttachment = useDeleteTaskAttachment();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [linkFormOpen, setLinkFormOpen] = React.useState(false);
  const [linkUrl, setLinkUrl] = React.useState("");
  const [linkLabel, setLinkLabel] = React.useState("");

  const busy = upload.isPending || addAttachment.isPending;

  const onFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Files up to 50 MB are supported.");
      return;
    }
    try {
      const uploaded = await upload.mutateAsync(file);
      await addAttachment.mutateAsync({
        taskId,
        payload: {
          fileUrl: uploaded.url,
          fileName: uploaded.fileName || file.name,
          fileType: uploaded.fileType || file.type || null,
          fileSize: uploaded.fileSize ?? file.size,
        },
      });
      toast.success("Attachment added.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const addLink = async () => {
    const url = linkUrl.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      toast.error("Links must start with http(s)://");
      return;
    }
    try {
      await addAttachment.mutateAsync({
        taskId,
        payload: { fileUrl: url, fileName: linkLabel.trim() || url, fileType: "link" },
      });
      setLinkUrl("");
      setLinkLabel("");
      setLinkFormOpen(false);
      toast.success("Link added.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add the link");
    }
  };

  const remove = (attachmentId: string) => {
    deleteAttachment.mutate(
      { taskId, attachmentId },
      {
        onSuccess: () => toast.success("Attachment removed."),
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const images = attachments.filter((a) => attachmentKind(a) === "image");
  const videos = attachments.filter((a) => attachmentKind(a) === "video");
  const others = attachments.filter((a) => ["file", "link"].includes(attachmentKind(a)));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <HugeiconsIcon icon={AttachmentIcon} className="size-4 text-muted-foreground" strokeWidth={2} />
          Attachments {attachments.length > 0 && `(${attachments.length})`}
        </CardTitle>
        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" className="hidden" onChange={onFilePicked} />
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
          >
            {busy ? <Spinner className="size-3.5" /> : <HugeiconsIcon icon={Upload01Icon} className="size-3.5" strokeWidth={2} />}
            Upload
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setLinkFormOpen((v) => !v)}>
            <HugeiconsIcon icon={Link01Icon} className="size-3.5" strokeWidth={2} />
            Add link
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {linkFormOpen && (
          <div className="flex flex-wrap items-end gap-2 rounded-lg border p-3">
            <div className="min-w-48 flex-1 space-y-1">
              <Label htmlFor="att-url" className="text-xs">URL</Label>
              <Input id="att-url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://…" />
            </div>
            <div className="min-w-40 flex-1 space-y-1">
              <Label htmlFor="att-label" className="text-xs">Label (optional)</Label>
              <Input id="att-label" value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} placeholder="Design doc" />
            </div>
            <Button size="sm" onClick={addLink} disabled={!linkUrl.trim() || addAttachment.isPending}>
              Add
            </Button>
          </div>
        )}

        {attachments.length === 0 && !linkFormOpen && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No attachments yet — upload images, videos, documents, or add links.
          </p>
        )}

        {images.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((a) => (
              <figure key={a.id} className="group relative overflow-hidden rounded-lg border">
                <a href={a.fileUrl} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.fileUrl} alt={a.fileName} className="aspect-video w-full object-cover" />
                </a>
                <figcaption className="truncate px-2 py-1.5 text-xs text-muted-foreground">{a.fileName}</figcaption>
                <button
                  type="button"
                  onClick={() => remove(a.id)}
                  aria-label={`Remove ${a.fileName}`}
                  className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <HugeiconsIcon icon={Delete02Icon} className="size-3.5" strokeWidth={2} />
                </button>
              </figure>
            ))}
          </div>
        )}

        {videos.map((a) => (
          <div key={a.id} className="group relative">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video controls preload="metadata" src={a.fileUrl} className="aspect-video w-full rounded-lg border bg-black" />
            <div className="mt-1 flex items-center justify-between">
              <p className="truncate text-xs text-muted-foreground">
                {a.fileName} {fmtSize(a.fileSize) && `· ${fmtSize(a.fileSize)}`}
              </p>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => remove(a.id)}>
                Remove
              </Button>
            </div>
          </div>
        ))}

        {others.length > 0 && (
          <ul className="divide-y rounded-lg border">
            {others.map((a) => {
              const isLink = attachmentKind(a) === "link";
              return (
                <li key={a.id} className="flex items-center gap-3 px-3 py-2.5">
                  <HugeiconsIcon
                    icon={isLink ? Link01Icon : AttachmentIcon}
                    className="size-4 shrink-0 text-muted-foreground"
                    strokeWidth={2}
                  />
                  <a
                    href={a.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 flex-1 truncate text-sm underline-offset-2 hover:underline"
                  >
                    {a.fileName}
                  </a>
                  {!isLink && fmtSize(a.fileSize) && (
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">{fmtSize(a.fileSize)}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(a.id)}
                    aria-label={`Remove ${a.fileName}`}
                    className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <HugeiconsIcon icon={Delete02Icon} className="size-3.5" strokeWidth={2} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}


function initials(name: string): string {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function relTime(dateStr: string): string {
  const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function fmtMinutes(total: number): string {
  if (!total) return "0m";
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

function CommentsCard({ task, myMemberId }: { task: TaskDetail; myMemberId: string | null }) {
  const addComment = useAddTaskComment();
  const deleteComment = useDeleteTaskComment();
  const [draft, setDraft] = React.useState("");
  const comments = task.comments ?? [];
  const mentions = useMentionAutocomplete();
  const draftRef = React.useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const body = draft.trim();
    if (!body) return;
    const mentionMemberIds = mentions.resolve(body).map((m) => m.memberId);
    addComment.mutate(
      { taskId: task.id, body, mentionMemberIds: mentionMemberIds.length > 0 ? mentionMemberIds : undefined },
      {
        onSuccess: () => {
          setDraft("");
          mentions.reset();
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <HugeiconsIcon icon={Comment01Icon} className="size-4 text-muted-foreground" strokeWidth={2} />
          Comments {comments.length > 0 && `(${comments.length})`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground">No comments yet — start the discussion.</p>
        )}
        <ul className="space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              <Avatar className="size-7 shrink-0">
                <AvatarImage src={c.author?.user.image ?? undefined} alt={c.author?.user.name ?? ""} />
                <AvatarFallback className="text-[10px]">{initials(c.author?.user.name ?? "?")}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{c.author?.user.name ?? "Unknown"}</span>
                  <span className="text-xs text-muted-foreground">{relTime(c.createdAt)}</span>
                  {c.authorId === myMemberId && (
                    <button
                      type="button"
                      className="ml-auto text-xs text-muted-foreground transition-colors hover:text-destructive"
                      onClick={() =>
                        deleteComment.mutate(
                          { taskId: task.id, commentId: c.id },
                          { onError: (e) => toast.error(e.message) },
                        )
                      }
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="space-y-2">
          <div className="relative">
            <div className="absolute bottom-full left-0 mb-1">
              <MentionSuggestions
                candidates={mentions.candidates}
                onPick={(m) => {
                  const el = draftRef.current;
                  const caret = el?.selectionStart ?? draft.length;
                  const next = mentions.insert(draft, caret, m);
                  setDraft(next.text);
                  el?.focus();
                }}
              />
            </div>
            <Textarea
              ref={draftRef}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                mentions.detect(e.target.value, e.target.selectionStart ?? e.target.value.length);
              }}
              placeholder="Write a comment…  use @ to mention"
              rows={3}
              className="resize-none"
              onKeyDown={(e) => {
                if (mentions.open && mentions.candidates.length > 0 && (e.key === "Tab" || e.key === "Enter")) {
                  e.preventDefault();
                  const el = draftRef.current;
                  const caret = el?.selectionStart ?? draft.length;
                  const next = mentions.insert(draft, caret, mentions.candidates[0]);
                  setDraft(next.text);
                  return;
                }
                if (e.key === "Escape" && mentions.open) {
                  mentions.close();
                  return;
                }
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
              }}
            />
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={submit} disabled={!draft.trim() || addComment.isPending}>
              {addComment.isPending ? <Spinner className="size-3.5" /> : "Comment"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DependenciesCard({ task }: { task: TaskDetail }) {
  const addDep = useAddTaskDependency();
  const removeDep = useRemoveTaskDependency();
  const dependsOn = task.dependsOn ?? [];
  const dependedOnBy = task.dependedOnBy ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <HugeiconsIcon icon={ArrowRight02Icon} className="size-4 text-muted-foreground" strokeWidth={2} />
          Dependencies
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Blocked by</p>
          {dependsOn.length === 0 && <p className="text-xs text-muted-foreground">No blocking tasks.</p>}
          {dependsOn.map((d) => (
            <div key={d.id} className="flex items-center gap-2">
              <Link href={`/dashboard/tasks/${d.dependsOnId}`} className="min-w-0 flex-1 truncate underline-offset-2 hover:underline">
                {d.dependsOn?.title ?? d.dependsOnId}
              </Link>
              {d.dependsOn && <StatusBadge domain="task" value={d.dependsOn.status} size="sm" noTooltip />}
              <button
                type="button"
                aria-label="Remove dependency"
                className="text-muted-foreground transition-colors hover:text-destructive"
                onClick={() =>
                  removeDep.mutate({ taskId: task.id, depId: d.id }, { onError: (e) => toast.error(e.message) })
                }
              >
                <HugeiconsIcon icon={Delete02Icon} className="size-3.5" strokeWidth={2} />
              </button>
            </div>
          ))}
          <TaskSelect
            value={null}
            onChange={(id) => {
              if (id)
                addDep.mutate(
                  { taskId: task.id, dependsOnId: id },
                  { onError: (e) => toast.error(e.message) },
                );
            }}
            excludeTaskId={task.id}
            placeholder="Add blocking task…"
          />
        </div>
        {dependedOnBy.length > 0 && (
          <div className="space-y-1.5 border-t pt-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Blocks</p>
            {dependedOnBy.map((d) => (
              <div key={d.id} className="flex items-center gap-2">
                <Link href={`/dashboard/tasks/${d.taskId}`} className="min-w-0 flex-1 truncate underline-offset-2 hover:underline">
                  {d.task?.title ?? d.taskId}
                </Link>
                {d.task && <StatusBadge domain="task" value={d.task.status} size="sm" noTooltip />}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TimeTrackingCard({ task }: { task: TaskDetail }) {
  const logTime = useLogTaskTime();
  const [minutes, setMinutes] = React.useState("");
  const [note, setNote] = React.useState("");
  const entries = task.timeEntries ?? [];

  const submit = () => {
    const m = Number(minutes);
    if (!Number.isFinite(m) || m <= 0) {
      toast.error("Enter minutes to log.");
      return;
    }
    logTime.mutate(
      { taskId: task.id, minutes: Math.round(m), note: note.trim() || null },
      {
        onSuccess: () => {
          setMinutes("");
          setNote("");
          toast.success("Time logged.");
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <HugeiconsIcon icon={Clock01Icon} className="size-4 text-muted-foreground" strokeWidth={2} />
          Time tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Logged</span>
          <span className="font-medium tabular-nums">{fmtMinutes(task.timeSpentMinutes)}</span>
        </div>
        {task.estimate != null && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Estimate</span>
            <span className="font-medium tabular-nums">{task.estimate} pts</span>
          </div>
        )}
        <div className="flex gap-2">
          <Input
            type="number"
            min={1}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            placeholder="Minutes"
            className="w-24"
          />
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" />
          <Button size="sm" onClick={submit} disabled={logTime.isPending}>
            Log
          </Button>
        </div>
        {entries.length > 0 && (
          <ul className="space-y-1 border-t pt-2">
            {entries.slice(0, 4).map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="truncate">
                  {e.member?.user.name ?? "Someone"}
                  {e.note ? ` — ${e.note}` : ""}
                </span>
                <span className="shrink-0 tabular-nums">{fmtMinutes(e.minutes)}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function TimelineCard({ taskId }: { taskId: string }) {
  const { data } = useActivitiesList(
    { entityId: taskId, pageSize: 20 },
    { refetchInterval: false },
  );
  const items = data?.data ?? [];
  if (items.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2.5">
          {items.map((a) => (
            <li key={a.id} className="flex items-center gap-2 text-sm">
              <Avatar className="size-5 shrink-0">
                <AvatarImage src={a.member.user.image ?? undefined} alt={a.member.user.name} />
                <AvatarFallback className="text-[9px]">{initials(a.member.user.name)}</AvatarFallback>
              </Avatar>
              <span className="min-w-0 truncate">
                <span className="font-medium">{a.member.user.name}</span>{" "}
                <span className="text-muted-foreground">{a.action.toLowerCase()}d</span>
              </span>
              <span className="ml-auto shrink-0 text-xs text-muted-foreground">{relTime(a.createdAt)}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const taskId = params.id;
  const { data: task, isPending } = useTaskDetail(taskId);
  const updateTask = useUpdateTask();
  const toggleWatch = useToggleTaskWatch();
  const { data: sprints } = useSprints();
  const { data: session } = authClient.useSession();
  const { data: teamData } = useTeamMembersList({ pageSize: 200 });
  const [labelsDraft, setLabelsDraft] = React.useState<string | null>(null);

  const [editingDetails, setEditingDetails] = React.useState(false);
  const [detailsDraft, setDetailsDraft] = React.useState("");

  React.useEffect(() => {
    setDetailsDraft(task?.detailsMarkdown ?? "");
  }, [task?.detailsMarkdown]);

  const myMember = React.useMemo(() => {
    const uid = session?.user?.id;
    return uid ? (teamData?.data ?? []).find((m) => m.userId === uid) ?? null : null;
  }, [teamData?.data, session?.user?.id]);
  const canEditDueDate = !!task && !!myMember && (task.creatorId === myMember.id || myMember.role === "owner");

  const patch = (payload: Parameters<typeof updateTask.mutate>[0]["payload"], okMsg: string) => {
    updateTask.mutate(
      { taskId, payload },
      { onSuccess: () => toast.success(okMsg), onError: (e) => toast.error(e.message) },
    );
  };

  if (isPending) {
    return (
      <div className="container mx-auto max-w-5xl space-y-6 py-6">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto flex min-h-[50vh] max-w-5xl flex-col items-center justify-center gap-4 py-6">
        <p className="text-sm text-muted-foreground">This task doesn&apos;t exist or was deleted.</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/tasks">Back to tasks</Link>
        </Button>
      </div>
    );
  }

  const done = task.status === "DONE";

  return (
    <div className="container mx-auto max-w-6xl py-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/dashboard/tasks"
            className="mb-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <HugeiconsIcon icon={ArrowLeft02Icon} className="size-3.5" strokeWidth={2} />
            Tasks
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{task.title?.trim() || "Untitled task"}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge domain="task" value={task.status} />
            <StatusBadge domain="priority" value={task.priority} />
            {task.sprint && (
              <Badge variant="outline" className="text-xs">{task.sprint.name}</Badge>
            )}
            {task.labels.map((l) => (
              <Badge key={l} variant="secondary" className="text-xs">{l}</Badge>
            ))}
            {task.project && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <HugeiconsIcon icon={Folder01Icon} className="size-3.5" strokeWidth={2} />
                {task.project.name}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={toggleWatch.isPending}
            onClick={() =>
              toggleWatch.mutate(taskId, {
                onSuccess: (r) => toast.success(r.watching ? "You are watching this task." : "Stopped watching."),
                onError: (e) => toast.error(e.message),
              })
            }
          >
            <HugeiconsIcon icon={EyeIcon} className="size-4" strokeWidth={2} />
            {(task.watchers ?? []).some((w) => w.memberId === myMember?.id) ? "Unwatch" : "Watch"}
          </Button>
          <Button
            size="sm"
            variant={done ? "outline" : "default"}
            className="gap-1.5"
            disabled={updateTask.isPending}
            onClick={() => patch({ status: done ? "IN_PROGRESS" : "DONE" }, done ? "Task reopened." : "Task completed.")}
          >
            <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-4" strokeWidth={2} />
            {done ? "Reopen" : "Complete"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* main column */}
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {task.description?.trim() || "No description."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-semibold">Details</CardTitle>
              {!editingDetails && (
                <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setEditingDetails(true)}>
                  <HugeiconsIcon icon={Edit02Icon} className="size-3.5" strokeWidth={2} />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {editingDetails ? (
                <div className="space-y-3">
                  <TaskDetailsEditor value={detailsDraft} onChange={setDetailsDraft} minHeight="16rem" />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={updateTask.isPending}
                      onClick={() => {
                        patch({ detailsMarkdown: detailsDraft || null }, "Details saved.");
                        setEditingDetails(false);
                      }}
                    >
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingDetails(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : task.detailsMarkdown ? (
                <MarkdownView content={task.detailsMarkdown} />
              ) : (
                <p className="text-sm text-muted-foreground">Nothing here yet — add specs, notes, or embedded images.</p>
              )}
            </CardContent>
          </Card>

          <AttachmentsCard taskId={taskId} attachments={task.attachments ?? []} />

          <CommentsCard task={task} myMemberId={myMember?.id ?? null} />
        </div>

        {/* sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Properties</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              <PropertyRow label="Status">
                <Select value={task.status} onValueChange={(v) => patch({ status: v }, "Status updated.")}>
                  <SelectTrigger size="sm" className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s] ?? s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </PropertyRow>
              <PropertyRow label="Priority">
                <Select value={task.priority} onValueChange={(v) => patch({ priority: v }, "Priority updated.")}>
                  <SelectTrigger size="sm" className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p.charAt(0) + p.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </PropertyRow>
              <PropertyRow label="Assignee">
                <Select
                  value={task.assigneeId ?? "unassigned"}
                  onValueChange={(v) => patch({ assigneeId: v === "unassigned" ? null : v }, "Assignee updated.")}
                >
                  <SelectTrigger size="sm" className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {(teamData?.data ?? []).map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </PropertyRow>
              <PropertyRow label="Due">
                {canEditDueDate ? (
                  <DateTimePicker
                    value={task.dueAt ? new Date(task.dueAt) : null}
                    onChange={(d) => patch({ dueAt: d ? d.toISOString() : null }, "Due date updated.")}
                    placeholder="Set due date"
                  />
                ) : (
                  <span className="text-muted-foreground">{fmtDate(task.dueAt)}</span>
                )}
              </PropertyRow>
              <PropertyRow label="Sprint">
                <Select
                  value={task.sprintId ?? "none"}
                  onValueChange={(v) => patch({ sprintId: v === "none" ? null : v }, "Sprint updated.")}
                >
                  <SelectTrigger size="sm" className="w-36">
                    <SelectValue placeholder="No sprint" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No sprint</SelectItem>
                    {(sprints ?? []).map((sp) => (
                      <SelectItem key={sp.id} value={sp.id}>
                        {sp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </PropertyRow>
              <PropertyRow label="Estimate">
                <Input
                  type="number"
                  min={0}
                  className="h-8 w-36 text-right"
                  defaultValue={task.estimate ?? ""}
                  placeholder="Points"
                  onBlur={(e) => {
                    const v = e.target.value === "" ? null : Number(e.target.value);
                    if (v !== task.estimate) patch({ estimate: v }, "Estimate updated.");
                  }}
                />
              </PropertyRow>
              <PropertyRow label="Labels">
                <Input
                  className="h-8 w-36 text-right"
                  value={labelsDraft ?? task.labels.join(", ")}
                  placeholder="a, b, c"
                  onChange={(e) => setLabelsDraft(e.target.value)}
                  onBlur={() => {
                    if (labelsDraft == null) return;
                    const labels = labelsDraft.split(",").map((l) => l.trim()).filter(Boolean);
                    patch({ labels }, "Labels updated.");
                    setLabelsDraft(null);
                  }}
                />
              </PropertyRow>
              {(task.watchers?.length ?? 0) > 0 && (
                <PropertyRow label="Watchers">
                  <span className="flex justify-end -space-x-1.5">
                    {task.watchers!.slice(0, 5).map((w) => (
                      <Avatar key={w.id} className="size-6 ring-2 ring-background">
                        <AvatarImage src={w.member?.user.image ?? undefined} alt={w.member?.user.name ?? ""} />
                        <AvatarFallback className="text-[9px]">{initials(w.member?.user.name ?? "?")}</AvatarFallback>
                      </Avatar>
                    ))}
                  </span>
                </PropertyRow>
              )}
            </CardContent>
          </Card>

          <TimeTrackingCard task={task} />

          <DependenciesCard task={task} />

          {(task.parentTask || (task.subTasks?.length ?? 0) > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Related</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {task.parentTask && (
                  <div className="flex items-start gap-2">
                    <HugeiconsIcon icon={HierarchyIcon} className="mt-0.5 size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
                    <Link href={`/dashboard/tasks/${task.parentTask.id}`} className="min-w-0 underline-offset-2 hover:underline">
                      {task.parentTask.title}
                    </Link>
                    <StatusBadge domain="task" value={task.parentTask.status} />
                  </div>
                )}
                {(task.subTasks?.length ?? 0) > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Sub-tasks</p>
                    {task.subTasks!.map((st) => (
                      <div key={st.id} className="flex items-center gap-2">
                        <Link href={`/dashboard/tasks/${st.id}`} className="min-w-0 flex-1 truncate underline-offset-2 hover:underline">
                          {st.title}
                        </Link>
                        <StatusBadge domain="task" value={st.status} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <HugeiconsIcon icon={UserIcon} className="size-4" strokeWidth={2} />
                Created by {task.creator?.user?.name ?? "—"}
              </p>
              <p className="flex items-center gap-2">
                <HugeiconsIcon icon={Calendar03Icon} className="size-4" strokeWidth={2} />
                Created {fmtDate(task.createdAt)}
              </p>
              <p className="flex items-center gap-2">
                <HugeiconsIcon icon={Calendar03Icon} className="size-4" strokeWidth={2} />
                Updated {fmtDate(task.updatedAt)}
              </p>
              {task.completedAt && (
                <p className="flex items-center gap-2">
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-4" strokeWidth={2} />
                  Completed {fmtDate(task.completedAt)}
                </p>
              )}
            </CardContent>
          </Card>

          <TimelineCard taskId={taskId} />
        </div>
      </div>
    </div>
  );
}
