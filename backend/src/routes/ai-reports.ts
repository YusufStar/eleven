import { Elysia } from "elysia";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "../db/prisma";
import { authPlugin } from "../plugins/auth.plugin";
import { logActivity } from "../lib/activity-log";
import { ActivityAction, ActivityEntityType, AiReportKind } from "../../prisma/generated/prisma/enums";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";

const KIND_CONFIG: Record<AiReportKind, { days: number; maxTokens: number; label: string }> = {
  MINI: { days: 1, maxTokens: 1500, label: "Daily mini report" },
  MEDIUM: { days: 7, maxTokens: 3000, label: "Weekly report" },
  HIGH: { days: 30, maxTokens: 6000, label: "Monthly deep-dive" },
};

const json = (message: string, status: number) =>
  new Response(JSON.stringify({ message }), { status, headers: { "Content-Type": "application/json" } });

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

async function generateReport(orgId: string, orgName: string, kind: AiReportKind) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");
  const client = new Anthropic({ apiKey });
  const cfg = KIND_CONFIG[kind];

  const system = `You are the analytics engine of Eleven, a work platform for software teams (tasks, sprints, projects, chat).
Write a ${cfg.label} for the team "${orgName}" covering the last ${cfg.days} day(s).

Rules:
- FIRST call the data tools to gather real numbers. Never invent data. Every number in the report must come from a tool result.
- Then write the report in clean markdown (no top-level h1; start with h2 sections).
- Sections to cover when data allows: Summary, Productivity & Velocity, Team Load, Project Health, Bottlenecks & Risks (blocked/overdue), Suggestions (2-4 concrete, actionable).
- ${kind === "MINI" ? "Keep it short and scannable — a standup-style digest, max ~200 words." : ""}
- ${kind === "MEDIUM" ? "Medium depth — include velocity trend and per-member load." : ""}
- ${kind === "HIGH" ? "Deep dive — include sprint velocity history, delivery forecast, risk detection and team health assessment." : ""}
- If a data source is empty, say so briefly instead of speculating.`;

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: `Generate the ${cfg.label} now.` },
  ];

  const collectedMetrics: Record<string, unknown> = {};
  let finalText = "";
  for (let turn = 0; turn < 8; turn++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: cfg.maxTokens,
      system,
      tools: TOOLS,
      messages,
    });
    if (response.stop_reason === "tool_use") {
      messages.push({ role: "assistant", content: response.content });
      const results: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type !== "tool_use") continue;
        const result = await runTool(block.name, orgId, cfg.days);
        collectedMetrics[block.name] = result;
        results.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      }
      messages.push({ role: "user", content: results });
      continue;
    }
    finalText = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    break;
  }
  if (!finalText.trim()) throw new Error("Model returned no report text");

  const periodEnd = new Date();
  const periodStart = new Date(periodEnd);
  periodStart.setDate(periodStart.getDate() - cfg.days);

  return prisma.aiReport.create({
    data: {
      organizationId: orgId,
      kind,
      title: `${cfg.label} — ${periodEnd.toISOString().slice(0, 10)}`,
      content: finalText,
      metrics: collectedMetrics as object,
      model: MODEL,
      periodStart,
      periodEnd,
    },
  });
}

/** A report is fresh if one of the same kind was created inside the current period window. */
function freshnessCutoff(kind: AiReportKind): Date {
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
      });
      return { data, aiConfigured: !!process.env.ANTHROPIC_API_KEY };
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
