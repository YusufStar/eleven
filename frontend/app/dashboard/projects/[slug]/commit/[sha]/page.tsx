"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, GithubIcon, GitCommitIcon } from "@hugeicons/core-free-icons";
import { useProjectDetail } from "@/services/projects";
import { useCommitDetail } from "@/services/github";
import { CommitFileDiff } from "@/components/github/commit-diff";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { initials } from "@/lib/string";

export default function CommitDetailPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const sha = typeof params.sha === "string" ? params.sha : "";
  const { data: project } = useProjectDetail(slug || null);
  const { data: commit, isPending, error } = useCommitDetail(project?.id ?? null, sha || null);

  const backHref = `/dashboard/projects/${encodeURIComponent(slug)}`;
  const [title, ...bodyLines] = (commit?.message ?? "").split("\n");
  const body = bodyLines.join("\n").trim();

  return (
    <div className="container mx-auto max-w-5xl py-2">
      <Link href={backHref} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" strokeWidth={2} />
        Back to project
      </Link>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error.message}
        </div>
      )}

      {isPending && !commit ? (
        <div className="space-y-3">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : commit ? (
        <>
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-start gap-2">
              <HugeiconsIcon icon={GitCommitIcon} className="mt-0.5 size-5 shrink-0 text-muted-foreground" strokeWidth={2} />
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-semibold leading-snug">{title || "(no message)"}</h1>
                {body && <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-muted-foreground">{body}</pre>}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-4 text-sm">
              <div className="flex items-center gap-2">
                <Avatar className="size-6">
                  <AvatarImage src={commit.author.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-[10px]">{initials(commit.author.name)}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{commit.author.name}</span>
                {commit.author.login && <span className="text-muted-foreground">@{commit.author.login}</span>}
              </div>
              {commit.author.date && (
                <span className="text-muted-foreground">
                  {new Date(commit.author.date).toLocaleString()}
                </span>
              )}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{commit.sha.slice(0, 7)}</code>
              <span className="font-mono text-xs">
                <span className="text-status-green">+{commit.stats.additions}</span>{" "}
                <span className="text-destructive">−{commit.stats.deletions}</span>
              </span>
              <a
                href={commit.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors hover:bg-muted"
              >
                <HugeiconsIcon icon={GithubIcon} className="size-3.5" strokeWidth={2} />
                View on GitHub
              </a>
            </div>
          </div>

          <p className="mt-6 mb-3 text-sm font-medium text-muted-foreground">
            {commit.files.length} changed file{commit.files.length === 1 ? "" : "s"}
          </p>
          <div className="space-y-4">
            {commit.files.map((f) => (
              <CommitFileDiff key={f.filename} file={f} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
