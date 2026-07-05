import { Elysia } from "elysia";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "../db/prisma";
import { authPlugin } from "../plugins/auth.plugin";
import { logActivity } from "../lib/activity-log";
import { applyAiReportAction } from "../lib/ai-report-actions";
import { parseSubmitReport, reportMarkdownFromSubmit } from "../lib/ai-report-schema";
import {
  ActivityAction,
  ActivityEntityType,
  AiReportActionStatus,
  AiReportActionType,
  AiReportKind,
} from "../../prisma/generated/prisma/enums";

// ponytail: env override lets prod pin a dated snapshot (e.g. claude-sonnet-5-20260514)
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";

// Rough public per-MTok pricing (USD) for cost estimation in logs. Override via env if it drifts.
const PRICE_IN = Number(process.env.ANTHROPIC_PRICE_IN ?? 3) / 1_000_000;
const PRICE_OUT = Number(process.env.ANTHROPIC_PRICE_OUT ?? 15) / 1_000_000;

const KIND_CONFIG: Record<AiReportKind, { days: number; maxTokens: number; label: string }> = {
  MINI: { days: 1, maxTokens: 1500, label: "Daily mini report" },
  MEDIUM: { days: 7, maxTokens: 3000, label: "Weekly report" },
  HIGH: { days: 30, maxTokens: 6000, label: "Monthly deep-dive" },
};

const json = (message: string, status: number) =>
  new Response(JSON.stringify({ message }), { status, headers: { "Content-Type": "application/json" } });

const reportInclude = {
  actions: { orderBy: { sortOrder: "asc" as const } },
} as const;

// ─── Data tools (org-scoped, deterministic) ───────

async function getTaskStats(orgId: string, days: number) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const [byStatus, created, completed, overdue, byPriority] = await Promise.all([
    prisma.task.groupBy({ by: ["status"], where: { organizationId: orgId }, _count: { _all: true } }),
    prisma.task.count({ where: { organizationId: orgId, createdAt: { gte: since } } }),
    prisma.task.count({ where: { organizationId: orgId, completedAt: { gte: since } } }),
    prisma.task.count({
      where: {
        organizationId: orgId,
        dueAt: { lt: new Date() },
        status: { in: ["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED"] },
      },
    }),
    prisma.task.groupBy({
      by: ["priority"],
      where: { organizationId: orgId, status: { notIn: ["DONE", "CANCELLED"] } },
      _count: { _all: true },
    }),
  ]);
  return {
    byStatus: Object.fromEntries(byStatus.map((g) => [g.status, g._count._all])),
    openByPriority: Object.fromEntries(byPriority.map((g) => [g.priority, g._count._all])),
    createdInPeriod: created,
    completedInPeriod: completed,
    overdueNow: overdue,
    periodDays: days,
  };
}

async function getTeamLoad(orgId: string) {
  const members = await prisma.member.findMany({
    where: { organizationId: orgId },
    select: {
      id: true,
      user: { select: { name: true } },
      assignedTasks: { where: { status: { notIn: ["DONE", "CANCELLED"] } }, select: { status: true, estimate: true } },
    },
  });
  return members.map((m) => ({
    name: m.user.name,
    openTasks: m.assignedTasks.length,
    blocked: m.assignedTasks.filter((t) => t.status === "BLOCKED").length,
    openPoints: m.assignedTasks.reduce((sum, t) => sum + (t.estimate ?? 0), 0),
  }));
}

async function getProjectHealth(orgId: string) {
  const projects = await prisma.project.findMany({
    where: { organizationId: orgId },
    select: {
      name: true,
      tasks: { select: { status: true, dueAt: true } },
    },
  });
  const now = new Date();
  return projects.map((p) => {
    const total = p.tasks.length;
    const done = p.tasks.filter((t) => t.status === "DONE").length;
    const blocked = p.tasks.filter((t) => t.status === "BLOCKED").length;
    const overdue = p.tasks.filter(
      (t) => t.dueAt && t.dueAt < now && t.status !== "DONE" && t.status !== "CANCELLED"
    ).length;
    const troubled = total > 0 ? (blocked + overdue) / total : 0;
    return {
      name: p.name,
      totalTasks: total,
      done,
      blocked,
      overdue,
      progressPct: total > 0 ? Math.round((done / total) * 100) : 0,
      health: total === 0 ? "no-data" : troubled >= 0.3 ? "off-track" : troubled >= 0.12 ? "at-risk" : "on-track",
    };
  });
}

