import { Elysia } from "elysia";
import ExcelJS from "exceljs";
import { prisma } from "../db/prisma";
import { authPlugin } from "../plugins/auth.plugin";
import { logActivity } from "../lib/activity-log";
import { notifyOrganization } from "../lib/notify";
import { ActivityAction, ActivityEntityType, ContactStatus } from "../../prisma/generated/prisma/enums";

/**
 * Contact import: template download, upload+parse (preview only), commit.
 * Uploaded files never touch disk or object storage — parsed in memory, discarded.
 */

// ── security limits ─────────────────────────────
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_ROWS = 1000;
const MAX_CELL_LENGTH = 500;
const XLSX_MAGIC = [0x50, 0x4b, 0x03, 0x04]; // "PK\x03\x04" zip header
const BINARY_MAGICS = [
  [0xd0, 0xcf, 0x11, 0xe0], // legacy .xls / OLE — rejected
  [0x25, 0x50, 0x44, 0x46], // %PDF
  [0x7f, 0x45, 0x4c, 0x46], // ELF
  [0x4d, 0x5a], // MZ (exe)
  [0x1f, 0x8b], // gzip
  [0x89, 0x50, 0x4e, 0x47], // png
];

const HEADERS = ["firstName", "lastName", "email", "phone", "title", "status", "country", "city", "notes"] as const;
type Header = (typeof HEADERS)[number];
type RawRow = Record<Header, string>;

const VALID_STATUSES = Object.values(ContactStatus) as string[];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function hasMagic(bytes: Uint8Array, magic: number[]) {
  return magic.every((b, i) => bytes[i] === b);
}

/**
 * Neutralize spreadsheet formula injection: strip leading =, @ always,
 * and leading +/- unless they start a phone-like value (`+90 ...`).
 */
function sanitizeCell(value: string): string {
  let s = value.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "").trim();
  while (
    s &&
    (s[0] === "=" || s[0] === "@" || ((s[0] === "+" || s[0] === "-") && !/^[+-][\d\s(]/.test(s)))
  ) {
    s = s.slice(1).trimStart();
  }
  return s.slice(0, MAX_CELL_LENGTH);
}

