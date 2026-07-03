const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

export interface ImportRow {
  index: number;
  data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    title: string;
    status: string;
    country: string;
    city: string;
    notes: string;
  };
  errors: string[];
}

export interface ParseResponse {
  rows: ImportRow[];
  total: number;
  validCount: number;
  invalidCount: number;
}

export const importsApi = {
  templateUrl: (format: "csv" | "xlsx") => `${BASE}/imports/contacts/template?format=${format}`,

  parse: async (file: File): Promise<ParseResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${BASE}/imports/contacts/parse`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error((err as { message?: string }).message ?? "Upload failed");
    }
    return res.json() as Promise<ParseResponse>;
  },

  commit: async (rows: ImportRow["data"][]): Promise<{ imported: number; skipped: number }> => {
    const res = await fetch(`${BASE}/imports/contacts/commit`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error((err as { message?: string }).message ?? "Import failed");
    }
    return res.json() as Promise<{ imported: number; skipped: number }>;
  },
};