async function getSprintStats(orgId: string) {
  const sprints = await prisma.sprint.findMany({
    where: { organizationId: orgId },
    orderBy: { startsAt: "desc" },
    take: 6,
    include: { tasks: { select: { status: true, estimate: true } } },
  });
  const now = new Date();
  return sprints.map((s) => ({
    name: s.name,
    goal: s.goal,
    state: now < s.startsAt ? "upcoming" : now > s.endsAt ? "finished" : "active",
    committedPoints: s.tasks.reduce((sum, t) => sum + (t.estimate ?? 0), 0),
    completedPoints: s.tasks.filter((t) => t.status === "DONE").reduce((sum, t) => sum + (t.estimate ?? 0), 0),
    taskCount: s.tasks.length,
    doneCount: s.tasks.filter((t) => t.status === "DONE").length,
  }));
}

async function getActivitySummary(orgId: string, days: number) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const [byAction, byMember] = await Promise.all([
    prisma.activity.groupBy({
      by: ["action", "entityType"],
      where: { organizationId: orgId, createdAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.activity.groupBy({
      by: ["memberId"],
      where: { organizationId: orgId, createdAt: { gte: since } },
      _count: { _all: true },
    }),
  ]);
  const memberNames = await prisma.member.findMany({
    where: { id: { in: byMember.map((g) => g.memberId) } },
    select: { id: true, user: { select: { name: true } } },
  });
  const nameOf = new Map(memberNames.map((m) => [m.id, m.user.name]));
  return {
    byActionAndEntity: byAction.map((g) => ({ action: g.action, entityType: g.entityType, count: g._count._all })),
    byMember: byMember
      .map((g) => ({ name: nameOf.get(g.memberId) ?? "Unknown", count: g._count._all }))
      .sort((a, b) => b.count - a.count),
    periodDays: days,
  };
}

// ─── Claude tool-calling loop ─────────────────────

const TOOLS: Anthropic.Tool[] = [
  {
    name: "get_task_stats",
    description: "Task counts by status/priority, created/completed in the period, overdue count.",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "get_team_load",
    description: "Per team member: open task count, blocked count, open story points.",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "get_project_health",
    description: "Per project: progress %, blocked/overdue counts and an on-track/at-risk/off-track health rating.",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "get_sprint_stats",
    description: "Recent sprints with committed vs completed story points (velocity).",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "get_activity_summary",
    description: "Workspace activity in the period: counts by action/entity and per member.",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "submit_report",
    description:
      "REQUIRED final step. Submit the completed report as structured JSON for the dashboard UI, charts, and actionable recommendations. Call only after all data tools have returned.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Short report title override (optional)" },
        summary: { type: "string", description: "Executive summary paragraph" },
        sections: {
          type: "array",
          description: "Markdown body sections (h2 titles as section.title)",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              body: { type: "string", description: "Markdown content for this section" },
            },
            required: ["title", "body"],
          },
        },
        dashboard: {
          type: "object",
          properties: {
            kpis: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  label: { type: "string" },
                  value: { type: ["string", "number"] },
                  tone: { type: "string", enum: ["neutral", "blue", "green", "orange", "red"] },
                  sub: { type: "string" },
                },
                required: ["id", "label", "value"],
              },
            },
            charts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  type: { type: "string", enum: ["bar", "line", "pie"] },
                  title: { type: "string" },
                  description: { type: "string" },
                  xKey: { type: "string" },
                  data: { type: "array", items: { type: "object" } },
                  series: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        key: { type: "string" },
                        label: { type: "string" },
                        color: { type: "string" },
                      },
                      required: ["key", "label"],
                    },
                  },
                },
                required: ["id", "type", "title", "data", "series"],
              },
            },
            highlights: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  title: { type: "string" },
                  body: { type: "string" },
                  severity: { type: "string", enum: ["info", "warning", "critical"] },
                },
                required: ["id", "title", "body"],
              },
            },
            risks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  title: { type: "string" },
                  body: { type: "string" },
                },
                required: ["id", "title", "body"],
              },
            },
          },
          required: ["kpis", "charts"],
        },
        actions: {
          type: "array",
          description: "2-6 concrete, actionable recommendations the team can apply in one click",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              type: {
                type: "string",
                enum: [
                  "CREATE_TASK",
                  "UPDATE_TASK_STATUS",
                  "UPDATE_TASK_PRIORITY",
                  "REASSIGN_TASK",
                  "ADD_TASK_COMMENT",
                ],
              },
              title: { type: "string" },
              description: { type: "string" },
              payload: {
                type: "object",
                description:
                  "Action payload. Use taskId/assigneeId when known; otherwise taskTitle/assigneeName. CREATE_TASK: title, description?, priority?, status?, projectId?, assigneeName?. UPDATE_TASK_STATUS: taskId|taskTitle, status. UPDATE_TASK_PRIORITY: taskId|taskTitle, priority. REASSIGN_TASK: taskId|taskTitle, assigneeId|assigneeName. ADD_TASK_COMMENT: taskId|taskTitle, body.",
              },
            },
            required: ["id", "type", "title", "description", "payload"],
          },
        },
      },
      required: ["summary", "sections", "dashboard", "actions"],
    },
  },
];

