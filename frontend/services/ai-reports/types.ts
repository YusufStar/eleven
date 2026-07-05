export type AiReportKind = "MINI" | "MEDIUM" | "HIGH";

export type AiReportActionType =
  | "CREATE_TASK"
  | "UPDATE_TASK_STATUS"
  | "UPDATE_TASK_PRIORITY"
  | "REASSIGN_TASK"
  | "ADD_TASK_COMMENT";

export type AiReportActionStatus = "PENDING" | "APPLIED" | "DISMISSED" | "FAILED";

export interface ReportKpi {
  id: string;
  label: string;
  value: string | number;
  tone?: "neutral" | "blue" | "green" | "orange" | "red";
  sub?: string;
}

export interface ReportChartSeries {
  key: string;
  label: string;
  color?: string;
}

export interface ReportChart {
  id: string;
  type: "bar" | "line" | "pie";
  title: string;
  description?: string;
  xKey?: string;
  data: Array<Record<string, string | number>>;
  series: ReportChartSeries[];
}

export interface ReportHighlight {
  id: string;
  title: string;
  body: string;
  severity?: "info" | "warning" | "critical";
}

export interface ReportDashboard {
  kpis: ReportKpi[];
  charts: ReportChart[];
  highlights: ReportHighlight[];
  risks: ReportHighlight[];
}

export interface AiReportAction {
  id: string;
  reportId: string;
  organizationId: string;
  type: AiReportActionType;
  title: string;
  description: string;
  payload: Record<string, unknown>;
  sortOrder: number;
  status: AiReportActionStatus;
  resultMessage: string | null;
  appliedAt: string | null;
  appliedByMemberId: string | null;
  createdAt: string;
}

export interface AiReportMetrics {
  tools?: Record<string, unknown>;
  dashboard?: ReportDashboard;
  [key: string]: unknown;
}

export interface AiReport {
  id: string;
  organizationId: string;
  kind: AiReportKind;
  title: string;
  content: string;
  metrics: AiReportMetrics;
  model: string | null;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  actions?: AiReportAction[];
}

export {
  getReportDashboard,
  buildLegacyDashboard,
  parseLegacyActionsFromMarkdown,
  getReportDashboardWithLegacy,
} from "./legacy-dashboard";