/** Minimal RFC-4180 CSV parser (quotes, escaped quotes, CRLF). No eval, no regex backtracking. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f !== "")) rows.push(row);
      row = [];
      if (rows.length > MAX_ROWS + 1) throw new Error(`Too many rows (max ${MAX_ROWS})`);
    } else {
      field += c;
    }
  }
  row.push(field);
  if (row.some((f) => f !== "")) rows.push(row);
  return rows;
}

function mapHeaderRow(cells: string[]): (Header | null)[] {
  return cells.map((c) => {
    const key = c.trim().replace(/^﻿/, ""); // strip BOM
    return (HEADERS as readonly string[]).includes(key) ? (key as Header) : null;
  });
}

type ParsedRow = { index: number; data: RawRow; errors: string[] };

function validateRow(data: RawRow, index: number): ParsedRow {
  const errors: string[] = [];
  if (!data.firstName) errors.push("firstName is required");
  if (data.email && !EMAIL_RE.test(data.email)) errors.push("invalid email");
  if (data.phone && !/^[+\d\s()./-]{5,25}$/.test(data.phone)) errors.push("invalid phone");
  if (data.status && !VALID_STATUSES.includes(data.status.toUpperCase())) {
    errors.push(`status must be one of ${VALID_STATUSES.join(", ")}`);
  }
  return { index, data, errors };
}

function rowsFromMatrix(matrix: string[][]): { rows: ParsedRow[]; error?: string } {
  if (matrix.length === 0) return { rows: [], error: "File is empty" };
  const headerMap = mapHeaderRow(matrix[0]);
  if (!headerMap.includes("firstName")) {
    return { rows: [], error: "Header row not recognized — download the template and keep its column names" };
  }
  const dataRows = matrix.slice(1);
  if (dataRows.length === 0) return { rows: [], error: "No data rows found" };
  if (dataRows.length > MAX_ROWS) return { rows: [], error: `Too many rows (max ${MAX_ROWS})` };

  const rows = dataRows.map((cells, i) => {
    const data = Object.fromEntries(HEADERS.map((h) => [h, ""])) as RawRow;
    headerMap.forEach((header, col) => {
      if (header && cells[col] != null) data[header] = sanitizeCell(String(cells[col]));
    });
    return validateRow(data, i + 2); // 1-based + header row → matches what the user sees in Excel
  });
  return { rows };
}

async function parseUpload(file: File): Promise<{ rows: ParsedRow[]; error?: string }> {
  if (file.size === 0) return { rows: [], error: "File is empty" };
  if (file.size > MAX_FILE_BYTES) return { rows: [], error: "File is too large (max 5 MB)" };

  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  if (ext !== "csv" && ext !== "xlsx") return { rows: [], error: "Only .csv and .xlsx files are accepted" };

  const buffer = new Uint8Array(await file.arrayBuffer());

  // content sniffing — the extension must match what the bytes actually are
  const isZip = hasMagic(buffer, XLSX_MAGIC);
  if (BINARY_MAGICS.some((m) => hasMagic(buffer, m))) {
    return { rows: [], error: "Unsupported or unsafe file content" };
  }

  if (ext === "xlsx") {
    if (!isZip) return { rows: [], error: "File content does not match .xlsx format" };
    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(buffer.buffer as ArrayBuffer);
    } catch {
      return { rows: [], error: "Could not read the Excel file" };
    }
    const sheet = workbook.worksheets[0];
    if (!sheet) return { rows: [], error: "Workbook has no sheets" };
    if (sheet.rowCount > MAX_ROWS + 10) return { rows: [], error: `Too many rows (max ${MAX_ROWS})` };
    const matrix: string[][] = [];
    sheet.eachRow((row) => {
      const cells: string[] = [];
      row.eachCell({ includeEmpty: true }, (cell, col) => {
        if (col > 30) return; // column sanity cap
        const v = cell.value;
        // formulas are never evaluated — only their cached text is read, then sanitized
        const text =
          v == null
            ? ""
            : typeof v === "object" && "result" in (v as object)
              ? String((v as { result?: unknown }).result ?? "")
              : typeof v === "object" && "text" in (v as object)
                ? String((v as { text?: unknown }).text ?? "")
                : String(v);
        cells[col - 1] = text;
      });
      matrix.push(cells);
    });
    return rowsFromMatrix(matrix);
  }

  // csv: must be clean utf-8 text
  if (isZip) return { rows: [], error: "File content does not match .csv format" };
  if (buffer.includes(0)) return { rows: [], error: "File is not a text file" };
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return { rows: [], error: "File is not valid UTF-8 text" };
  }
  try {
    return rowsFromMatrix(parseCsv(text));
  } catch (e) {
    return { rows: [], error: e instanceof Error ? e.message : "Could not parse the CSV file" };
  }
}

const TEMPLATE_ROWS: string[][] = [
  [...HEADERS],
  ["Mara", "Lindqvist", "mara@northwind.com", "+46 70 123 45 67", "COO", "LEAD", "Sweden", "Stockholm", "Met at the fair"],
];

export const importsRoutes = new Elysia({ prefix: "/imports" })
  .use(authPlugin)
  .get(
    "/contacts/template",
    async ({ query, set }) => {
      if (query?.format === "xlsx") {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Contacts");
        TEMPLATE_ROWS.forEach((r) => sheet.addRow(r));
        sheet.getRow(1).font = { bold: true };
        sheet.columns.forEach((c) => (c.width = 20));
        const buf = await workbook.xlsx.writeBuffer();
        set.headers["content-type"] = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        set.headers["content-disposition"] = 'attachment; filename="eleven-contacts-template.xlsx"';
        return new Uint8Array(buf as ArrayBuffer);
      }
      const csv = TEMPLATE_ROWS.map((r) => r.map((c) => (/[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(",")).join("\n");
      set.headers["content-type"] = "text/csv; charset=utf-8";
      set.headers["content-disposition"] = 'attachment; filename="eleven-contacts-template.csv"';
      return csv;
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .post(
    "/contacts/parse",
    async ({ request, set }) => {
      const formData = await request.formData().catch(() => null);
      const file = formData?.get("file");
      if (!file || typeof file === "string") {
        set.status = 400;
        return { message: "No file uploaded" };
      }
      const { rows, error } = await parseUpload(file);
      if (error) {
        set.status = 422;
        return { message: error };
      }
      return {
        rows,
        total: rows.length,
        validCount: rows.filter((r) => r.errors.length === 0).length,
        invalidCount: rows.filter((r) => r.errors.length > 0).length,
      };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .post(
    "/contacts/commit",
    async ({ body, activeOrganizationId, activeMember, set }) => {
      const b = body as { rows?: unknown };
      if (!Array.isArray(b.rows) || b.rows.length === 0) {
        set.status = 400;
        return { message: "No rows to import" };
      }
      if (b.rows.length > MAX_ROWS) {
        set.status = 400;
        return { message: `Too many rows (max ${MAX_ROWS})` };
      }
      // never trust the preview payload — sanitize and validate everything again
      const validated = (b.rows as Record<string, unknown>[]).map((raw, i) => {
        const data = Object.fromEntries(
          HEADERS.map((h) => [h, sanitizeCell(String(raw?.[h] ?? ""))]),
        ) as RawRow;
        return validateRow(data, i + 1);
      });
      const good = validated.filter((r) => r.errors.length === 0);
      if (good.length === 0) {
        set.status = 422;
        return { message: "No valid rows to import", invalid: validated.filter((r) => r.errors.length > 0) };
      }
      const { count } = await prisma.contact.createMany({
        data: good.map(({ data }) => ({
          organizationId: activeOrganizationId!,
          type: "PERSON" as const,
          source: "CSV_IMPORT" as const,
          status: data.status ? (data.status.toUpperCase() as ContactStatus) : "LEAD",
          firstName: data.firstName,
          lastName: data.lastName || null,
          email: data.email || null,
          phone: data.phone || null,
          title: data.title || null,
          country: data.country || null,
          city: data.city || null,
          notes: data.notes || null,
          ownerId: activeMember!.id,
        })),
      });
      await logActivity({
        prisma,
        organizationId: activeOrganizationId!,
        memberId: activeMember!.id,
        action: ActivityAction.CREATE,
        entityType: ActivityEntityType.CONTACT,
        entityId: "bulk-import",
        entityTitle: `Imported ${count} contacts`,
      });
      await notifyOrganization({
        prisma,
        organizationId: activeOrganizationId!,
        actorId: activeMember!.id,
        type: "CONTACTS_IMPORTED",
        title: `${count} contacts imported`,
        body: null,
        link: "/dashboard/contacts/people",
      });
      return { imported: count, skipped: validated.length - good.length };
    },
    { requireAuth: true, requireActiveOrg: true }
  );