async function runTool(name: string, orgId: string, days: number): Promise<unknown> {
  switch (name) {
    case "get_task_stats":
      return getTaskStats(orgId, days);
    case "get_team_load":
      return getTeamLoad(orgId);
    case "get_project_health":
      return getProjectHealth(orgId);
    case "get_sprint_stats":
      return getSprintStats(orgId);
    case "get_activity_summary":
      return getActivitySummary(orgId, days);
    default:
      return { error: `Unknown tool ${name}` };
  }
}

export async function generateReport(orgId: string, orgName: string, kind: AiReportKind) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");
  const client = new Anthropic({ apiKey });
  const cfg = KIND_CONFIG[kind];

  const system = `You are the analytics engine of Eleven, a work platform for software teams (tasks, sprints, projects, chat).
Write a ${cfg.label} for the team "${orgName}" covering the last ${cfg.days} day(s).

Rules:
- FIRST call the data tools to gather real numbers. Never invent data. Every number in the report must come from a tool result.
- AFTER gathering data, you MUST call submit_report with structured JSON (summary, sections, dashboard with kpis+charts, and actions). Do not finish with plain text.
- Build dashboard.kpis from real counts (open tasks, completed, blocked, overdue, velocity, etc.).
- Build dashboard.charts from tool data: e.g. task status bar chart, team load bar chart, sprint velocity line chart, project health pie chart. Use chart.data arrays with numeric values.
- sections: Summary, Productivity & Velocity, Team Load, Project Health, Bottlenecks & Risks when data allows.
- actions: 2-6 concrete recommendations with valid type and payload so the team can apply them in the product (create tasks, reassign, change status/priority, add comments). Reference real task titles and member names from tool results.
- ${kind === "MINI" ? "Keep summary and sections short — standup-style digest." : ""}
- ${kind === "MEDIUM" ? "Medium depth — include velocity trend and per-member load charts." : ""}
- ${kind === "HIGH" ? "Deep dive — sprint velocity history, delivery forecast, risk detection." : ""}
- If a data source is empty, say so briefly instead of speculating.`;

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: `Generate the ${cfg.label} now.` },
  ];

  const collectedMetrics: Record<string, unknown> = {};
  let submitted: ReturnType<typeof parseSubmitReport> = null;
  let finalText = "";
  let inputTokens = 0;
  let outputTokens = 0;
  let turns = 0;
  const startedAt = Date.now();
  for (let turn = 0; turn < 10; turn++) {
    turns = turn + 1;
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: cfg.maxTokens,
      system,
      tools: TOOLS,
      messages,
    });
    inputTokens += response.usage.input_tokens;
    outputTokens += response.usage.output_tokens;
    if (response.stop_reason === "tool_use") {
      messages.push({ role: "assistant", content: response.content });
      const results: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type !== "tool_use") continue;
        if (block.name === "submit_report") {
          submitted = parseSubmitReport(block.input);
          results.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: submitted
              ? JSON.stringify({ ok: true, message: "Report structure accepted" })
              : JSON.stringify({ ok: false, error: "Invalid submit_report payload — fix JSON shape and retry" }),
          });
          continue;
        }
        const result = await runTool(block.name, orgId, cfg.days);
        collectedMetrics[block.name] = result;
        results.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      }
      messages.push({ role: "user", content: results });
      if (submitted) {
        finalText = reportMarkdownFromSubmit(submitted);
        break;
      }
      continue;
    }
    finalText = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    break;
  }
  if (!finalText.trim()) throw new Error("Model returned no report text");

  const estCost = inputTokens * PRICE_IN + outputTokens * PRICE_OUT;
  console.log(
    `[ai-reports] ${kind} for "${orgName}" — ${turns} turn(s), ` +
      `${inputTokens} in / ${outputTokens} out tokens, ~$${estCost.toFixed(4)}, ${Date.now() - startedAt}ms`,
  );

  const periodEnd = new Date();
  const periodStart = new Date(periodEnd);
  periodStart.setDate(periodStart.getDate() - cfg.days);

  const metricsPayload = {
    tools: collectedMetrics,
    ...(submitted ? { dashboard: submitted.dashboard } : {}),
  };

  const report = await prisma.aiReport.create({
    data: {
      organizationId: orgId,
      kind,
      title: submitted?.title || `${cfg.label} — ${periodEnd.toISOString().slice(0, 10)}`,
      content: finalText,
      metrics: metricsPayload as object,
      model: MODEL,
      periodStart,
      periodEnd,
      ...(submitted && submitted.actions.length > 0
        ? {
            actions: {
              create: submitted.actions.map((a, i) => ({
                organizationId: orgId,
                type: a.type as AiReportActionType,
                title: a.title,
                description: a.description,
                payload: a.payload as object,
                sortOrder: i,
              })),
            },
          }
        : {}),
    },
    include: reportInclude,
  });

  return report;
}

