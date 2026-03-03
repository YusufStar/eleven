"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useDealDetail } from "@/services/deals";
import { TaskDetailModal } from "@/components/tasks/task-detail-modal";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  UserIcon,
  MoneyReceive01Icon,
  PipelineIcon,
  ActivityIcon,
  Task01Icon,
  Calendar03Icon,
  LinkSquare01Icon,
} from "@hugeicons/core-free-icons";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { DealDetailActivity, DealDetailTask } from "@/services/deals";

function formatValue(value: string | null, currency: string) {
  if (value == null || value === "") return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(s: string | null | undefined) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return "—";
  }
}

function formatDateTime(s: string | null | undefined) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "—";
  }
}

function contactName(deal: { contact: { firstName?: string; lastName?: string | null; companyName?: string | null } | null }) {
  const c = deal.contact;
  if (!c) return null;
  const name = [c.firstName, c.lastName].filter(Boolean).join(" ").trim();
  return name || c.companyName || null;
}

export function DealDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : null;
  const { data, isPending, error } = useDealDetail(id);
  const [taskModalTaskId, setTaskModalTaskId] = useState<string | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  useEffect(() => {
    if (!id) router.replace("/dashboard/deals");
  }, [id, router]);

  const openTaskModal = (taskId: string) => {
    setTaskModalTaskId(taskId);
    setTaskModalOpen(true);
  };

  if (error) {
    return (
      <div className="container mx-auto py-2">
        <Link href="/dashboard/deals" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4">
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" strokeWidth={2} />
          Back to Deals
        </Link>
        <p className="text-destructive">Failed to load deal.</p>
      </div>
    );
  }

  if (!id) return null;

  if (isPending || !data) {
    return (
      <div className="container mx-auto py-2 space-y-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const deal = data;
  const contactLink = deal.contact ? `/dashboard/contacts/people/${deal.contact.id}` : null;
  const timeline = useMemo(() => {
    const items: { date: string; type: "activity" | "task"; item: DealDetailActivity | DealDetailTask }[] = [];
    for (const a of deal.activities) {
      const d = a.completedAt ?? a.createdAt ?? a.dueAt ?? "";
      if (d) items.push({ date: d, type: "activity", item: a });
    }
    for (const t of deal.tasks) {
      const d = (t as DealDetailTask & { createdAt?: string }).completedAt ?? (t as DealDetailTask & { createdAt?: string }).dueAt ?? "";
      if (d) items.push({ date: d, type: "task", item: t });
    }
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return items.slice(0, 30);
  }, [deal.activities, deal.tasks]);

  return (
    <div className="container mx-auto py-2 space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/dashboard/deals" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" strokeWidth={2} />
          Back to Deals
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{deal.title?.trim() || "Untitled deal"}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {deal.stage?.name ?? "—"} · {deal.pipeline?.name ?? "—"}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HugeiconsIcon icon={MoneyReceive01Icon} className="size-4" strokeWidth={2} />
              Value & stage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-lg font-semibold">{formatValue(deal.value, deal.currency)}</p>
            <p className="text-sm text-muted-foreground">
              Stage: <span className="font-medium text-foreground">{deal.stage?.name ?? "—"}</span>
              {deal.probability != null && ` · ${deal.probability}%`}
            </p>
            {deal.expectedClose && (
              <p className="text-sm text-muted-foreground">
                Expected close: {formatDate(deal.expectedClose)}
              </p>
            )}
            <p className="text-sm text-muted-foreground">Status: {deal.status}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HugeiconsIcon icon={UserIcon} className="size-4" strokeWidth={2} />
              Contact & owner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {contactLink ? (
              <Link href={contactLink} className="text-primary hover:underline font-medium inline-flex items-center gap-1">
                <HugeiconsIcon icon={LinkSquare01Icon} className="size-4" />
                {contactName(deal) ?? "Contact"}
              </Link>
            ) : (
              <p className="text-muted-foreground">No contact linked</p>
            )}
            {deal.owner?.user?.name && (
              <p className="text-sm text-muted-foreground">Owner: {deal.owner.user.name}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HugeiconsIcon icon={ActivityIcon} className="size-4" strokeWidth={2} />
              Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deal.activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activities yet.</p>
            ) : (
              <ul className="space-y-2">
                {deal.activities.slice(0, 15).map((a) => (
                  <li key={a.id} className="flex justify-between gap-2 text-sm border-b border-border/60 pb-2 last:border-0">
                    <span className="font-medium truncate">{a.title}</span>
                    <span className="text-muted-foreground shrink-0">{formatDateTime(a.createdAt)}</span>
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
              Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deal.tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks yet.</p>
            ) : (
              <ul className="space-y-2">
                {deal.tasks.slice(0, 15).map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => openTaskModal(t.id)}
                      className="w-full text-left flex items-center justify-between gap-2 rounded-lg border p-2 hover:bg-muted/50 text-sm"
                    >
                      <span className="font-medium truncate">{t.title}</span>
                      <span className="flex items-center gap-1 shrink-0">
                        <TaskStatusBadge status={t.status} />
                        <TaskPriorityBadge priority={t.priority} />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {timeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HugeiconsIcon icon={Calendar03Icon} className="size-4" strokeWidth={2} />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {timeline.map(({ date, type, item }) => (
                <li key={`${type}-${item.id}`} className="flex gap-3 text-sm">
                  <span className="text-muted-foreground shrink-0 w-32">{formatDateTime(date)}</span>
                  <span className={cn("shrink-0", type === "activity" ? "text-blue-600" : "text-amber-600")}>
                    {type === "activity" ? "Activity" : "Task"}
                  </span>
                  <span className="truncate">
                    {type === "activity"
                      ? (item as DealDetailActivity).title
                      : (item as DealDetailTask).title}
                  </span>
                  {type === "task" && (
                    <button
                      type="button"
                      onClick={() => openTaskModal((item as DealDetailTask).id)}
                      className="text-primary hover:underline shrink-0"
                    >
                      Open
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <TaskDetailModal
        taskId={taskModalTaskId}
        open={taskModalOpen}
        onOpenChange={setTaskModalOpen}
      />
    </div>
  );
}
