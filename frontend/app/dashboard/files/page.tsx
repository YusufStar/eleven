"use client";

import * as React from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ImportFileModal } from "@/components/files/import-file-modal";
import { HugeiconsIcon } from "@hugeicons/react";
import { Upload01Icon, Delete02Icon, Folder01Icon, EyeIcon, Clock01Icon, Download01Icon } from "@hugeicons/core-free-icons";
import { getFileTypeConfig } from "@/lib/file-types";
import { initials } from "@/lib/string";
import { useDebouncedCallback } from "@/lib/use-debounced-callback";
import { useOrgFiles, useRecentFiles, type OrgFileRow } from "@/services/files";
import { projectsApi, useProjectsList, useDeleteProjectFile } from "@/services/projects";

function fmtSize(bytes: number | null): string {
  if (!bytes) return "—";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

function fmtDate(s: string): string {
  return new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function PreviewDialog({ file, onClose }: { file: OrgFileRow | null; onClose: () => void }) {
  const type = file?.fileType ?? "";
  return (
    <Dialog open={!!file} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl!">
        <DialogHeader>
          <DialogTitle className="truncate pr-6">{file?.fileName}</DialogTitle>
          <DialogDescription>
            {file?.project.name} · {fmtSize(file?.fileSize ?? null)}
          </DialogDescription>
        </DialogHeader>
        {file && (
          <div className="max-h-[70vh] overflow-auto">
            {type.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={file.fileUrl} alt={file.fileName} className="mx-auto max-h-[65vh] rounded-lg object-contain" />
            ) : type.startsWith("video/") ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video src={file.fileUrl} controls className="mx-auto max-h-[65vh] w-full rounded-lg" />
            ) : type.startsWith("audio/") ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <audio src={file.fileUrl} controls className="w-full" />
            ) : type === "application/pdf" ? (
              <iframe src={file.fileUrl} title={file.fileName} className="h-[65vh] w-full rounded-lg border" />
            ) : (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <p className="text-sm text-muted-foreground">No inline preview for this file type.</p>
                <Button asChild size="sm">
                  <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">
                    Open in new tab
                  </a>
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function VersionsDialog({ file, onClose }: { file: OrgFileRow | null; onClose: () => void }) {
  const versions = file?.versionHistory ?? [];
  return (
    <Dialog open={!!file} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="truncate pr-6">Version history</DialogTitle>
          <DialogDescription>{file?.fileName}</DialogDescription>
        </DialogHeader>
        <ul className="space-y-2">
          <li className="flex items-center justify-between gap-2 rounded-lg border border-brand/30 bg-brand/5 px-3 py-2 text-sm">
            <span className="font-medium">Current</span>
            <span className="text-xs text-muted-foreground">{file ? fmtDate(file.updatedAt) : ""}</span>
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
              <a href={file?.fileUrl} target="_blank" rel="noopener noreferrer">
                Open
              </a>
            </Button>
          </li>
          {[...versions].reverse().map((v, i) => (
            <li key={i} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
              <span>v{versions.length - i}</span>
              <span className="text-xs text-muted-foreground">
                {fmtDate(v.uploadedAt)} · {fmtSize(v.fileSize)}
              </span>
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                <a href={v.fileUrl} target="_blank" rel="noopener noreferrer">
                  Open
                </a>
              </Button>
            </li>
          ))}
          {versions.length === 0 && (
            <li className="py-2 text-center text-sm text-muted-foreground">
              No previous versions. Upload a file with the same name into the same folder to create one.
            </li>
          )}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

function DeleteFileButton({ file }: { file: OrgFileRow }) {
  const del = useDeleteProjectFile(file.projectId);
  return (
    <IconButton
      variant="ghost"
      className="size-7 text-muted-foreground hover:text-destructive"
      label="Delete file"
      onClick={() => {
        if (!confirm(`Delete "${file.fileName}"?`)) return;
        del.mutate(file.id, {
          onSuccess: () => toast.success("File deleted."),
          onError: (e) => toast.error(e.message),
        });
      }}
    >
      <HugeiconsIcon icon={Delete02Icon} className="size-4" strokeWidth={2} />
    </IconButton>
  );
}

export default function FilesPage() {
  const [importModalOpen, setImportModalOpen] = React.useState(false);
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const debouncedSetSearch = useDebouncedCallback((v: string) => setSearch(v), 350);
  const [projectId, setProjectId] = React.useState<string | null>(null);
  const [folder, setFolder] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [preview, setPreview] = React.useState<OrgFileRow | null>(null);
  const [versionsOf, setVersionsOf] = React.useState<OrgFileRow | null>(null);

  const { data, isPending } = useOrgFiles({
    search: search || undefined,
    projectId,
    folder,
    page,
    pageSize: 25,
  });
  const { data: recent } = useRecentFiles();
  const { data: projectsData } = useProjectsList({ pageSize: 100 });

  const files = data?.data ?? [];
  const folders = data?.folders ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / 25));

  return (
    <div className="container mx-auto space-y-6 py-2">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Files</h1>
          <p className="text-sm text-muted-foreground">Every file across your projects, searchable in one place.</p>
        </div>
        <Button className="gap-2" onClick={() => setImportModalOpen(true)}>
          <HugeiconsIcon icon={Upload01Icon} className="size-4" strokeWidth={2} />
          Upload file
        </Button>
      </div>

      {/* Recent files */}
      {(recent?.data ?? []).length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Recent</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {recent!.data.map((f) => {
              const cfg = getFileTypeConfig(f.fileName, f.fileType);
              return (
                <Card
                  key={f.id}
                  size="sm"
                  className="cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  onClick={() => setPreview(f)}
                >
                  <CardContent className="flex flex-col items-center gap-1.5 p-3 text-center">
                    <span className={`rounded-lg p-2 ${cfg.bgClass}`}>
                      <HugeiconsIcon icon={cfg.icon} className="size-5" strokeWidth={2} />
                    </span>
                    <span className="w-full truncate text-xs font-medium">{f.fileName}</span>
                    <span className="text-[10px] text-muted-foreground">{f.project.name}</span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            debouncedSetSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search files…"
          className="w-56"
        />
        <Select
          value={projectId ?? "all"}
          onValueChange={(v) => {
            setProjectId(v === "all" ? null : v);
            setFolder(null);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48" size="sm">
            <SelectValue placeholder="All projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {(projectsData?.data ?? []).map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {folders.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFolder(null)}
              className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                folder == null ? "border-brand/40 bg-brand/10 text-brand" : "hover:bg-muted"
              }`}
            >
              All folders
            </button>
            {folders.map((f) => (
              <button
                key={f.folder}
                type="button"
                onClick={() => {
                  setFolder(f.folder === folder ? null : f.folder);
                  setPage(1);
                }}
                className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                  folder === f.folder ? "border-brand/40 bg-brand/10 text-brand" : "hover:bg-muted"
                }`}
              >
                <HugeiconsIcon icon={Folder01Icon} className="size-3" strokeWidth={2} />
                {f.folder} ({f.count})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Folder</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Uploaded by</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : files.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                  No files found. Upload your first file or join a project to see its files here.
                </TableCell>
              </TableRow>
            ) : (
              files.map((f) => {
                const cfg = getFileTypeConfig(f.fileName, f.fileType);
                const versionCount = f.versionHistory?.length ?? 0;
                return (
                  <TableRow key={f.id} className="group">
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => setPreview(f)}
                        className="flex min-w-0 max-w-72 items-center gap-2 text-left hover:underline"
                      >
                        <HugeiconsIcon icon={cfg.icon} className="size-4 shrink-0" strokeWidth={2} />
                        <span className="truncate text-sm font-medium">{f.fileName}</span>
                        {versionCount > 0 && (
                          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                            v{versionCount + 1}
                          </Badge>
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{f.project.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{f.folder}</TableCell>
                    <TableCell className="text-sm tabular-nums text-muted-foreground">{fmtSize(f.fileSize)}</TableCell>
                    <TableCell>
                      {f.uploadedBy ? (
                        <span className="flex items-center gap-1.5 text-sm">
                          <Avatar className="size-5">
                            <AvatarImage src={f.uploadedBy.user.image ?? undefined} alt="" />
                            <AvatarFallback className="text-[9px]">{initials(f.uploadedBy.user.name)}</AvatarFallback>
                          </Avatar>
                          <span className="truncate text-muted-foreground">{f.uploadedBy.user.name}</span>
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{fmtDate(f.updatedAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <IconButton
                          variant="ghost"
                          className="size-7"
                          label="Preview"
                          onClick={() => setPreview(f)}
                        >
                          <HugeiconsIcon icon={EyeIcon} className="size-4" strokeWidth={2} />
                        </IconButton>
                        <Button variant="ghost" size="icon" className="size-7" aria-label="Download" asChild>
                          <a href={projectsApi.getFileDownloadUrl(f.projectId, f.id)}>
                            <HugeiconsIcon icon={Download01Icon} className="size-4" strokeWidth={2} />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          aria-label="Version history"
                          onClick={() => setVersionsOf(f)}
                        >
                          <HugeiconsIcon icon={Clock01Icon} className="size-4" strokeWidth={2} />
                        </Button>
                        <DeleteFileButton file={f} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm tabular-nums text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}

      <ImportFileModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        fixedProjectId={projectId}
        onSuccess={() => toast.success("File uploaded.")}
      />
      <PreviewDialog file={preview} onClose={() => setPreview(null)} />
      <VersionsDialog file={versionsOf} onClose={() => setVersionsOf(null)} />
    </div>
  );
}
