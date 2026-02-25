"use client";

import { useEffect, useState } from "react";
import { useProjectsList, useProject, useProjectFiles, useAddProjectFile } from "@/services/projects";
import { projectsApi } from "@/services/projects/api";
import type { Project, ProjectFileRow, ProjectLinkItem } from "@/services/projects";
import { getFileTypeConfig, getFolderTypeConfig } from "@/lib/file-types";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  Folder01Icon,
  LinkSquare01Icon,
  Add01Icon,
  Upload01Icon,
  Download01Icon,
} from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null || bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type FileRowProps = {
  file: ProjectFileRow;
  isSelected: boolean;
  onSelect: (file: ProjectFileRow) => void;
};

function FileRow({ file, isSelected, onSelect }: FileRowProps) {
  const config = getFileTypeConfig(file.fileName, file.fileType);
  return (
    <button
      type="button"
      onClick={() => onSelect(file)}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors hover:bg-muted/50",
        config.bgClass,
        config.borderClass,
        isSelected && "ring-2 ring-primary/30"
      )}
    >
      <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-md border", config.borderClass, config.bgClass)}>
        <HugeiconsIcon icon={config.icon} className="size-5 text-foreground/80" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{file.fileName}</p>
        <p className="text-xs text-muted-foreground">
          {config.label} · {formatFileSize(file.fileSize)}
          {file.uploadedBy?.user?.name && ` · ${file.uploadedBy.user.name}`}
        </p>
      </div>
    </button>
  );
}