/** A report is fresh if one of the same kind was created inside the current period window. */
export function freshnessCutoff(kind: AiReportKind): Date {
  const d = new Date();
  if (kind === "MINI") {
    d.setHours(0, 0, 0, 0); // today
  } else if (kind === "MEDIUM") {
    d.setDate(d.getDate() - d.getDay()); // this week (Sunday start)
    d.setHours(0, 0, 0, 0);
  } else {
    d.setDate(1); // this month
    d.setHours(0, 0, 0, 0);
  }
  return d;
}

export const aiReportsRoutes = new Elysia({ prefix: "/ai-reports" })
  .use(authPlugin)
  .get(
    "/",
    async ({ activeOrganizationId, query }) => {
      const kind =
        typeof query?.kind === "string" && (Object.values(AiReportKind) as string[]).includes(query.kind)
          ? (query.kind as AiReportKind)
          : undefined;
      const data = await prisma.aiReport.findMany({
        where: { organizationId: activeOrganizationId!, ...(kind && { kind }) },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: reportInclude,
      });
      return { data, aiConfigured: !!process.env.ANTHROPIC_API_KEY };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .get(
    "/:id",
    async ({ activeOrganizationId, params, set }) => {
      const report = await prisma.aiReport.findFirst({
        where: { id: params.id, organizationId: activeOrganizationId! },
        include: reportInclude,
      });
      if (!report) {
        set.status = 404;
        return { message: "Report not found" };
      }
      return { report };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .post(
    "/:id/actions/:actionId/apply",
    async ({ activeOrganizationId, activeMember, params, set }) => {
      const action = await prisma.aiReportAction.findFirst({
        where: {
          id: params.actionId,
          reportId: params.id,
          organizationId: activeOrganizationId!,
        },
      });
      if (!action) {
        set.status = 404;
        return { message: "Action not found" };
      }
      const result = await applyAiReportAction(action, {
        prisma,
        organizationId: activeOrganizationId!,
        memberId: activeMember!.id,
      });
      const status = result.ok ? AiReportActionStatus.APPLIED : AiReportActionStatus.FAILED;
      const updated = await prisma.aiReportAction.update({
        where: { id: action.id },
        data: {
          status,
          resultMessage: result.message,
          appliedAt: result.ok ? new Date() : null,
          appliedByMemberId: result.ok ? activeMember!.id : null,
        },
      });
      if (!result.ok) {
        set.status = 400;
      }
      return { action: updated, ...result };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .post(
    "/:id/actions/apply-all",
    async ({ activeOrganizationId, activeMember, params, set }) => {
      const report = await prisma.aiReport.findFirst({
        where: { id: params.id, organizationId: activeOrganizationId! },
        include: { actions: { where: { status: AiReportActionStatus.PENDING }, orderBy: { sortOrder: "asc" } } },
      });
      if (!report) {
        set.status = 404;
        return { message: "Report not found" };
      }
      const results: Array<{ actionId: string; ok: boolean; message: string }> = [];
      for (const action of report.actions) {
        const result = await applyAiReportAction(action, {
          prisma,
          organizationId: activeOrganizationId!,
          memberId: activeMember!.id,
        });
        await prisma.aiReportAction.update({
          where: { id: action.id },
          data: {
            status: result.ok ? AiReportActionStatus.APPLIED : AiReportActionStatus.FAILED,
            resultMessage: result.message,
            appliedAt: result.ok ? new Date() : null,
            appliedByMemberId: result.ok ? activeMember!.id : null,
          },
        });
        results.push({ actionId: action.id, ok: result.ok, message: result.message });
      }
      const failed = results.filter((r) => !r.ok).length;
      if (failed > 0 && failed === results.length) set.status = 400;
      return { results, applied: results.filter((r) => r.ok).length, failed };
    },
    { requireAuth: true, requireActiveOrg: true }
  )
  .post(
    "/generate",
    async ({ activeOrganizationId, activeMember, body, set }) => {
      const b = body as { kind?: string; force?: boolean };
      const kind = (Object.values(AiReportKind) as string[]).includes(b?.kind ?? "")
        ? (b!.kind as AiReportKind)
        : AiReportKind.MINI;
      if (!process.env.ANTHROPIC_API_KEY) {
        set.status = 503;
        return { message: "AI reports are not configured (ANTHROPIC_API_KEY missing)" };
      }
      // Staleness gate replaces a cron: the first visit in a new period generates the report.
      if (!b?.force) {
        const existing = await prisma.aiReport.findFirst({
          where: {
            organizationId: activeOrganizationId!,
            kind,
            createdAt: { gte: freshnessCutoff(kind) },
          },
          orderBy: { createdAt: "desc" },
          include: reportInclude,
        });
        if (existing) return { report: existing, fresh: true };
      }
      const org = await prisma.organization.findUnique({
        where: { id: activeOrganizationId! },
        select: { name: true },
      });
      try {
        const report = await generateReport(activeOrganizationId!, org?.name ?? "your team", kind);
        if (activeMember) {
          await logActivity({
            prisma,
            organizationId: activeOrganizationId!,
            memberId: activeMember.id,
            action: ActivityAction.CREATE,
            entityType: ActivityEntityType.AI_REPORT,
            entityId: report.id,
            entityTitle: report.title,
          });
        }
        return { report, fresh: false };
      } catch (err) {
        set.status = 502;
        return { message: err instanceof Error ? err.message : "Report generation failed" };
      }
    },
    { requireAuth: true, requireActiveOrg: true }
  );
