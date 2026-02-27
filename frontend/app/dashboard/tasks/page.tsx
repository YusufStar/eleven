"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Xls01Icon, Csv01Icon } from "@hugeicons/core-free-icons";
import { TasksFilterBar, type TaskViewType } from "@/components/tasks/tasks-filter-bar";
import { TasksDataTableView } from "@/components/tasks/tasks-data-table-view";
import { TasksKanbanView } from "@/components/tasks/tasks-kanban-view";
import { TasksCalendarView } from "@/components/tasks/tasks-calendar-view";
import { AddTaskModal } from "@/components/tasks/add-task-modal";
import { useTasksList } from "@/services/tasks";
import { TASK_STATUSES, type TaskStatusValue } from "@/services/tasks/types";
import { authClient } from "@/lib/auth-client";
import { useTeamMembersList } from "@/services/team";
import { useDebouncedCallback } from "@/lib/use-debounced-callback";

const SEARCH_DEBOUNCE_MS = 400;

const VIEW_TYPES: TaskViewType[] = ["table", "kanban", "calendar"];

function parseTasksUrl(searchParams: URLSearchParams) {
  const projectId = searchParams.get("projectId") || null;
  const assigneeIdsRaw = searchParams.get("assigneeIds") || "";
  const assigneeIds = assigneeIdsRaw.trim() ? assigneeIdsRaw.split(",").map((id) => id.trim()).filter(Boolean) : [];
  const search = searchParams.get("search") || "";
  const statuses = searchParams.getAll("status").filter((s): s is TaskStatusValue =>
    TASK_STATUSES.includes(s as TaskStatusValue)
  );
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const view = searchParams.get("view") || "table";
  const viewType = VIEW_TYPES.includes(view as TaskViewType) ? (view as TaskViewType) : "table";
  return { projectId, assigneeIds, search, statuses, page, viewType };
}

export default function TasksPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { data: session } = authClient.useSession();
  const { data: teamData } = useTeamMembersList({ pageSize: 200 });
  const myMemberId = useMemo(() => {
    const list = teamData?.data ?? [];
    const uid = session?.user?.id;
    if (!uid) return null;
    return list.find((m) => m.userId === uid)?.id ?? null;
  }, [teamData?.data, session?.user?.id]);

  const fromUrl = useMemo(() => parseTasksUrl(searchParams), [searchParams]);
  const assigneeIds = fromUrl.assigneeIds.length > 0 ? fromUrl.assigneeIds : (myMemberId ? [myMemberId] : []);
  const projectId = fromUrl.projectId;
  const search = fromUrl.search;
  const statuses = fromUrl.statuses;
  const page = fromUrl.page;
  const viewType = fromUrl.viewType;

  const updateUrl = useCallback(
    (updates: {
      projectId?: string | null;
      assigneeIds?: string[];
      search?: string;
      statuses?: TaskStatusValue[];
      page?: number;
      viewType?: TaskViewType;
    }) => {
      const next = new URLSearchParams(searchParams.toString());
      if (updates.projectId !== undefined) {
        if (updates.projectId) next.set("projectId", updates.projectId);
        else next.delete("projectId");
      }
      if (updates.assigneeIds !== undefined) {
        if (updates.assigneeIds.length > 0) next.set("assigneeIds", updates.assigneeIds.join(","));
        else next.delete("assigneeIds");
      }
      if (updates.search !== undefined) {
        if (updates.search) next.set("search", updates.search);
        else next.delete("search");
      }
      if (updates.statuses !== undefined) {
        next.delete("status");
        updates.statuses.forEach((s) => next.append("status", s));
      }
      if (updates.page !== undefined) {
        if (updates.page > 1) next.set("page", String(updates.page));
        else next.delete("page");
      }
      if (updates.viewType !== undefined) {
        if (updates.viewType !== "table") next.set("view", updates.viewType);
        else next.delete("view");
      }
      const q = next.toString();
      router.replace(q ? `${pathname}?${q}` : pathname);
    },
    [pathname, router, searchParams]
  );

  const debouncedUpdateSearch = useDebouncedCallback(
    (v: string) => updateUrl({ search: v, page: 1 }),
    SEARCH_DEBOUNCE_MS
  );

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => {
    setSearchInput(fromUrl.search);
  }, [fromUrl.search]);

  const tableParams = {
    page,
    pageSize: 10,
    search: search || undefined,
    projectId: projectId || undefined,
    assigneeIds: assigneeIds.length > 0 ? assigneeIds : undefined,
    status: statuses.length > 0 ? statuses : undefined,
  };
  const kanbanParams = {
    all: true,
    search: search || undefined,
    projectId: projectId || undefined,
    assigneeIds: assigneeIds.length > 0 ? assigneeIds : undefined,
    status: statuses.length > 0 ? statuses : undefined,
  };
  const tableQuery = useTasksList(viewType === "table" ? tableParams : undefined);
  const fullListQuery = useTasksList(
    viewType === "kanban" || viewType === "calendar" ? kanbanParams : undefined
  );
  const tasks =
    viewType === "table"
      ? (tableQuery.data?.data ?? [])
      : (fullListQuery.data?.data ?? []);
  const total =
    viewType === "table" ? (tableQuery.data?.total ?? 0) : (fullListQuery.data?.total ?? 0);
  const isPending =
    viewType === "table" ? tableQuery.isPending : fullListQuery.isPending;

  return (
    <div className="container mx-auto py-2">
      <div className="mb-6 flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
        search={searchInput}
        onSearchChange={(v) => {
          setSearchInput(v);
          debouncedUpdateSearch(v);
        }}
        projectId={projectId}
        onProjectIdChange={(id) => updateUrl({ projectId: id, page: 1 })}
        assigneeIds={assigneeIds}
        onAssigneeIdsChange={(ids) => updateUrl({ assigneeIds: ids, page: 1 })}
        statuses={statuses}
        onStatusesChange={(s) => updateUrl({ statuses: s, page: 1 })}
        onClearFilters={() => {
          setSearchInput("");
          updateUrl({ projectId: null, assigneeIds: [], search: "", statuses: [], page: 1 });
        }}
        hasActiveFilters={
          !!search ||
          !!projectId ||
          statuses.length > 0 ||
          !(assigneeIds.length === 1 && assigneeIds[0] === myMemberId)
        }
        viewType={viewType}
        onViewTypeChange={(v) => updateUrl({ viewType: v })}
        className="mb-4 shrink-0"
      />
      {viewType === "table" && (
        <TasksDataTableView
          tasks={tasks}
          total={total}
          page={page}
          pageSize={10}
          isPending={isPending}
          onPageChange={(p) => updateUrl({ page: p })}
        />
      )}
      {viewType === "kanban" && (
        <TasksKanbanView
          tasks={tasks}
          isPending={isPending}
          currentUserMemberId={myMemberId}
        />
      )}
      {viewType === "calendar" && (
        <TasksCalendarView tasks={tasks} isPending={isPending} />
      )}
      <AddTaskModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        defaultProjectId={projectId}
      />
    </div>
  );
}