function FilePreviewSidebar({
  file,
  onClose,
}: {
  file: ProjectFileRow;
  onClose: () => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const config = getFileTypeConfig(file.fileName, file.fileType);
  const isImage = file.fileType?.startsWith("image/");
  const isVideo = file.fileType?.startsWith("video/");
  const createdAtFormatted = file.createdAt
    ? formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })
    : "—";

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const url = projectsApi.getFileDownloadUrl(file.projectId, file.id);
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = file.fileName;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex w-[320px] shrink-0 flex-col overflow-hidden border-l bg-background">
      <div className="shrink-0 border-b p-2 text-right">
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 px-2 text-xs">
          Close
        </Button>
      </div>
      <div className="flex flex-1 flex-col overflow-auto">
        {isImage && (
          <div className="relative aspect-video w-full shrink-0 bg-muted">
            <img
              src={file.fileUrl}
              alt={file.fileName}
              className="h-full w-full object-contain"
            />
          </div>
        )}
        {isVideo && (
          <div className="relative aspect-video w-full shrink-0 bg-muted">
            <video
              src={file.fileUrl}
              controls
              className="h-full w-full object-contain"
            />
          </div>
        )}
        {!isImage && !isVideo && (
          <div className="flex shrink-0 flex-col items-center justify-center gap-2 border-b bg-muted/30 p-6">
            <div className={cn("flex size-20 items-center justify-center rounded-xl border", config.borderClass, config.bgClass)}>
              <HugeiconsIcon icon={config.icon} className="size-10 text-foreground/80" strokeWidth={2} />
            </div>
            <p className="truncate text-center text-sm font-medium max-w-full">{file.fileName}</p>
          </div>
        )}
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="space-y-1">
            <p className="truncate text-sm font-medium">{file.fileName}</p>
            <p className="text-xs text-muted-foreground">{config.label}</p>
          </div>
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Size</dt>
              <dd className="font-mono text-xs">{formatFileSize(file.fileSize)}</dd>
            </div>
            {file.fileType && (
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Type</dt>
                <dd className="truncate text-xs">{file.fileType}</dd>
              </div>
            )}
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Uploaded</dt>
              <dd className="text-xs">{createdAtFormatted}</dd>
            </div>
            {file.uploadedBy?.user?.name && (
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">By</dt>
                <dd className="truncate text-xs">{file.uploadedBy.user.name}</dd>
              </div>
            )}
          </dl>
          <div className="mt-auto flex flex-col gap-2">
            <a
              href={file.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-xs font-medium hover:bg-muted"
            >
              <HugeiconsIcon icon={LinkSquare01Icon} className="size-4" strokeWidth={2} />
              Open in new tab
            </a>
            <Button
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center justify-center gap-2 bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              {downloading ? <Spinner className="size-4" /> : <HugeiconsIcon icon={Download01Icon} className="size-4" strokeWidth={2} />}
              Download
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

type ProjectPreviewProps = {
  projectId: string | null;
  onImportClick: (projectId: string) => void;
};

function ProjectPreview({ projectId, onImportClick }: ProjectPreviewProps) {
  const [selectedFile, setSelectedFile] = useState<ProjectFileRow | null>(null);
  const [fileSearch, setFileSearch] = useState("");
  const { data: project, isPending } = useProject(projectId);
  const { data: files = [], isPending: filesPending } = useProjectFiles(projectId, { search: fileSearch || undefined });
  const addFile = useAddProjectFile(projectId ?? "");

  useEffect(() => {
    setSelectedFile(null);
    setFileSearch("");
  }, [projectId]);

  if (!projectId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 rounded-r-lg border-l bg-muted/20 p-8 text-center">
        <div className="rounded-full border border-dashed border-muted-foreground/30 p-6">
          <HugeiconsIcon icon={Folder01Icon} className="size-10 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Select a project</p>
        <p className="text-xs text-muted-foreground">Choose a project from the list to view details and files.</p>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="flex h-full flex-1 items-center justify-center border-l bg-muted/10">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-full flex-1 items-center justify-center border-l text-sm text-muted-foreground">
        Project not found.
      </div>
    );
  }

  const links: ProjectLinkItem[] = Array.isArray(project.links) ? project.links.filter((l): l is ProjectLinkItem => Boolean(l?.title && l?.url)) : [];

  return (
    <div className="flex h-full min-w-0 flex-1">
      <div className="flex flex-1 flex-col overflow-hidden border-l bg-muted/10">
        <div className="shrink-0 space-y-3 border-b bg-background/80 p-4 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-semibold">{project.name}</h2>
              {project.slug && (
                <p className="font-mono text-xs text-muted-foreground">{project.slug}</p>
              )}
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={() => onImportClick(project.id)} disabled={addFile.isPending}>
              {addFile.isPending ? <Spinner className="size-4" /> : <HugeiconsIcon icon={Upload01Icon} className="size-4" strokeWidth={2} />}
              Import file
            </Button>
          </div>
          {project.description?.trim() && (
            <p className="line-clamp-2 text-sm text-muted-foreground">{project.description.trim()}</p>
          )}
          {links.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {links.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-1 text-xs hover:bg-muted"
                >
                  <HugeiconsIcon icon={LinkSquare01Icon} className="size-3.5" strokeWidth={2} />
                  {link.title}
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col overflow-hidden p-4">
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Files</h3>
            <div className="relative flex-1 min-w-0">
              <HugeiconsIcon
                icon={Search01Icon}
                className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                strokeWidth={2}
              />
              <Input
                placeholder="Search by name..."
                className="h-8 pl-7 text-xs"
                value={fileSearch}
                onChange={(e) => setFileSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            {filesPending ? (
              <div className="flex items-center justify-center py-6">
                <Spinner className="size-5" />
              </div>
            ) : files.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                {fileSearch ? "No files match." : "No files yet. Use \"Import file\" to add one."}
              </div>
            ) : (
              <div className="space-y-2">
                {files.map((file) => (
                  <FileRow
                    key={file.id}
                    file={file}
                    isSelected={selectedFile?.id === file.id}
                    onSelect={setSelectedFile}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {selectedFile && (
        <FilePreviewSidebar file={selectedFile} onClose={() => setSelectedFile(null)} />
      )}
    </div>
  );
}

export type ProjectsFinderProps = {
  search: string;
  onSearchChange: (value: string) => void;
  selectedId: string | null;
  onSelect: (project: Project | null) => void;
  onCreateClick: () => void;
  /** Called when "Import file" is clicked. From header: no arg. From card: projectId of selected project. */
  onImportFileClick: (projectId?: string | null) => void;
  initialProjectIdFromUrl?: string | null;
};

export function ProjectsFinder({
  search,
  onSearchChange,
  selectedId,
  onSelect,
  onCreateClick,
  onImportFileClick,
  initialProjectIdFromUrl,
}: ProjectsFinderProps) {
  const { data, isPending } = useProjectsList({ page: 1, pageSize: 200, search: search || undefined });
  const projects = data?.data ?? [];
  const folderConfig = getFolderTypeConfig();
  const { data: projectFromUrl } = useProject(initialProjectIdFromUrl ?? null);

  useEffect(() => {
    if (!initialProjectIdFromUrl) return;
    const inList = projects.find((p) => p.id === initialProjectIdFromUrl);
    if (inList) {
      onSelect(inList);
      return;
    }
    if (projectFromUrl) {
      onSelect(projectFromUrl as Project);
    }
  }, [initialProjectIdFromUrl, projects, projectFromUrl, onSelect]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-card">
      <div className="flex min-h-0 flex-1">
        <div className="flex w-[280px] shrink-0 flex-col border-r bg-muted/20">
          <div className="shrink-0 p-2">
            <div className="relative">
              <HugeiconsIcon
                icon={Search01Icon}
                className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                strokeWidth={2}
              />
              <Input
                placeholder="Search projects..."
                className="h-9 pl-8"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            {isPending ? (
              <div className="flex items-center justify-center p-6">
                <Spinner className="size-5" />
              </div>
            ) : projects.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {search ? "No projects match." : "No projects yet."}
              </div>
            ) : (
              <ul className="flex flex-col gap-2 p-1">
                {projects.map((project) => (
                  <li key={project.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(project)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg border px-2.5 py-2 text-left transition-colors",
                        selectedId === project.id
                          ? "border-amber-500/40 bg-amber-500/20 ring-1 ring-amber-500/50"
                          : "border-border bg-muted/50 hover:bg-muted"
                      )}
                    >
                      <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-md border", folderConfig.borderClass, folderConfig.bgClass)}>
                        <HugeiconsIcon icon={folderConfig.icon} className="size-5 text-foreground/80" strokeWidth={2} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{project.name}</p>
                        {project.updatedAt && (
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="shrink-0 border-t p-2">
            <Button variant="outline" className="w-full gap-2" size="sm" onClick={onCreateClick}>
              <HugeiconsIcon icon={Add01Icon} className="size-4" strokeWidth={2} />
              Create project
            </Button>
          </div>
        </div>
        <div className="flex min-w-0 flex-1">
          <ProjectPreview
            projectId={selectedId}
            onImportClick={(projectId) => onImportFileClick(projectId)}
          />
        </div>
      </div>
    </div>
  );
}
