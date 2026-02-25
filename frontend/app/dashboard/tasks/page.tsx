"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Xls01Icon, Csv01Icon } from "@hugeicons/core-free-icons";
import { TasksFilterBar } from "@/components/tasks/tasks-filter-bar";
import { useTasksList } from "@/services/tasks";
import type { TaskStatusValue } from "@/services/tasks/types";
import { authClient } from "@/lib/auth-client";
import { useTeamMembersList } from "@/services/team";

export default function TasksPage() {
  const searchParams = useSearchParams();
  const projectIdFromUrl = useMemo(
    () => searchParams.get("projectId") || null,
    [searchParams]
  );

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [projectId, setProjectId] = useState<string | null>(projectIdFromUrl);

  useEffect(() => {
    if (projectIdFromUrl) setProjectId(projectIdFromUrl);
  }, [projectIdFromUrl]);

  const { data: session } = authClient.useSession();
  const { data: teamData } = useTeamMembersList({ pageSize: 200 });
  const myMemberId = useMemo(() => {
    const list = teamData?.data ?? [];
    const uid = session?.user?.id;
    if (!uid) return null;
    return list.find((m) => m.userId === uid)?.id ?? null;
  }, [teamData?.data, session?.user?.id]);

  const hasSetDefaultAssignees = useRef(false);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  useEffect(() => {
    if (hasSetDefaultAssignees.current || myMemberId == null) return;
    hasSetDefaultAssignees.current = true;
    setAssigneeIds([myMemberId]);
  }, [myMemberId]);

  const [statuses, setStatuses] = useState<TaskStatusValue[]>([]);
  const [page, setPage] = useState(1);

  const params = {
    page,
    pageSize: 10,
    search: search || undefined,
    projectId: projectId || undefined,
    assigneeIds: assigneeIds.length > 0 ? assigneeIds : undefined,
    status: statuses.length > 0 ? statuses : undefined,
  };
  const { data, isPending } = useTasksList(params);
  const tasks = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Manage and track your tasks.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" title="Coming soon">
            <HugeiconsIcon icon={Xls01Icon} className="size-4" strokeWidth={2} />
            Import Excel
          </Button>
          <Button variant="outline" size="sm" className="gap-2" title="Coming soon">
            <HugeiconsIcon icon={Csv01Icon} className="size-4" strokeWidth={2} />
            Import CSV
          </Button>
          <Button className="gap-2" onClick={() => setAddModalOpen(true)}>
            <HugeiconsIcon icon={Add01Icon} className="size-4" strokeWidth={2} />
            Add task
          </Button>
        </div>
      </div>
      <TasksFilterBar
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        projectId={projectId}
        onProjectIdChange={(id) => {
          setProjectId(id);
          setPage(1);
        }}
        assigneeIds={assigneeIds}
        onAssigneeIdsChange={(ids) => {
          setAssigneeIds(ids);
          setPage(1);
        }}
        statuses={statuses}
        onStatusesChange={(s) => {
          setStatuses(s);
          setPage(1);
        }}
        className="mb-4"
      />
      {/* Task list / data table to be added; isPending, tasks, total, page, setPage */}
    </div>
  );
}
