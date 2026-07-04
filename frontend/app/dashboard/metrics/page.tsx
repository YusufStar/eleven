"use client";

import { Bar, BarChart, CartesianGrid, XAxis, Line, LineChart } from "recharts";
import Link from "next/link";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { HugeiconsIcon } from "@hugeicons/react";
import { ChartLineData01Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import {
  useMetricsOverview,
  useTasksThroughput,
  useSprintVelocity,
  useCycleTime,
} from "@/services/metrics";

const throughputConfig = {
  count: { label: "Tasks completed", color: "var(--status-green)" },
} satisfies ChartConfig;

const velocityConfig = {
  committedPoints: { label: "Committed", color: "var(--status-neutral)" },
  completedPoints: { label: "Completed", color: "var(--brand)" },
} satisfies ChartConfig;

const cycleConfig = {
  days: { label: "Avg cycle (days)", color: "var(--status-orange)" },
} satisfies ChartConfig;

function KpiCard({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "blue" | "green" | "orange" | "red";
}) {
  const bar: Record<string, string> = {
    neutral: "bg-status-neutral",
    blue: "bg-status-blue",
    green: "bg-status-green",
    orange: "bg-status-orange",
    red: "bg-status-red",
  };
  return (
    <Card size="sm" className="relative overflow-hidden">
      <span className={`absolute inset-x-0 top-0 h-0.5 ${bar[tone]} opacity-70`} />
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function MetricsPage() {
  const overview = useMetricsOverview();
  const throughput = useTasksThroughput(8);
  const velocity = useSprintVelocity();
  const cycle = useCycleTime(8);

  const o = overview.data;
  const wowDelta =
    o && o.donePrevWeek > 0 ? Math.round(((o.doneThisWeek - o.donePrevWeek) / o.donePrevWeek) * 100) : null;

  return (
    <div className="container mx-auto space-y-6 py-2">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">Delivery health, velocity, and team load.</p>
        </div>
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link href="/dashboard/reports">
            <HugeiconsIcon icon={SparklesIcon} className="size-4 text-brand" strokeWidth={2} />
            AI Reports
          </Link>
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {overview.isPending || !o ? (
          [1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
        ) : (
          <>
            <KpiCard label="Open tasks" value={String(o.openTasks)} tone="blue" />
            <KpiCard
              label="Done this week"
              value={String(o.doneThisWeek)}
              sub={wowDelta != null ? `${wowDelta >= 0 ? "+" : ""}${wowDelta}% vs last week` : undefined}
              tone="green"
            />
            <KpiCard label="Blocked" value={String(o.blocked)} tone="red" />
            <KpiCard label="Overdue" value={String(o.overdue)} tone="orange" />
            <KpiCard
              label="Avg cycle time"
              value={o.avgCycleDays != null ? `${o.avgCycleDays}d` : "—"}
              sub={o.completionRate30d != null ? `${Math.round(o.completionRate30d * 100)}% completion (30d)` : undefined}
              tone="neutral"
            />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Throughput */}
        <Card size="sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <HugeiconsIcon icon={ChartLineData01Icon} className="size-4 text-status-green" strokeWidth={2} />
              Throughput
            </CardTitle>
            <CardDescription>Tasks completed per week (last 8 weeks)</CardDescription>
          </CardHeader>
          <CardContent>
            {throughput.isPending ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <ChartContainer config={throughputConfig} className="h-52 w-full">
                <BarChart data={throughput.data?.completedPerWeek ?? []} margin={{ left: 4, right: 4 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="week"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={11}
                    tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Sprint velocity */}
        <Card size="sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <HugeiconsIcon icon={ChartLineData01Icon} className="size-4 text-brand" strokeWidth={2} />
              Sprint velocity
            </CardTitle>
            <CardDescription>Committed vs completed story points</CardDescription>
          </CardHeader>
          <CardContent>
            {velocity.isPending ? (
              <Skeleton className="h-52 w-full" />
            ) : (velocity.data?.data ?? []).length === 0 ? (
              <p className="flex h-52 items-center justify-center text-sm text-muted-foreground">No sprints yet.</p>
            ) : (
              <ChartContainer config={velocityConfig} className="h-52 w-full">
                <BarChart data={velocity.data?.data ?? []} margin={{ left: 4, right: 4 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="committedPoints" fill="var(--color-committedPoints)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completedPoints" fill="var(--color-completedPoints)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Cycle time */}
        <Card size="sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <HugeiconsIcon icon={ChartLineData01Icon} className="size-4 text-status-orange" strokeWidth={2} />
              Cycle time
            </CardTitle>
            <CardDescription>Average days from create to done</CardDescription>
          </CardHeader>
          <CardContent>
            {cycle.isPending ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <ChartContainer config={cycleConfig} className="h-52 w-full">
                <LineChart data={cycle.data?.data ?? []} margin={{ left: 4, right: 4 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="week"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={11}
                    tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line dataKey="days" type="monotone" stroke="var(--color-days)" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Team load */}
        <Card size="sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Team load</CardTitle>
            <CardDescription>Open work per person</CardDescription>
          </CardHeader>
          <CardContent>
            {throughput.isPending ? (
              <Skeleton className="h-52 w-full" />
            ) : (throughput.data?.workload ?? []).length === 0 ? (
              <p className="flex h-52 items-center justify-center text-sm text-muted-foreground">No assigned tasks.</p>
            ) : (
              <ul className="space-y-2.5">
                {(throughput.data?.workload ?? []).slice(0, 8).map((w) => {
                  const open = w.todo + w.inProgress + w.inReview + w.blocked;
                  const total = open + w.done;
                  return (
                    <li key={w.memberId}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate font-medium">{w.name}</span>
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          {w.blocked > 0 && (
                            <StatusBadge domain="task" value="BLOCKED" size="sm" showIcon label={String(w.blocked)} noTooltip />
                          )}
                          <span className="tabular-nums">{open} open</span>
                        </span>
                      </div>
                      <div className="mt-1 flex h-2 overflow-hidden rounded-full bg-muted">
                        {total > 0 && (
                          <>
                            <span className="bg-status-neutral" style={{ width: `${(w.todo / total) * 100}%` }} />
                            <span className="bg-status-blue" style={{ width: `${(w.inProgress / total) * 100}%` }} />
                            <span className="bg-status-orange" style={{ width: `${(w.inReview / total) * 100}%` }} />
                            <span className="bg-status-red" style={{ width: `${(w.blocked / total) * 100}%` }} />
                            <span className="bg-status-green" style={{ width: `${(w.done / total) * 100}%` }} />
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
