"use client";

import { useState } from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { HugeiconsIcon } from "@hugeicons/react";
import { GithubIcon, GitCommitIcon, ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { useProjectContributors, useProjectCommits } from "@/services/github";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { initials } from "@/lib/string";
import { cn } from "@/lib/utils";

const chartConfig = { commits: { label: "Commits", color: "var(--chart-1)" } } satisfies ChartConfig;

export function GithubPanel({ projectId, slug, hasRepo, repoUrl }: { projectId: string; slug: string; hasRepo: boolean; repoUrl?: string | null }) {
  const [author, setAuthor] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const { data: contrib, isPending: contribPending } = useProjectContributors(projectId, hasRepo);
  const { data: commitsData, isPending: commitsPending } = useProjectCommits(projectId, author, page, hasRepo);

  if (!hasRepo) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <HugeiconsIcon icon={GithubIcon} className="mx-auto size-8 text-muted-foreground" strokeWidth={1.6} />
        <p className="mt-3 text-sm text-muted-foreground">
          Link a GitHub repository to this project (Edit → GitHub repository) to see commit activity and code stats.
        </p>
      </div>
    );
  }

  const contributors = contrib?.contributors ?? [];
  const chartData = contributors.slice(0, 8).map((c) => ({ name: c.member?.name ?? c.login, commits: c.commits }));

  return (
    <div className="space-y-6">
      {/* Contributors */}
      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-medium">Contributors</h3>
          {repoUrl && (
            <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <HugeiconsIcon icon={GithubIcon} className="size-3.5" strokeWidth={2} />
              {contrib?.repo}
            </a>
          )}
        </div>

        {contribPending ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-40 w-full" />
          </div>
        ) : contrib?.computing ? (
          <p className="p-6 text-center text-sm text-muted-foreground">GitHub is still computing stats for this repo — refreshing…</p>
        ) : contributors.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">No commit data yet.</p>
        ) : (
          <>
            <ChartContainer config={chartConfig} className="h-48 w-full px-4 pt-4">
              <BarChart data={chartData} margin={{ left: 4, right: 4 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} interval={0} angle={-15} textAnchor="end" height={48} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="commits" fill="var(--color-commits)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>

            <ul className="divide-y">
              {contributors.map((c) => {
                const active = author === c.login;
                return (
                  <li key={c.login}>
                    <button
                      type="button"
                      onClick={() => { setAuthor(active ? null : c.login); setPage(1); }}
                      className={cn("flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/50", active && "bg-muted/60")}
                    >
                      <Avatar className="size-8">
                        <AvatarImage src={c.avatarUrl ?? undefined} />
                        <AvatarFallback className="text-xs">{initials(c.member?.name ?? c.login)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{c.member?.name ?? c.login}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          @{c.login}{!c.member && " · not linked"}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-medium">{c.commits} <span className="font-normal text-muted-foreground">commits</span></p>
                        <p className="font-mono text-xs">
                          <span className="text-status-green">+{c.additions}</span>{" "}
                          <span className="text-destructive">−{c.deletions}</span>
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {/* Commits */}
      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="flex items-center gap-2 text-sm font-medium">
            <HugeiconsIcon icon={GitCommitIcon} className="size-4 text-muted-foreground" strokeWidth={2} />
            Commits
          </h3>
          {author && (
            <button type="button" onClick={() => { setAuthor(null); setPage(1); }} className="text-xs text-muted-foreground hover:text-foreground">
              Clear filter (@{author})
            </button>
          )}
        </div>

        {commitsPending && !commitsData ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : (commitsData?.commits.length ?? 0) === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">No commits found.</p>
        ) : (
          <ul className="divide-y">
            {commitsData!.commits.map((c) => (
              <li key={c.sha}>
                <Link
                  href={`/dashboard/projects/${encodeURIComponent(slug)}/commit/${c.sha}`}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50"
                >
                  <Avatar className="size-7">
                    <AvatarImage src={c.author.avatarUrl ?? undefined} />
                    <AvatarFallback className="text-[10px]">{initials(c.author.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{c.message.split("\n")[0]}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.author.member?.name ?? c.author.name}
                      {c.author.date && ` · ${new Date(c.author.date).toLocaleDateString()}`}
                    </p>
                  </div>
                  <code className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">{c.sha.slice(0, 7)}</code>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center justify-between border-t px-4 py-2.5">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" strokeWidth={2} /> Prev
          </Button>
          <span className="text-xs text-muted-foreground">Page {page}</span>
          <Button variant="outline" size="sm" disabled={!commitsData?.hasMore} onClick={() => setPage((p) => p + 1)}>
            Next <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" strokeWidth={2} />
          </Button>
        </div>
      </div>
    </div>
  );
}
