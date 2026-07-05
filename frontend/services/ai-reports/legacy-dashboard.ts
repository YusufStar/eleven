import type { AiReport, ReportChart, ReportDashboard, ReportKpi } from "./types";

function toolData(report: AiReport): Record<string, unknown> {
  const m = report.metrics;
  if (!m || typeof m !== "object") return {};
  if (m.tools && typeof m.tools === "object") return m.tools as Record<string, unknown>;
  // Legacy: metrics were flat tool outputs
  const legacy: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(m)) {
    if (k !== "dashboard") legacy[k] = v;
  }
  return legacy;
}

/** Build KPI cards + charts from legacy tool-call metrics when dashboard JSON is missing. */
export function buildLegacyDashboard(report: AiReport): ReportDashboard | null {
  const tools = toolData(report);
  if (Object.keys(tools).length === 0) return null;

  const kpis: ReportKpi[] = [];
  const charts: ReportChart[] = [];

  const taskStats = tools.get_task_stats as
    | {
        byStatus?: Record<string, number>;
        openByPriority?: Record<string, number>;
        createdInPeriod?: number;
        completedInPeriod?: number;
        overdueNow?: number;
        periodDays?: number;
      }
    | undefined;

  if (taskStats) {
    const open = taskStats.byStatus
      ? Object.entries(taskStats.byStatus)
          .filter(([s]) => !["DONE", "CANCELLED"].includes(s))
          .reduce((sum, [, n]) => sum + n, 0)
      : 0;
    kpis.push(
      { id: "open", label: "Open tasks", value: open, tone: "blue" },
      { id: "completed", label: "Completed", value: taskStats.completedInPeriod ?? 0, tone: "green", sub: `Last ${taskStats.periodDays ?? "?"}d` },
      { id: "blocked", label: "Blocked", value: taskStats.byStatus?.BLOCKED ?? 0, tone: "red" },
      { id: "overdue", label: "Overdue", value: taskStats.overdueNow ?? 0, tone: "orange" },
    );
    if (taskStats.byStatus) {
      charts.push({
        id: "status",
        type: "bar",
        title: "Tasks by status",
        xKey: "status",
        data: Object.entries(taskStats.byStatus).map(([status, count]) => ({ status, count })),
        series: [{ key: "count", label: "Tasks" }],
      });
    }
    if (taskStats.openByPriority) {
      charts.push({
        id: "priority",
        type: "pie",
        title: "Open tasks by priority",
        xKey: "priority",
        data: Object.entries(taskStats.openByPriority).map(([priority, value]) => ({ priority, value })),
        series: [{ key: "value", label: "Tasks" }],
      });
    }
  }

  const teamLoad = tools.get_team_load as
    | Array<{ name: string; openTasks: number; blocked: number; openPoints: number }>
    | undefined;
  if (teamLoad?.length) {
    charts.push({
      id: "team-load",
      type: "bar",
      title: "Team load",
      xKey: "name",
      data: teamLoad.map((m) => ({
        name: m.name.split(" ")[0] ?? m.name,
        openTasks: m.openTasks,
        blocked: m.blocked,
      })),
      series: [
        { key: "openTasks", label: "Open tasks" },
        { key: "blocked", label: "Blocked" },
      ],
    });
  }

  const sprints = tools.get_sprint_stats as
    | Array<{ name: string; committedPoints: number; completedPoints: number; state: string }>
    | undefined;
  if (sprints?.length) {
    charts.push({
      id: "velocity",
      type: "line",
      title: "Sprint velocity",
      xKey: "name",
      data: [...sprints].reverse().map((s) => ({
        name: s.name,
        committedPoints: s.committedPoints,
        completedPoints: s.completedPoints,
      })),
      series: [
        { key: "committedPoints", label: "Committed" },
        { key: "completedPoints", label: "Completed" },
      ],
    });
  }

  const projects = tools.get_project_health as
    | Array<{ name: string; health: string; progressPct: number; blocked: number; overdue: number }>
    | undefined;
  if (projects?.length) {
    const atRisk = projects.filter((p) => p.health !== "on-track").length;
    kpis.push({ id: "projects-at-risk", label: "Projects at risk", value: atRisk, tone: atRisk > 0 ? "orange" : "green" });
  }

  if (kpis.length === 0 && charts.length === 0) return null;
  return { kpis, charts, highlights: [], risks: [] };
}

export function getReportDashboardWithLegacy(report: AiReport): ReportDashboard | null {
  const d = report.metrics?.dashboard;
  if (d && Array.isArray(d.kpis)) {
    return {
      kpis: d.kpis ?? [],
      charts: d.charts ?? [],
      highlights: d.highlights ?? [],
      risks: d.risks ?? [],
    };
  }
  return buildLegacyDashboard(report);
}

/** Preferred entry: structured dashboard or legacy tool-data fallback. */
export const getReportDashboard = getReportDashboardWithLegacy;

/** Parse markdown recommended-actions section for legacy reports without DB actions. */
export function parseLegacyActionsFromMarkdown(content: string): Array<{ title: string; description: string }> {
  const match = content.match(/## Recommended actions?\s*\n([\s\S]*?)(?=\n## |$)/i);
  if (!match) return [];
  const lines = match[1]
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const items: Array<{ title: string; description: string }> = [];
  for (const line of lines) {
    const m = line.match(/^\d+\.\s+\*\*(.+?)\*\*\s*[—–-]\s*(.+)$/);
    if (m) items.push({ title: m[1].trim(), description: m[2].trim() });
    else if (line.startsWith("- ") || line.startsWith("* ")) {
      const text = line.replace(/^[-*]\s+/, "");
      const bold = text.match(/^\*\*(.+?)\*\*\s*[—–-]\s*(.+)$/);
      if (bold) items.push({ title: bold[1].trim(), description: bold[2].trim() });
      else items.push({ title: text.slice(0, 80), description: text });
    }
  }
  return items;
}
