"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useProjectDetail } from "@/services/projects";
import { projectsApi } from "@/services/projects";
import { TaskDetailModal } from "@/components/tasks/task-detail-modal";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  NoteIcon,
  LinkSquare01Icon,
  GithubIcon,
  UserGroupIcon,
  File02Icon,
  Task01Icon,
} from "@hugeicons/core-free-icons";
import { Skeleton } from "@/components/ui/skeleton";

function formatDate(s: string | null | undefined) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return "—";
  }
}

export function ProjectDetailContent() {
  const params = useParams();
  const router = useRouter();
  const idOrSlug = typeof params.slug === "string" ? params.slug : null;
  const { data: project, isPending, error } = useProjectDetail(idOrSlug);
  const [taskModalTaskId, setTaskModalTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (!idOrSlug) router.replace("/dashboard/projects");
  }, [idOrSlug, router]);

  if (error) {
    return (
      <div className="container mx-auto py-2">
        <Link href="/dashboard/projects" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4">
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" strokeWidth={2} />
          Back to Projects
        </Link>
        <p className="text-destructive">Failed to load project.</p>
      </div>
    );
  }

  if (!idOrSlug) return null;

  if (isPending || !project) {
    return (
      <div className="container mx-auto py-2 space-y-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const linksList = Array.isArray(project.links) ? project.links.filter((l) => l?.title && l?.url) : [];

  return (
    <div className="container mx-auto py-2 space-y-6">
      <Link
        href="/dashboard/projects"
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" strokeWidth={2} />
        Back to Projects
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{project.name?.trim() ?? "—"}</h1>
        {project.slug && (
          <p className="text-muted-foreground font-mono text-sm mt-0.5">{project.slug}</p>
        )}
      </div>

      {project.description && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HugeiconsIcon icon={NoteIcon} className="size-4" strokeWidth={2} />
              Description
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{project.description}</p>
          </CardContent>
        </Card>
      )}

      {(linksList.length > 0 || project.githubRepoUrl) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HugeiconsIcon icon={LinkSquare01Icon} className="size-4" strokeWidth={2} />
              Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {project.githubRepoUrl && (
              <a
                href={project.githubRepoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <HugeiconsIcon icon={GithubIcon} className="size-4" strokeWidth={2} />
                {project.githubRepoFullName ?? project.githubRepoUrl}
              </a>
            )}
            {linksList.map((link, i) => (
              <a
                key={i}
                href={link.url.startsWith("http") ? link.url : `https://${link.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-primary hover:underline"
              >
                {link.title || link.url}
              </a>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HugeiconsIcon icon={UserGroupIcon} className="size-4" strokeWidth={2} />
            Members ({project.members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {project.members.length === 0 ? (
            <p className="text-sm text-muted-foreground">No members.</p>
          ) : (
            <ul className="space-y-2">
              {project.members.map((m) => (
                <li key={m.id} className="flex items-center gap-2">
                  {m.member?.user?.image ? (
                    <span className="relative block h-8 w-8 shrink-0 overflow-hidden rounded-lg">
                      <Image src={m.member.user.image} alt="" fill sizes="32px" className="object-cover" />
                    </span>
                  ) : null}
                  <span className="text-sm font-medium">{m.member?.user?.name ?? "—"}</span>
                  {m.member?.user?.email && (
                    <span className="text-muted-foreground text-sm">{m.member.user.email}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HugeiconsIcon icon={File02Icon} className="size-4" strokeWidth={2} />
            Files ({project.files.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {project.files.length === 0 ? (
            <p className="text-sm text-muted-foreground">No files.</p>
          ) : (
            <ul className="space-y-2">
              {project.files.map((f) => (
                <li key={f.id}>
                  <a
                    href={projectsApi.getFileDownloadUrl(project.id, f.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {f.fileName}
                  </a>
                  {f.uploadedBy?.user?.name && (
                    <span className="text-muted-foreground text-sm ml-2">· {f.uploadedBy.user.name}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HugeiconsIcon icon={Task01Icon} className="size-4" strokeWidth={2} />
            Tasks ({project.tasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {project.tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks.</p>
          ) : (
            <ul className="space-y-2">
              {project.tasks.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setTaskModalTaskId(t.id)}
                    className="text-sm font-medium text-primary hover:underline text-left"
                  >
                    {t.title}
                  </button>
                  <span className="text-muted-foreground text-sm ml-2 inline-flex items-center gap-1.5">
                    <TaskStatusBadge status={t.status} />
                    <TaskPriorityBadge priority={t.priority} />
                    {t.dueAt ? formatDate(t.dueAt) : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <TaskDetailModal
        taskId={taskModalTaskId}
        open={taskModalTaskId != null}
        onOpenChange={(open) => !open && setTaskModalTaskId(null)}
      />
    </div>
  );
}
