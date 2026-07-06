"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { useProjectsList, useAddProjectFile } from "@/services/projects";
import { useOrgFiles } from "@/services/files";

// Join a base folder path with a new sub-folder name → normalized "/a/b" path.
function joinFolder(base: string, name: string): string {
  const clean = name.split("/").map((s) => s.trim()).filter(Boolean).join("/");
  if (!clean) return base || "/";
  const b = base && base !== "/" ? base : "";
  return `${b}/${clean}`;
}

function folderLabel(path: string): string {
  return path === "/" ? "Root" : path.replace(/^\//, "");
}

const NEW_FOLDER = "__new_folder__";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Spinner } from "@/components/ui/spinner";
import { HugeiconsIcon } from "@hugeicons/react";
import { File02Icon, Upload01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type ImportFileModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, project selector is hidden and this project is used (e.g. from card). */
  fixedProjectId?: string | null;
  /** Folder the upload should target by default (e.g. the folder currently being browsed). */
  defaultFolder?: string;
  /** Known folder paths for the project, so the user can pick an existing one. */
  folders?: string[];
  onSuccess?: () => void;
};

export function ImportFileModal({
  open,
  onOpenChange,
  fixedProjectId,
  defaultFolder,
  folders,
  onSuccess,
}: ImportFileModalProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [targetFolder, setTargetFolder] = useState<string>(defaultFolder || "/");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const previewUrlRef = useRef<string | null>(null);

  const { data: projectsData } = useProjectsList({ page: 1, pageSize: 200 });

  useEffect(() => {
    const isPreviewable = previewFile && (previewFile.type.startsWith("image/") || previewFile.type.startsWith("video/"));
    if (!previewFile || !isPreviewable) {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(previewFile);
    previewUrlRef.current = url;
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
      previewUrlRef.current = null;
      setPreviewUrl(null);
    };
  }, [previewFile]);
  const projects = projectsData?.data ?? [];
  const uploadProjectId = fixedProjectId ?? selectedProjectId;
  const addFile = useAddProjectFile(uploadProjectId ?? "");

  // When the caller doesn't pass a folder list, look it up for the chosen project.
  const { data: projFiles } = useOrgFiles(
    uploadProjectId && !folders ? { projectId: uploadProjectId, pageSize: 1 } : undefined
  );
  const folderOptions = Array.from(
    new Set<string>(["/", ...(defaultFolder ? [defaultFolder] : []), ...(folders ?? []), ...(projFiles?.folders?.map((f) => f.folder) ?? [])])
  ).sort((a, b) => (a === "/" ? -1 : b === "/" ? 1 : a.localeCompare(b)));

  // Reset folder selection each time the modal opens.
  useEffect(() => {
    if (open) {
      setTargetFolder(defaultFolder || "/");
      setCreatingFolder(false);
      setNewFolderName("");
    }
  }, [open, defaultFolder]);

  const effectiveFolder = creatingFolder ? joinFolder(defaultFolder || "/", newFolderName) : targetFolder;

  const handleClose = useCallback(
    (open: boolean) => {
      if (!open) {
        setPreviewFile(null);
        if (!fixedProjectId) setSelectedProjectId(null);
      }
      onOpenChange(open);
    },
    [fixedProjectId, onOpenChange]
  );

  const onDrop = useCallback((accepted: File[]) => {
    setPreviewFile(accepted[0] ?? null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    noClick: false,
    noKeyboard: false,
    disabled: addFile.isPending,
  });

  const handleUpload = useCallback(() => {
    if (!uploadProjectId || !previewFile) return;
    addFile.mutate(
      { file: previewFile, folder: effectiveFolder },
      {
        onSuccess: () => {
          onSuccess?.();
          setPreviewFile(null);
          if (!fixedProjectId) setSelectedProjectId(null);
          onOpenChange(false);
        },
        onError: (err) => toast.error(err.message ?? "Upload failed."),
      }
    );
  }, [uploadProjectId, previewFile, addFile, effectiveFolder, onSuccess, fixedProjectId, onOpenChange]);

  const clearPreview = useCallback(() => {
    setPreviewFile(null);
  }, []);

  const canUpload = Boolean(uploadProjectId && previewFile);
  const showProjectSelector = !fixedProjectId;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import file</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {showProjectSelector && (
            <div className="space-y-2">
              <Label>Project</Label>
              <Select
                value={selectedProjectId ?? ""}
                onValueChange={(v) => setSelectedProjectId(v || null)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {uploadProjectId && (
            <div className="space-y-2">
              <Label>Folder</Label>
              <Select
                value={creatingFolder ? NEW_FOLDER : targetFolder}
                onValueChange={(v) => {
                  if (v === NEW_FOLDER) {
                    setCreatingFolder(true);
                  } else {
                    setCreatingFolder(false);
                    setTargetFolder(v);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {folderOptions.map((f) => (
                    <SelectItem key={f} value={f}>
                      {folderLabel(f)}
                    </SelectItem>
                  ))}
                  <SelectItem value={NEW_FOLDER}>+ New folder…</SelectItem>
                </SelectContent>
              </Select>
              {creatingFolder && (
                <>
                  <Input
                    autoFocus
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Folder name"
                  />
                  <p className="text-xs text-muted-foreground">
                    Will upload to <span className="font-mono">{effectiveFolder}</span>
                    {defaultFolder && defaultFolder !== "/" && ` (inside ${folderLabel(defaultFolder)})`}
                  </p>
                </>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>File</Label>
            <div
              {...getRootProps()}
              className={cn(
                "cursor-pointer rounded-lg border border-dashed p-6 text-center transition-colors",
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50"
              )}
            >
              <input {...getInputProps()} />
              <p className="text-sm text-muted-foreground">
                {addFile.isPending
                  ? "Uploading..."
                  : isDragActive
                    ? "Drop file here..."
                    : "Drag and drop a file here, or click to select"}
              </p>
            </div>
          </div>

          {previewFile && (
            <div className="rounded-lg border bg-muted/30 overflow-hidden">
              {previewFile.type.startsWith("image/") && previewUrl && (
                <div className="relative aspect-video w-full bg-muted">
                  <img
                    src={previewUrl}
                    alt={previewFile.name}
                    className="h-full w-full object-contain"
                  />
                </div>
              )}
              {previewFile.type.startsWith("video/") && previewUrl && (
                <div className="relative aspect-video w-full bg-muted">
                  <video
                    src={previewUrl}
                    controls
                    className="h-full w-full object-contain"
                  />
                </div>
              )}
              <div className="flex items-center gap-3 p-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-background">
                  <HugeiconsIcon icon={File02Icon} className="size-5 text-muted-foreground" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{previewFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(previewFile.size)}
                    {previewFile.type && ` · ${previewFile.type}`}
                  </p>
                </div>
                <IconButton variant="ghost" onClick={clearPreview} label="Remove file">
                  <HugeiconsIcon icon={Cancel01Icon} className="size-4" strokeWidth={2} />
                </IconButton>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleClose(false)}>
              Cancel
            </Button>
            <Button
              disabled={!canUpload || addFile.isPending}
              onClick={handleUpload}
              className="gap-2"
            >
              {addFile.isPending ? (
                <Spinner className="size-4" />
              ) : (
                <HugeiconsIcon icon={Upload01Icon} className="size-4" strokeWidth={2} />
              )}
              Upload
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
