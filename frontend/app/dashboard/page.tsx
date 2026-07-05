import { Suspense } from "react";
import { cookies } from "next/headers";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatusBadge, PresenceDot } from "@/components/ui/status-badge";
import {
  Task01Icon,
  Folder01Icon,
  Activity01Icon,
  UserGroupIcon,
  AiVideoIcon,
  BubbleChatQuestionIcon,
  Notification01Icon,
  Target02Icon,
  AddCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

type HomeData = {
  stats: {
    tasksTodo: number;
    tasksInProgress: number;
    tasksInReview: number;
    tasksBlocked: number;
    tasksDone: number;
    projectsCount: number;
    unreadNotifications: number;
  };
  myTasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    labels: string[];
    dueAt: string | null;
    projectName: string | null;
    projectSlug: string | null;
  }>;
  todaysFocus: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    dueAt: string | null;
  }>;
  projects: Array<{
    id: string;
    name: string;
    slug: string;
    memberCount: number;
    taskCount: number;
    doneCount: number;
    progress: number;
  }>;
  recentActivities: Array<{
    id: string;
    action: string;
    entityType: string;
    entityTitle: string | null;
    memberName: string;
    memberImage: string | null;
    createdAt: string;
  }>;
  team: Array<{
    id: string;
    name: string;
    image: string | null;
    statusEmoji: string | null;
    statusText: string | null;
    workingOn: string | null;
    lastSeenAt: string | null;
  }>;
  todayMeetings: Array<{
    id: string;
    code: string;
    title: string;
    startsAt: string;
    endsAt: string | null;
  }>;
  mentions: Array<{
    id: string;
    title: string;
    body: string | null;
    link: string | null;
    readAt: string | null;
    createdAt: string;
  }>;
};

async function fetchHomeData(): Promise<HomeData | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  try {
    const res = await fetch(`${BASE}/home-data`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json() as Promise<HomeData>;
  } catch {
    return null;
  }
}

function formatRelative(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "Working late";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const actionBadge: Record<string, string> = {
  CREATE: "bg-status-green/12 text-status-green",
  UPDATE: "bg-status-yellow/12 text-status-yellow",
  DELETE: "bg-status-red/12 text-status-red",
  VIEW: "bg-status-blue/12 text-status-blue",
  COMMENT: "bg-status-purple/12 text-status-purple",
  ASSIGN: "bg-status-blue/12 text-status-blue",
  COMPLETE: "bg-status-green/12 text-status-green",
  MENTION: "bg-status-purple/12 text-status-purple",
};

const entityLabel: Record<string, string> = {
  PROJECT: "Project",
  TASK: "Task",
  SPRINT: "Sprint",
  MILESTONE: "Milestone",
  PROJECT_FILE: "File",
  TASK_ATTACHMENT: "Attachment",
  PROJECT_MEMBER: "Member",
  MESSAGE: "Message",
  MEETING: "Meeting",
  MEMBER: "Member",
  AI_REPORT: "AI Report",
};

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function DashboardSkeleton() {
  return (
    <div className="container mx-auto py-4 space-y-6">
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} size="sm">
            <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
            <CardContent><Skeleton className="h-8 w-16" /></CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} size="sm">
            <CardHeader className="pb-2"><Skeleton className="h-5 w-32" /></CardHeader>
            <CardContent><Skeleton className="h-28 w-full" /></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  tone,
  href,
}: {
  label: string;
  value: number;
  tone: "neutral" | "blue" | "orange" | "red" | "green";
  href: string;
}) {
  const bar: Record<string, string> = {
    neutral: "bg-status-neutral",
    blue: "bg-status-blue",
    orange: "bg-status-orange",
    red: "bg-status-red",
    green: "bg-status-green",
  };
  return (
    <Link href={href} className="group">
      <Card size="sm" className="relative overflow-hidden transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md">
        <span className={`absolute inset-x-0 top-0 h-0.5 ${bar[tone]} opacity-70`} />
        <CardHeader className="pb-1">
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</CardTitle>
        </CardHeader>
        <CardContent>
          <span className="text-2xl font-semibold tabular-nums">{value}</span>
        </CardContent>
      </Card>
    </Link>
  );
}

