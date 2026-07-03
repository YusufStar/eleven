"use client";

import { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Upload01Icon,
  Csv01Icon,
  Xls01Icon,
  Tick02Icon,
  Cancel01Icon,
  ArrowLeft02Icon,
  ArrowRight02Icon,
} from "@hugeicons/core-free-icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { importsApi, type ImportRow, type ParseResponse } from "@/services/imports";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const PAGE_SIZE = 10;
const ACCEPT = {
  "text/csv": [".csv"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
};

export function ImportContactsModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState<ParseResponse | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);

  const parse = useMutation({
    mutationFn: (file: File) => importsApi.parse(file),
    onSuccess: (res) => {
      setPreview(res);
      setSelected(new Set(res.rows.filter((r) => r.errors.length === 0).map((r) => r.index)));
      setPage(1);
    },
    onError: (e) => toast.error(e.message),
  });

  const commit = useMutation({
    mutationFn: (rows: ImportRow["data"][]) => importsApi.commit(rows),
    onSuccess: (res) => {
      toast.success(`${res.imported} contacts imported.`);
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      reset();
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const onDrop = useCallback(
    (accepted: File[]) => {
      const file = accepted[0];
      if (file) parse.mutate(file);
    },
    [parse],
  );

  const { getRootProps, getInputProps, isDragActive, open: openPicker, fileRejections } = useDropzone({
    onDrop,
    accept: ACCEPT,
    maxSize: MAX_FILE_BYTES,
    multiple: false,
    noClick: true,
  });

  const rejectionMessage = fileRejections[0]?.errors[0]?.code;

  const reset = () => {
    setPreview(null);
    setSelected(new Set());
    setPage(1);
    parse.reset();
  };

  const toggleRow = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const rows = preview?.rows ?? [];
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = useMemo(() => rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [rows, page]);
  const validOnPage = pageRows.filter((r) => r.errors.length === 0);
  const allPageSelected = validOnPage.length > 0 && validOnPage.every((r) => selected.has(r.index));

  const togglePage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) validOnPage.forEach((r) => next.delete(r.index));
      else validOnPage.forEach((r) => next.add(r.index));
      return next;
    });
  };

  const importSelected = () => {
    const data = rows.filter((r) => selected.has(r.index)).map((r) => r.data);
    if (data.length === 0) return;
    commit.mutate(data);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import contacts</DialogTitle>
          <DialogDescription>
            {preview
              ? "Review the parsed rows, then import the ones you want."
              : "Download the template, fill it in, and upload it as .csv or .xlsx (max 5 MB, 1000 rows)."}
          </DialogDescription>
        </DialogHeader>

        {!preview ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
              <div>
                <p className="text-sm font-medium">1 — Download the template</p>
                <p className="text-xs text-muted-foreground">Keep the column names exactly as they are.</p>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <a href={importsApi.templateUrl("csv")} download>
                    <HugeiconsIcon icon={Csv01Icon} className="size-4" strokeWidth={2} />
                    CSV
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <a href={importsApi.templateUrl("xlsx")} download>
                    <HugeiconsIcon icon={Xls01Icon} className="size-4" strokeWidth={2} />
                    Excel
                  </a>
                </Button>
              </div>
            </div>

            <div
              {...getRootProps()}
              className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-12 text-center transition-colors ${
                isDragActive ? "border-ring bg-muted/60" : "border-border"
              }`}
            >
              <input {...getInputProps()} />
              <HugeiconsIcon icon={Upload01Icon} className="size-8 text-muted-foreground" strokeWidth={1.5} />
              {parse.isPending ? (
                <p className="text-sm text-muted-foreground">Checking and parsing your file…</p>
              ) : (
                <>
                  <p className="text-sm font-medium">
                    {isDragActive ? "Drop it here" : "2 — Drop your file here"}
                  </p>
                  <p className="text-xs text-muted-foreground">.csv or .xlsx — contents are verified before anything is saved</p>
                  <Button variant="outline" size="sm" className="mt-1 rounded-full" onClick={openPicker} disabled={parse.isPending}>
                    Choose a file
                  </Button>
                </>
              )}
              {rejectionMessage && (
                <p className="text-xs text-destructive">
                  {rejectionMessage === "file-too-large"
                    ? "That file is over 5 MB."
                    : "Only .csv and .xlsx files are accepted."}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="font-medium">{preview.total} rows</span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <HugeiconsIcon icon={Tick02Icon} className="size-4" strokeWidth={2} />
                {preview.validCount} valid
              </span>
              {preview.invalidCount > 0 && (
                <span className="flex items-center gap-1.5 text-destructive">
                  <HugeiconsIcon icon={Cancel01Icon} className="size-4" strokeWidth={2} />
                  {preview.invalidCount} skipped (fix and re-upload to include)
                </span>
              )}
            </div>

            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allPageSelected}
                        onCheckedChange={togglePage}
                        aria-label="Select all valid rows on this page"
                      />
                    </TableHead>
                    <TableHead className="w-12">Row</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issues</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((r) => {
                    const invalid = r.errors.length > 0;
                    return (
                      <TableRow key={r.index} className={invalid ? "opacity-60" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={selected.has(r.index)}
                            onCheckedChange={() => toggleRow(r.index)}
                            disabled={invalid}
                            aria-label={`Select row ${r.index}`}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{r.index}</TableCell>
                        <TableCell className="max-w-40 truncate">
                          {[r.data.firstName, r.data.lastName].filter(Boolean).join(" ") || "—"}
                        </TableCell>
                        <TableCell className="max-w-48 truncate">{r.data.email || "—"}</TableCell>
                        <TableCell className="max-w-36 truncate">{r.data.phone || "—"}</TableCell>
                        <TableCell>{r.data.status || "LEAD"}</TableCell>
                        <TableCell className="max-w-48 truncate text-xs text-destructive">
                          {r.errors.join(", ")}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Page {page} of {pageCount}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <HugeiconsIcon icon={ArrowLeft02Icon} className="size-3.5" strokeWidth={2} />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  disabled={page >= pageCount}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <HugeiconsIcon icon={ArrowRight02Icon} className="size-3.5" strokeWidth={2} />
                </Button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {preview ? (
            <>
              <Button variant="ghost" onClick={reset} disabled={commit.isPending}>
                Upload another file
              </Button>
              <Button onClick={importSelected} disabled={selected.size === 0 || commit.isPending}>
                {commit.isPending ? "Importing…" : `Import ${selected.size} from list`}
              </Button>
            </>
          ) : (
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
