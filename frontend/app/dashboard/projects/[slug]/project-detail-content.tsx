"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { useProjectDetail, useProjectInsights, projectsApi } from "@/services/projects";
import { useTasksList } from "@/services/tasks";
import { authClient } from "@/lib/auth-client";
import { useTeamMembersList } from "@/services/team";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProjectMilestones } from "@/components/projects/project-milestones";
import { TasksKanbanView } from "@/components/tasks/tasks-kanban-view";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  LinkSquare01Icon,
  GithubIcon,
  UserGroupIcon,
  File02Icon,
  DashboardSquare01Icon,
  KanbanIcon,
  Task01Icon,
  ChartLineData01Icon,
  Calendar03Icon,
  ChartGanttIcon,
} from "@hugeicons/core-free-icons";
import { ProjectCalendar, ProjectTimeline } from "@/components/projects/project-schedule";
import { initials } from "@/lib/string";

function formatDate(s: string | null | undefined) {
  if (!s) return "";
  try {
    return new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function ProgressRing({ value }: { value: number }) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div className="relative size-24 shrink-0">
      <svg viewBox="0 0 80 80" className="size-24 -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--muted)" strokeWidth="7" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--brand)" />
            <stop offset="100%" stopColor="var(--status-blue)" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold tabular-nums">
        {value}%
      </span>
    </div>
  );
}

const burndownConfig = {
  created: { label: "Created", color: "var(--status-orange)" },
  completed: { label: "Completed", color: "var(--status-green)" },
} satisfies ChartConfig;

const velocityConfig = {
  points: { label: "Points shipped", color: "var(--brand)" },
} satisfies ChartConfig;