async function DashboardContent() {
  const data = await fetchHomeData();

  if (!data) {
    return (
      <div className="container mx-auto py-4">
        <h1 className="text-2xl font-semibold tracking-tight mb-4">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-4">Unable to load dashboard data. Ensure you are in an organization.</p>
      </div>
    );
  }

  const { stats, myTasks, todaysFocus, projects, recentActivities, team, todayMeetings, mentions } = data;
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="container mx-auto py-4 space-y-6">
      {/* Header + quick actions */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-brand/10 via-transparent to-status-blue/5 px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{greeting()} 👋</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{today} — here&apos;s what your team is up to.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm" className="gap-1.5">
              <Link href="/dashboard/tasks">
                <HugeiconsIcon icon={AddCircleIcon} className="size-4" strokeWidth={2} /> New task
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="gap-1.5">
              <Link href="/chat" target="_blank">
                <HugeiconsIcon icon={BubbleChatQuestionIcon} className="size-4" strokeWidth={2} /> Chat
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="gap-1.5">
              <Link href="/meet" target="_blank">
                <HugeiconsIcon icon={AiVideoIcon} className="size-4" strokeWidth={2} /> Meet
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost" className="gap-1.5 relative">
              <Link href="/dashboard/notifications">
                <HugeiconsIcon icon={Notification01Icon} className="size-4" strokeWidth={2} />
                {stats.unreadNotifications > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-status-red text-[10px] font-semibold text-white">
                    {stats.unreadNotifications > 9 ? "9+" : stats.unreadNotifications}
                  </span>
                )}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Status tiles */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 items-stretch">
        <StatTile label="To do" value={stats.tasksTodo} tone="neutral" href="/dashboard/tasks" />
        <StatTile label="In progress" value={stats.tasksInProgress} tone="blue" href="/dashboard/tasks" />
        <StatTile label="In review" value={stats.tasksInReview} tone="orange" href="/dashboard/tasks" />
        <StatTile label="Blocked" value={stats.tasksBlocked} tone="red" href="/dashboard/tasks" />
        <StatTile label="Done" value={stats.tasksDone} tone="green" href="/dashboard/tasks" />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3 items-stretch">
        {/* Today's focus + my tasks */}
        <Card size="sm" className="flex h-full flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <HugeiconsIcon icon={Target02Icon} className="size-4 text-brand" strokeWidth={2} />
              Today&apos;s focus
            </CardTitle>
            <CardDescription>Your tasks due today or overdue</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <div className="flex-1 space-y-3">
              {todaysFocus.length === 0 ? (
                <p className="text-sm text-muted-foreground py-1">Nothing due today — pick something from your list. 🎉</p>
              ) : (
                <ul className="space-y-2">
                  {todaysFocus.map((t) => (
                    <li key={t.id}>
                      <Link href={`/dashboard/tasks/${t.id}`} className="group flex items-center justify-between gap-2 rounded-lg border px-3 py-2 transition-colors hover:bg-muted/50">
                        <span className="truncate text-sm font-medium group-hover:underline">{t.title}</span>
                        <StatusBadge domain="priority" value={t.priority} size="sm" noTooltip />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <div className="border-t pt-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">My open tasks</p>
                {myTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No open tasks assigned to you.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {myTasks.slice(0, 6).map((t) => (
                      <li key={t.id}>
                        <Link href={`/dashboard/tasks/${t.id}`} className="flex items-center gap-2 text-sm hover:underline">
                          <StatusBadge domain="task" value={t.status} size="sm" showIcon noTooltip label="" className="px-1 py-1" />
                          <span className="truncate">{t.title}</span>
                          {t.projectName && <span className="ml-auto shrink-0 text-xs text-muted-foreground">{t.projectName}</span>}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <Link href="/dashboard/tasks" className="mt-auto pt-3 inline-block text-sm text-primary hover:underline">View all tasks</Link>
          </CardContent>
        </Card>

        {/* Projects */}
        <Card size="sm" className="flex h-full flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <HugeiconsIcon icon={Folder01Icon} className="size-4 text-status-blue" strokeWidth={2} />
              Projects
            </CardTitle>
            <CardDescription>Progress across active projects</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <div className="flex-1">
              {projects.length === 0 ? (
                <p className="text-sm text-muted-foreground py-1">No projects yet. Create one to get started.</p>
              ) : (
                <ul className="space-y-3">
                  {projects.map((p) => (
                    <li key={p.id}>
                      <Link href={`/dashboard/projects/${p.slug}`} className="group block">
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <span className="truncate font-medium group-hover:underline">{p.name}</span>
                          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{p.doneCount}/{p.taskCount}</span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-brand to-status-blue transition-all duration-500"
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Link href="/dashboard/projects" className="mt-auto pt-3 inline-block text-sm text-primary hover:underline">View all projects</Link>
          </CardContent>
        </Card>

        {/* Team presence */}
        <Card size="sm" className="flex h-full flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <HugeiconsIcon icon={UserGroupIcon} className="size-4 text-status-green" strokeWidth={2} />
              Team
            </CardTitle>
            <CardDescription>Who&apos;s online and what they&apos;re doing</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <div className="flex-1">
              {team.length === 0 ? (
                <p className="text-sm text-muted-foreground py-1">No teammates yet.</p>
              ) : (
                <ul className="space-y-2.5">
                  {team.slice(0, 7).map((m) => (
                    <li key={m.id} className="flex items-center gap-2.5">
                      <span className="relative inline-flex">
                        <Avatar className="size-7">
                          <AvatarImage src={m.image ?? undefined} alt={m.name} />
                          <AvatarFallback className="text-[10px]">{initials(m.name)}</AvatarFallback>
                        </Avatar>
                        <PresenceDot lastSeenAt={m.lastSeenAt} className="absolute -bottom-0.5 -right-0.5 size-2" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium leading-tight">
                          {m.name} {m.statusEmoji && <span>{m.statusEmoji}</span>}
                        </p>
                        {(m.workingOn || m.statusText) && (
                          <p className="truncate text-xs text-muted-foreground">{m.workingOn ?? m.statusText}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Link href="/dashboard/team" className="mt-auto pt-3 inline-block text-sm text-primary hover:underline">View team</Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3 items-stretch">
        <Card size="sm" className="flex h-full flex-col lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <HugeiconsIcon icon={Activity01Icon} className="size-4 text-status-purple" strokeWidth={2} />
              Recent activity
            </CardTitle>
            <CardDescription>Latest changes across the workspace</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <div className="flex-1">
              {!recentActivities?.length ? (
                <p className="text-sm text-muted-foreground py-1">No recent activity.</p>
              ) : (
                <ul className="space-y-2">
                  {recentActivities.slice(0, 8).map((a) => (
                    <li key={a.id} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                      <Avatar className="size-5">
                        <AvatarImage src={a.memberImage ?? undefined} alt={a.memberName} />
                        <AvatarFallback className="text-[9px]">{initials(a.memberName)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{a.memberName}</span>
                      <Badge variant="secondary" className={`text-xs ${actionBadge[a.action] ?? ""}`}>
                        {a.action.toLowerCase()}
                      </Badge>
                      <span className="text-muted-foreground">{entityLabel[a.entityType] ?? a.entityType}</span>
                      <span className="truncate min-w-0">{a.entityTitle ?? ""}</span>
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">{formatRelative(a.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Link href="/dashboard/activities" className="mt-auto pt-3 inline-block text-sm text-primary hover:underline">View all activity</Link>
          </CardContent>
        </Card>

        {/* Mentions + meetings */}
        <Card size="sm" className="flex h-full flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <HugeiconsIcon icon={AiVideoIcon} className="size-4 text-status-orange" strokeWidth={2} />
              Today
            </CardTitle>
            <CardDescription>Meetings and mentions</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <div className="flex-1 space-y-4">
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Meetings today</p>
                {todayMeetings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No meetings scheduled today.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {todayMeetings.map((m) => (
                      <li key={m.id}>
                        <Link href={`/meet/${m.code}`} target="_blank" className="flex items-center justify-between gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors hover:bg-muted/50">
                          <span className="truncate font-medium">{m.title}</span>
                          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{formatTime(m.startsAt)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Mentions</p>
                {mentions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No one mentioned you recently.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {mentions.map((n) => (
                      <li key={n.id}>
                        <Link href={n.link ?? "/dashboard/notifications"} className="block rounded-lg border px-3 py-1.5 text-sm transition-colors hover:bg-muted/50">
                          <span className={`block truncate ${n.readAt ? "" : "font-semibold"}`}>{n.body ?? n.title}</span>
                          <span className="text-xs text-muted-foreground">{formatRelative(n.createdAt)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
