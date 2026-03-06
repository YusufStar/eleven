"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useDealDetailSuspense } from "@/services/deals";
import { TaskDetailModal } from "@/components/tasks/task-detail-modal";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  UserIcon,
  MoneyReceive01Icon,
  Task01Icon,
  Calendar03Icon,
  LinkSquare01Icon,
} from "@hugeicons/core-free-icons";
import type { DealDetailTask } from "@/services/deals";

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

export function DealDetailContent({ dealId }: { dealId: string }) {
  const { data, error } = useDealDetailSuspense(dealId);
  const [taskModalTaskId, setTaskModalTaskId] = useState<string | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  const timeline = useMemo(() => {
    if (!data?.tasks) return [];
    const items: { date: string; item: DealDetailTask }[] = [];
    for (const t of data.tasks) {
      const d = (t as DealDetailTask & { createdAt?: string }).completedAt ?? (t as DealDetailTask & { createdAt?: string }).dueAt ?? "";
      if (d) items.push({ date: d, item: t });
    }
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return items.slice(0, 30);
  }, [data?.tasks]);

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

  const deal = data;
  const contactLink = deal.contact ? `/dashboard/contacts/people/${deal.contact.id}` : null;

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
              {timeline.map(({ date, item }) => (
                <li key={item.id} className="flex gap-3 text-sm">
                  <span className="text-muted-foreground shrink-0 w-32">{formatDateTime(date)}</span>
                  <span className="shrink-0 text-amber-600">Task</span>
                  <span className="truncate">{(item as DealDetailTask).title}</span>
                  <button
                    type="button"
                    onClick={() => openTaskModal((item as DealDetailTask).id)}
                    className="text-primary hover:underline shrink-0"
                  >
                    Open
                  </button>
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
