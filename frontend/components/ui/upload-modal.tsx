"use client"

import { useCallback } from "react"
import { useDropzone, type Accept, type FileRejection } from "react-dropzone"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useUploadImageMutation } from "@/services/upload"

export type UploadModalProps = {
  isAvatar?: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  onDrop?: (acceptedFiles: File[], rejectedFiles: FileRejection[], url?: string) => void
  accept?: Accept
  maxFiles?: number
  maxSize?: number
  className?: string
}

export function UploadModal({
  isAvatar = false,
  open,
  onOpenChange,
  title,
  onDrop,
  accept,
  maxFiles = 1,
  maxSize = 10 * 1024 * 1024,
  className,
}: UploadModalProps) {
  const { mutateAsync: uploadImage, isPending } = useUploadImageMutation()

  const onDropCallback = useCallback(
    async (accepted: File[], rejected: FileRejection[]) => {
      const file = accepted[0]
      if (file) {
        try {
          const response = await uploadImage({ file, isAvatar })
          onDrop?.(accepted, rejected, response.url)
          onOpenChange(false)
        } catch {
          // error handled by mutation
        }
      } else {
        onDrop?.(accepted, rejected)
        if (rejected.length > 0) onOpenChange(false)
      }
    },
    [onDrop, onOpenChange, uploadImage, isAvatar]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropCallback,
    accept,
    maxFiles,
    maxSize,
    noClick: false,
    noKeyboard: false,
    disabled: isPending,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("sm:max-w-md", className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div
          {...getRootProps()}
          className={cn(
            "border rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50"
          )}
        >
          <input {...getInputProps()} />
          <p className="text-sm text-muted-foreground">
            {isPending
              ? "Uploading..."
              : isDragActive
                ? "Drop files here..."
                : "Drag and drop files here, or click to select"}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
