"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  useContactPersonDetail,
  type ContactStatus,
} from "@/services/contacts";
import { TaskDetailModal } from "@/components/tasks/task-detail-modal";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { TaskPriorityBadge } from "@/components/tasks/task-priority-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  UserIcon,
  Building01Icon,
  NoteIcon,
  PipelineIcon,
  Task01Icon,
} from "@hugeicons/core-free-icons";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const statusLabels: Record<ContactStatus, string> = {
  LEAD: "Lead",
  PROSPECT: "Prospect",
  CUSTOMER: "Customer",
  CHURNED: "Churned",
  PARTNER: "Partner",
};

function formatDate(s: string | null | undefined) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return "—";
  }
}

function formatPersonName(first: string, last: string | null) {
  const f = (first ?? "").trim();
  const l = (last ?? "").trim();
  return l ? `${f} ${l}`.trim() : f || "—";
}

export function ContactPersonDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : null;
  const { data, isPending, error } = useContactPersonDetail(id);
  const [taskModalTaskId, setTaskModalTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) router.replace("/dashboard/contacts/people");
  }, [id, router]);

  if (error) {
    return (
      <div className="container mx-auto py-2">
        <Link href="/dashboard/contacts/people" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4">
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" strokeWidth={2} />
          Back to People
        </Link>
        <p className="text-destructive">Failed to load contact.</p>
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

  const { contact, company, deals, tasks } = data;
  const name = formatPersonName(contact.firstName, contact.lastName);

  return (
    <div className="container mx-auto py-2 space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/dashboard/contacts/people"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" strokeWidth={2} />
          Back to People
        </Link>
      </div>

      <div className="flex flex-wrap items-start gap-4">
        {contact.avatar ? (
          <span className="relative block h-16 w-16 shrink-0 overflow-hidden rounded-xl">
            <Image src={contact.avatar} alt="" fill className="object-cover" />
          </span>
        ) : null}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
          <p className={cn("text-sm font-medium text-muted-foreground mt-0.5")}>
            {statusLabels[contact.status as ContactStatus] ?? contact.status}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HugeiconsIcon icon={UserIcon} className="size-4" strokeWidth={2} />
              Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {contact.email && (
              <p>
                <span className="text-muted-foreground">Email:</span>{" "}
                <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                  {contact.email}
                </a>
              </p>
            )}
            {contact.phone && (
              <p>
                <span className="text-muted-foreground">Phone:</span> {contact.phone}
              </p>
            )}
            {contact.title && (
              <p>
                <span className="text-muted-foreground">Title:</span> {contact.title}
              </p>
            )}
            {(contact.country || contact.city || contact.address) && (
              <p>
                <span className="text-muted-foreground">Address:</span>{" "}
                {[contact.city, contact.country, contact.address].filter(Boolean).join(", ")}
              </p>
            )}
            {!contact.email && !contact.phone && !contact.title && !contact.country && !contact.city && !contact.address && (
              <p className="text-muted-foreground">No info added.</p>
            )}
          </CardContent>
        </Card>

        {company && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <HugeiconsIcon icon={Building01Icon} className="size-4" strokeWidth={2} />
                Company
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/dashboard/contacts/companies/${company.id}`}
                className="font-medium text-primary hover:underline"
              >
                {company.companyName ?? "—"}
              </Link>
              {company.industry && (
                <p className="text-sm text-muted-foreground mt-1">{company.industry}</p>
              )}
              {company.website && (
                <a
                  href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline block mt-1"
                >
                  {company.website}
                </a>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HugeiconsIcon icon={PipelineIcon} className="size-4" strokeWidth={2} />
            Deals ({deals.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No deals linked.</p>
          ) : (
            <ul className="space-y-2">
              {deals.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/dashboard/deals/list?contactId=${contact.id}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {d.title}
                  </Link>
                  <span className="text-muted-foreground text-sm ml-2">
                    {d.value != null ? `${d.value} ${d.currency}` : ""} · {d.stage?.name ?? ""}
                  </span>
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
            Tasks ({tasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks linked.</p>
          ) : (
            <ul className="space-y-2">
              {tasks.map((t) => (
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

      {contact.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HugeiconsIcon icon={NoteIcon} className="size-4" strokeWidth={2} />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{contact.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
