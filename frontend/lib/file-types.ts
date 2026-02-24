import {
  Folder01Icon,
  File02Icon,
  NoteIcon,
  Xls01Icon,
  Csv01Icon,
  LinkSquare01Icon,
} from "@hugeicons/core-free-icons";

export type FileTypeKind =
  | "folder"
  | "pdf"
  | "document"
  | "sheet"
  | "csv"
  | "image"
  | "video"
  | "audio"
  | "code"
  | "archive"
  | "default";

export type FileTypeConfig = {
  kind: FileTypeKind;
  icon: typeof Folder01Icon;
  bgClass: string;
  borderClass: string;
  label: string;
};

const CONFIGS: Record<FileTypeKind, Omit<FileTypeConfig, "kind">> = {
  folder: {
    icon: Folder01Icon,
    bgClass: "bg-amber-500/12",
    borderClass: "border-amber-500/30",
    label: "Folder",
  },
  pdf: {
    icon: File02Icon,
    bgClass: "bg-red-500/12",
    borderClass: "border-red-500/30",
    label: "PDF",
  },
  document: {
    icon: NoteIcon,
    bgClass: "bg-blue-500/12",
    borderClass: "border-blue-500/30",
    label: "Document",
  },
  sheet: {
    icon: Xls01Icon,
    bgClass: "bg-emerald-600/12",
    borderClass: "border-emerald-600/30",
    label: "Spreadsheet",
  },
  csv: {
    icon: Csv01Icon,
    bgClass: "bg-teal-500/12",
    borderClass: "border-teal-500/30",
    label: "CSV",
  },
  image: {
    icon: File02Icon,
    bgClass: "bg-violet-500/12",
    borderClass: "border-violet-500/30",
    label: "Image",
  },
  video: {
    icon: File02Icon,
    bgClass: "bg-rose-500/12",
    borderClass: "border-rose-500/30",
    label: "Video",
  },
  audio: {
    icon: File02Icon,
    bgClass: "bg-indigo-500/12",
    borderClass: "border-indigo-500/30",
    label: "Audio",
  },
  code: {
    icon: LinkSquare01Icon,
    bgClass: "bg-slate-600/12",
    borderClass: "border-slate-600/30",
    label: "Code",
  },
  archive: {
    icon: File02Icon,
    bgClass: "bg-orange-500/12",
    borderClass: "border-orange-500/30",
    label: "Archive",
  },
  default: {
    icon: File02Icon,
    bgClass: "bg-muted",
    borderClass: "border-border",
    label: "File",
  },
};

const EXT_TO_KIND: Record<string, FileTypeKind> = {
  // Documents
  pdf: "pdf",
  doc: "document",
  docx: "document",
  odt: "document",
  rtf: "document",
  txt: "document",
  // Sheets
  xls: "sheet",
  xlsx: "sheet",
  ods: "sheet",
  csv: "csv",
  // Images
  png: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  webp: "image",
  svg: "image",
  ico: "image",
  heic: "image",
  // Video
  mp4: "video",
  webm: "video",
  mov: "video",
  avi: "video",
  mkv: "video",
  // Audio
  mp3: "audio",
  wav: "audio",
  ogg: "audio",
  m4a: "audio",
  // Code
  js: "code",
  ts: "code",
  jsx: "code",
  tsx: "code",
  json: "code",
  html: "code",
  css: "code",
  scss: "code",
  py: "code",
  rb: "code",
  go: "code",
  rs: "code",
  md: "document",
  // Archive
  zip: "archive",
  rar: "archive",
  "7z": "archive",
  tar: "archive",
  gz: "archive",
};

const MIME_TO_KIND: Record<string, FileTypeKind> = {
  "application/pdf": "pdf",
  "application/msword": "document",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "document",
  "application/vnd.ms-excel": "sheet",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "sheet",
  "text/csv": "csv",
  "text/plain": "document",
  "image/png": "image",
  "image/jpeg": "image",
  "image/gif": "image",
  "image/webp": "image",
  "image/svg+xml": "image",
  "video/mp4": "video",
  "video/webm": "video",
  "video/quicktime": "video",
  "audio/mpeg": "audio",
  "audio/wav": "audio",
  "application/zip": "archive",
  "application/x-rar-compressed": "archive",
};

function extFromFileName(fileName: string): string {
  if (!fileName?.includes(".")) return "";
  return fileName.slice(fileName.lastIndexOf(".") + 1).toLowerCase();
}

export function getFileTypeKind(fileName: string, mime?: string | null): FileTypeKind {
  const ext = extFromFileName(fileName);
  if (mime && MIME_TO_KIND[mime]) return MIME_TO_KIND[mime];
  if (ext && EXT_TO_KIND[ext]) return EXT_TO_KIND[ext];
  return "default";
}

export function getFileTypeConfig(fileName: string, mime?: string | null): FileTypeConfig {
  const kind = getFileTypeKind(fileName, mime);
  const c = CONFIGS[kind];
  return { kind, ...c };
}

export function getFolderTypeConfig(): FileTypeConfig {
  const c = CONFIGS.folder;
  return { kind: "folder", ...c };
}
