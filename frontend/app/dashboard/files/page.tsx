"use client";

import { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import type { Project } from "@/services/projects";
import { AddProjectModal } from "@/components/projects/add-project-modal";
import { ImportFileModal } from "@/components/files/import-file-modal";
import { ProjectsFinder } from "@/components/files/projects-finder";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Upload01Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";

export default function FilesPage() {
  const searchParams = useSearchParams();
  const projectIdFromUrl = searchParams.get("projectId");

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importModalFixedProjectId, setImportModalFixedProjectId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const openImportModal = useCallback((projectId?: string | null) => {
    setImportModalFixedProjectId(projectId ?? null);
    setImportModalOpen(true);
  }, []);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Files</h1>
          <p className="text-muted-foreground text-sm">Project files and documents.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => openImportModal(null)}>
            <HugeiconsIcon icon={Upload01Icon} className="size-4" strokeWidth={2} />
            Import file
          </Button>
        </div>
      </div>

      <div className="flex min-h-[420px] min-w-0 flex-1 flex-col overflow-hidden">
        <ProjectsFinder
          search={search}
          onSearchChange={setSearch}
          selectedId={selectedProject?.id ?? projectIdFromUrl ?? null}
          onSelect={setSelectedProject}
          onCreateClick={() => setAddModalOpen(true)}
          onImportFileClick={openImportModal}
          initialProjectIdFromUrl={projectIdFromUrl}
        />
      </div>

      <AddProjectModal open={addModalOpen} onOpenChange={setAddModalOpen} />
      <ImportFileModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        fixedProjectId={importModalFixedProjectId}
        onSuccess={() => toast.success("File uploaded.")}
      />
    </div>
  );
}