function InsightsPanel({ projectId }: { projectId: string }) {
  const { data, isPending } = useProjectInsights(projectId);
  if (isPending || !data) {
    return <Skeleton className="h-40 w-full" />;
  }
  const weekLabel = (w: string) => new Date(w).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const chartData = data.weeks.map((w) => ({ ...w, label: weekLabel(w.week) }));

  return (
    <div className="space-y-6">
      <Card size="sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-4">
            <ProgressRing value={data.progress} />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Project health</CardTitle>
                <StatusBadge domain="health" value={data.health} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm sm:grid-cols-6">
                <Stat label="Total" value={data.total} />
                <Stat label="To do" value={data.todo} tone="neutral" />
                <Stat label="In progress" value={data.inProgress} tone="blue" />
                <Stat label="In review" value={data.inReview} tone="orange" />
                <Stat label="Blocked" value={data.blocked} tone="red" />
                <Stat label="Overdue" value={data.overdue} tone="red" />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card size="sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <HugeiconsIcon icon={ChartLineData01Icon} className="size-4 text-status-green" strokeWidth={2} />
              Burn-up (created vs completed)
            </CardTitle>
            <CardDescription>Last 8 weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={burndownConfig} className="h-48 w-full">
              <AreaChart data={chartData} margin={{ left: 4, right: 4 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area dataKey="created" type="monotone" stroke="var(--color-created)" fill="var(--color-created)" fillOpacity={0.15} />
                <Area dataKey="completed" type="monotone" stroke="var(--color-completed)" fill="var(--color-completed)" fillOpacity={0.2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <HugeiconsIcon icon={ChartLineData01Icon} className="size-4 text-brand" strokeWidth={2} />
              Velocity (points shipped)
            </CardTitle>
            <CardDescription>Story points completed per week</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={velocityConfig} className="h-48 w-full">
              <BarChart data={chartData} margin={{ left: 4, right: 4 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="points" fill="var(--color-points)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <ProjectMilestones projectId={projectId} />
    </div>
  );
}

function Stat({ label, value, tone = "neutral" }: { label: string; value: number; tone?: string }) {
  const color: Record<string, string> = {
    neutral: "text-foreground",
    blue: "text-status-blue",
    orange: "text-status-orange",
    red: "text-status-red",
    green: "text-status-green",
  };
  return (
    <div>
      <p className={`text-lg font-semibold tabular-nums ${color[tone]}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function ProjectBoard({ projectId }: { projectId: string }) {
  const { data: session } = authClient.useSession();
  const { data: teamData } = useTeamMembersList({ pageSize: 200 });
  const myMemberId =
    (teamData?.data ?? []).find((m) => m.userId === session?.user?.id)?.id ?? null;
  const { data, isPending } = useTasksList({ all: true, projectId });
  return (
    <TasksKanbanView tasks={data?.data ?? []} isPending={isPending} currentUserMemberId={myMemberId} />
  );
}

export function ProjectDetailContent() {
  const params = useParams();
  const router = useRouter();
  const idOrSlug = typeof params.slug === "string" ? params.slug : null;
  const { data: project, isPending, error } = useProjectDetail(idOrSlug);

  useEffect(() => {
    if (!idOrSlug) router.replace("/dashboard/projects");
  }, [idOrSlug, router]);

  if (error) {
    return (
      <div className="container mx-auto py-2">
        <Link href="/dashboard/projects" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
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
      <div className="container mx-auto space-y-4 py-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const linksList = Array.isArray(project.links) ? project.links.filter((l) => l?.title && l?.url) : [];

  return (
    <div className="container mx-auto space-y-6 py-2">
      <Link
        href="/dashboard/projects"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" strokeWidth={2} />
        Back to Projects
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{project.name?.trim() ?? "—"}</h1>
          {project.description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{project.description}</p>}
        </div>
        {(linksList.length > 0 || project.githubRepoUrl) && (
          <div className="flex flex-wrap gap-2">
            {project.githubRepoUrl && (
              <a
                href={project.githubRepoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors hover:bg-muted"
              >
                <HugeiconsIcon icon={GithubIcon} className="size-3.5" strokeWidth={2} />
                {project.githubRepoFullName ?? "GitHub"}
              </a>
            )}
            {linksList.map((link, i) => (
              <a
                key={i}
                href={link.url.startsWith("http") ? link.url : `https://${link.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors hover:bg-muted"
              >
                <HugeiconsIcon icon={LinkSquare01Icon} className="size-3.5" strokeWidth={2} />
                {link.title || link.url}
              </a>
            ))}
          </div>
        )}
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" className="gap-1.5">
            <HugeiconsIcon icon={DashboardSquare01Icon} className="size-4" strokeWidth={2} />
            Overview
          </TabsTrigger>
          <TabsTrigger value="board" className="gap-1.5">
            <HugeiconsIcon icon={KanbanIcon} className="size-4" strokeWidth={2} />
            Board
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-1.5">
            <HugeiconsIcon icon={Task01Icon} className="size-4" strokeWidth={2} />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-1.5">
            <HugeiconsIcon icon={Calendar03Icon} className="size-4" strokeWidth={2} />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-1.5">
            <HugeiconsIcon icon={ChartGanttIcon} className="size-4" strokeWidth={2} />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="files" className="gap-1.5">
            <HugeiconsIcon icon={File02Icon} className="size-4" strokeWidth={2} />
            Files
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-1.5">
            <HugeiconsIcon icon={UserGroupIcon} className="size-4" strokeWidth={2} />
            Members
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <InsightsPanel projectId={project.id} />
        </TabsContent>

        <TabsContent value="board" className="mt-4">
          <ProjectBoard projectId={project.id} />
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <ProjectCalendar projectId={project.id} tasks={project.tasks} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <ProjectTimeline projectId={project.id} tasks={project.tasks} />
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {project.tasks.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">No tasks yet.</p>
              ) : (
                <ul className="divide-y">
                  {project.tasks.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                      <Link href={`/dashboard/tasks/${t.id}`} className="min-w-0 flex-1 truncate text-sm font-medium hover:underline">
                        {t.title}
                      </Link>
                      <StatusBadge domain="priority" value={t.priority} size="sm" noTooltip />
                      <StatusBadge domain="task" value={t.status} size="sm" noTooltip />
                      {t.dueAt && <span className="shrink-0 text-xs text-muted-foreground">{formatDate(t.dueAt)}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <HugeiconsIcon icon={File02Icon} className="size-4" strokeWidth={2} />
                Files ({project.files.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {project.files.length === 0 ? (
                <p className="text-sm text-muted-foreground">No files yet. Upload from the Files page.</p>
              ) : (
                <ul className="space-y-2">
                  {project.files.map((f) => (
                    <li key={f.id} className="flex items-center gap-2">
                      <a
                        href={projectsApi.getFileDownloadUrl(project.id, f.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {f.fileName}
                      </a>
                      {f.uploadedBy?.user?.name && (
                        <span className="text-sm text-muted-foreground">· {f.uploadedBy.user.name}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="mt-4">
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
                    <li key={m.id} className="flex items-center gap-2.5">
                      <Avatar className="size-8">
                        <AvatarImage src={m.member?.user?.image ?? undefined} alt="" />
                        <AvatarFallback className="text-xs">{initials(m.member?.user?.name ?? "?")}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{m.member?.user?.name ?? "—"}</p>
                        {m.member?.user?.email && (
                          <p className="truncate text-xs text-muted-foreground">{m.member.user.email}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
