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
import {
  ContactIcon,
  PipelineIcon,
  Task01Icon,
  Folder01Icon,
  Activity01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

type HomeData = {
  stats: {
    contactsCount: number;
    dealsCount: number;
    openDealsValue: number;
    tasksTodo: number;
    tasksDone: number;
    projectsCount: number;
  };
  recentActivities: Array<{
    id: string;
    action: string;
    entityType: string;
    entityTitle: string | null;
    memberName: string;
    createdAt: string;
  }>;
  recentDeals: Array<{
    id: string;
    title: string;
    value: number | null;
    currency: string;
    stageName: string;
    stageColor: string | null;
    contactName: string | null;
    updatedAt: string;
  }>;
  recentTasks: Array<{
    id: string;
    title: string;
    status: string;
    dueAt: string | null;
    assigneeName: string | null;
    projectName: string | null;
    projectSlug: string | null;
    updatedAt: string;
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
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const actionBadge: Record<string, string> = {
  CREATE: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
  UPDATE: "bg-amber-500/12 text-amber-700 dark:text-amber-400",
  DELETE: "bg-red-500/12 text-red-700 dark:text-red-400",
  VIEW: "bg-sky-500/12 text-sky-700 dark:text-sky-400",
};

const entityLabel: Record<string, string> = {
  CONTACT: "Contact",
  DEAL: "Deal",
  PROJECT: "Project",
  TASK: "Task",
  PIPELINE: "Pipeline",
  STAGE: "Stage",
  PROJECT_FILE: "File",
  TASK_ATTACHMENT: "Attachment",
  PROJECT_MEMBER: "Member",
};

export default async function DashboardPage() {
  const data = await fetchHomeData();

  if (!data) {
    return (
      <div className="container mx-auto py-4">
        <h1 className="text-2xl font-semibold tracking-tight mb-4">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} size="sm">
              <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-16" /></CardContent>
            </Card>
          ))}
        </div>
        <p className="text-muted-foreground text-sm mt-4">Unable to load dashboard data. Ensure you are in an organization.</p>
      </div>
    );
  }

  const { stats, recentActivities, recentDeals, recentTasks } = data;

  return (
    <div className="container mx-auto py-4 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Overview and recent activity for your organization.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
        <Link href="/dashboard/contacts/people" className="h-full">
          <Card className="h-full transition-colors hover:bg-muted/50 flex flex-col" size="sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Contacts</CardTitle>
              <HugeiconsIcon icon={ContactIcon} className="size-4 text-muted-foreground" strokeWidth={2} />
            </CardHeader>
            <CardContent className="flex-1">
              <span className="text-2xl font-semibold">{stats.contactsCount}</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/deals/list" className="h-full">
          <Card className="h-full transition-colors hover:bg-muted/50 flex flex-col" size="sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Deals</CardTitle>
              <HugeiconsIcon icon={PipelineIcon} className="size-4 text-muted-foreground" strokeWidth={2} />
            </CardHeader>
            <CardContent className="flex-1">
              <span className="text-2xl font-semibold">{stats.dealsCount}</span>
              {stats.openDealsValue > 0 && (
                <p className="text-xs text-muted-foreground mt-1">Open: {stats.openDealsValue.toLocaleString()} {recentDeals[0]?.currency ?? "TRY"}</p>
              )}
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/tasks" className="h-full">
          <Card className="h-full transition-colors hover:bg-muted/50 flex flex-col" size="sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tasks</CardTitle>
              <HugeiconsIcon icon={Task01Icon} className="size-4 text-muted-foreground" strokeWidth={2} />
            </CardHeader>
            <CardContent className="flex-1">
              <span className="text-2xl font-semibold">{stats.tasksTodo + stats.tasksDone}</span>
              <p className="text-xs text-muted-foreground mt-1">{stats.tasksTodo} to do · {stats.tasksDone} done</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/projects" className="h-full">
          <Card className="h-full transition-colors hover:bg-muted/50 flex flex-col" size="sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Projects</CardTitle>
              <HugeiconsIcon icon={Folder01Icon} className="size-4 text-muted-foreground" strokeWidth={2} />
            </CardHeader>
            <CardContent className="flex-1">
              <span className="text-2xl font-semibold">{stats.projectsCount}</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 items-stretch">
        <Card size="sm" className="h-full flex flex-col min-h-0">
          <CardHeader className="pb-2 shrink-0">
            <CardTitle className="text-base flex items-center gap-2">
              <HugeiconsIcon icon={Activity01Icon} className="size-4" strokeWidth={2} />
              Recent activity
            </CardTitle>
            <CardDescription>Latest changes across the organization</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col min-h-0 flex-1">
            {!recentActivities?.length ? (
              <p className="text-sm text-muted-foreground py-2">No recent activity.</p>
            ) : (
              <ul className="space-y-1.5 min-h-[120px] overflow-y-auto max-h-[200px] pr-1">
                {recentActivities.slice(0, 6).map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                    <Badge variant="secondary" className={`text-xs ${actionBadge[a.action] ?? ""}`}>
                      {a.action}
                    </Badge>
                    <span className="text-muted-foreground">{entityLabel[a.entityType] ?? a.entityType}</span>
                    <span className="truncate min-w-0">{a.entityTitle ?? a.id}</span>
                    <span className="text-muted-foreground text-xs">by {a.memberName ?? "—"} · {formatRelative(a.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/dashboard/activities" className="text-sm text-primary hover:underline mt-2 inline-block shrink-0">View all activity</Link>
          </CardContent>
        </Card>

        <Card size="sm" className="h-full flex flex-col min-h-0">
          <CardHeader className="pb-2 shrink-0">
            <CardTitle className="text-base">Recent deals</CardTitle>
            <CardDescription>Last updated deals</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col min-h-0 flex-1">
            {recentDeals.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No deals yet.</p>
            ) : (
              <ul className="space-y-1.5 min-h-0 overflow-y-auto max-h-[200px]">
                {recentDeals.map((d) => (
                  <li key={d.id}>
                    <Link href={`/dashboard/deals/${d.id}`} className="flex items-center justify-between gap-2 text-sm hover:underline">
                      <span className="truncate font-medium">{d.title}</span>
                      <span className="text-muted-foreground shrink-0">{d.value != null ? `${d.value.toLocaleString()} ${d.currency}` : "—"}</span>
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-xs" style={d.stageColor ? { borderColor: d.stageColor, color: d.stageColor } : undefined}>
                        {d.stageName}
                      </Badge>
                      {d.contactName && <span className="text-xs text-muted-foreground truncate">{d.contactName}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/dashboard/deals/list" className="text-sm text-primary hover:underline mt-2 inline-block shrink-0">View all deals</Link>
          </CardContent>
        </Card>

        <Card size="sm" className="h-full flex flex-col min-h-0">
          <CardHeader className="pb-2 shrink-0">
            <CardTitle className="text-base">Recent tasks</CardTitle>
            <CardDescription>Last updated tasks</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col min-h-0 flex-1">
            {recentTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No tasks yet.</p>
            ) : (
              <ul className="space-y-1.5 min-h-0 overflow-y-auto max-h-[200px]">
                {recentTasks.map((t) => (
                  <li key={t.id}>
                    <Link href="/dashboard/tasks" className="flex items-center justify-between gap-2 text-sm hover:underline">
                      <span className="truncate font-medium">{t.title}</span>
                      <Badge variant="secondary" className="text-xs shrink-0">{t.status.replace("_", " ")}</Badge>
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      {t.projectName && <span>{t.projectName}</span>}
                      {t.assigneeName && <span>· {t.assigneeName}</span>}
                      {t.dueAt && <span>· Due {formatRelative(t.dueAt)}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/dashboard/tasks" className="text-sm text-primary hover:underline mt-2 inline-block shrink-0">View all tasks</Link>
          </CardContent>
        </Card>

        <Card size="sm" className="h-full flex flex-col min-h-0">
          <CardHeader className="pb-2 shrink-0">
            <CardTitle className="text-base">Quick links</CardTitle>
            <CardDescription>Jump to main sections</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col min-h-0 flex-1">
            <nav className="flex flex-col gap-1.5">
              <Link href="/dashboard/contacts/people" className="text-sm text-primary hover:underline flex items-center gap-2">
                <HugeiconsIcon icon={ContactIcon} className="size-4" strokeWidth={2} /> Contacts
              </Link>
              <Link href="/dashboard/deals/list" className="text-sm text-primary hover:underline flex items-center gap-2">
                <HugeiconsIcon icon={PipelineIcon} className="size-4" strokeWidth={2} /> Deals
              </Link>
              <Link href="/dashboard/tasks" className="text-sm text-primary hover:underline flex items-center gap-2">
                <HugeiconsIcon icon={Task01Icon} className="size-4" strokeWidth={2} /> Tasks
              </Link>
              <Link href="/dashboard/projects" className="text-sm text-primary hover:underline flex items-center gap-2">
                <HugeiconsIcon icon={Folder01Icon} className="size-4" strokeWidth={2} /> Projects
              </Link>
              <Link href="/dashboard/activities" className="text-sm text-primary hover:underline flex items-center gap-2">
                <HugeiconsIcon icon={Activity01Icon} className="size-4" strokeWidth={2} /> Activity
              </Link>
            </nav>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
