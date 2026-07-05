/** Structured dashboard payload returned by the submit_report tool. */
export type ReportDashboard = {
  kpis: Array<{
    id: string;
    label: string;
    value: string | number;
    tone?: "neutral" | "blue" | "green" | "orange" | "red";
    sub?: string;
  }>;
  charts: Array<{
    id: string;
    type: "bar" | "line" | "pie";
    title: string;
    description?: string;
    xKey?: string;
    data: Array<Record<string, string | number>>;
    series: Array<{ key: string; label: string; color?: string }>;
  }>;
  highlights: Array<{ id: string; title: string; body: string; severity?: "info" | "warning" | "critical" }>;
  risks: Array<{ id: string; title: string; body: string }>;
};

export type ReportActionInput = {
  id: string;
  type: "CREATE_TASK" | "UPDATE_TASK_STATUS" | "UPDATE_TASK_PRIORITY" | "REASSIGN_TASK" | "ADD_TASK_COMMENT";
  title: string;
  description: string;
  payload: Record<string, unknown>;
};

export type SubmitReportInput = {
  title?: string;
  summary: string;
  sections: Array<{ title: string; body: string }>;
  dashboard: ReportDashboard;
  actions: ReportActionInput[];
};

const ACTION_TYPES = new Set([
  "CREATE_TASK",
  "UPDATE_TASK_STATUS",
  "UPDATE_TASK_PRIORITY",
  "REASSIGN_TASK",
  "ADD_TASK_COMMENT",
]);

export function parseSubmitReport(raw: unknown): SubmitReportInput | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.summary !== "string" || !Array.isArray(o.sections) || !o.dashboard) return null;

  const sections = o.sections
    .filter((s): s is { title: string; body: string } =>
      !!s && typeof s === "object" && typeof (s as { title?: unknown }).title === "string" && typeof (s as { body?: unknown }).body === "string",
    )
    .map((s) => ({ title: s.title.trim(), body: s.body.trim() }));

  const dashboard = o.dashboard as ReportDashboard;
  if (!Array.isArray(dashboard.kpis) || !Array.isArray(dashboard.charts)) return null;

  const actions = Array.isArray(o.actions)
    ? o.actions.filter((a): a is ReportActionInput => {
        if (!a || typeof a !== "object") return false;
        const act = a as ReportActionInput;
        return (
          typeof act.id === "string" &&
          typeof act.title === "string" &&
          typeof act.description === "string" &&
          ACTION_TYPES.has(act.type) &&
          act.payload != null &&
          typeof act.payload === "object"
        );
      })
    : [];

  return {
    title: typeof o.title === "string" ? o.title.trim() : undefined,
    summary: o.summary.trim(),
    sections,
    dashboard: {
      kpis: dashboard.kpis ?? [],
      charts: dashboard.charts ?? [],
      highlights: dashboard.highlights ?? [],
      risks: dashboard.risks ?? [],
    },
    actions,
  };
}

export function reportMarkdownFromSubmit(input: SubmitReportInput): string {
  const parts = [`## Summary\n\n${input.summary}`];
  for (const section of input.sections) {
    parts.push(`## ${section.title}\n\n${section.body}`);
  }
  if (input.actions.length > 0) {
    parts.push(
      "## Recommended actions\n\n" +
        input.actions.map((a, i) => `${i + 1}. **${a.title}** — ${a.description}`).join("\n"),
    );
  }
  return parts.join("\n\n");
}
