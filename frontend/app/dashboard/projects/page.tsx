"use client";

import { useState, useCallback } from "react";
import { useProjectsList } from "@/services/projects";
import { ProjectsDataTable } from "@/components/projects/data-table";
import { projectsColumns } from "@/components/projects/columns";
import { AddProjectModal } from "@/components/projects/add-project-modal";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Xls01Icon, Csv01Icon } from "@hugeicons/core-free-icons";

export default function ProjectsPage() {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const pageSize = 10;
  const params = { page, pageSize, search: search || undefined };
  const { data, isPending, isFetching } = useProjectsList(params);
  const projects = data?.data ?? [];
  const total = data?.total ?? 0;
  const onPageChange = useCallback((p: number) => setPage(p), []);
  const onSearchChange = useCallback((v: string) => {
    setSearch(v);
    setPage(1);
  }, []);

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-muted-foreground text-sm">
            Projects you are a member of.
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
            Create project
          </Button>
        </div>
      </div>
      <AddProjectModal open={addModalOpen} onOpenChange={setAddModalOpen} />
      <ProjectsDataTable
        columns={projectsColumns}
        data={projects}
        loading={isPending}
        fetching={isFetching && !isPending}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        search={search}
        onSearchChange={onSearchChange}
      />
    </div>
  );
}
