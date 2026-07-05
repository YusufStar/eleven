import { Queue, Worker } from "bullmq";
import { prisma } from "../db/prisma";
import { generateReport, freshnessCutoff } from "../routes/ai-reports";
import { AiReportKind } from "../../prisma/generated/prisma/enums";

/**
 * Scheduled AI reports: a repeatable BullMQ job per kind fans out over every
 * organization and generates the report if this period's one doesn't exist yet.
 * On-demand generation (the /ai-reports/generate route) still works independently.
 */

const connection = { url: process.env.REDIS_URL ?? "redis://localhost:6379" };
const QUEUE_NAME = "ai-reports";

type ReportJob = { kind: AiReportKind };

export const aiReportsQueue = new Queue<ReportJob>(QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "exponential", delay: 30_000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
});

// Cron patterns (server local time). MINI daily, MEDIUM weekly (Mon), HIGH monthly (1st).
const SCHEDULES: Record<AiReportKind, string> = {
  MINI: "0 6 * * *",
  MEDIUM: "0 6 * * 1",
  HIGH: "0 6 1 * *",
};

async function generateForAllOrgs(kind: AiReportKind): Promise<void> {
  const orgs = await prisma.organization.findMany({ select: { id: true, name: true } });
  const cutoff = freshnessCutoff(kind);
  let generated = 0;
  let skipped = 0;
  for (const org of orgs) {
    const existing = await prisma.aiReport.findFirst({
      where: { organizationId: org.id, kind, createdAt: { gte: cutoff } },
      select: { id: true },
    });
    if (existing) {
      skipped++;
      continue;
    }
    try {
      await generateReport(org.id, org.name, kind);
      generated++;
    } catch (err) {
      // One org failing must not stop the fan-out.
      console.error(`[ai-reports-cron] ${kind} failed for org ${org.id}:`, err instanceof Error ? err.message : err);
    }
  }
  console.log(`[ai-reports-cron] ${kind}: generated ${generated}, skipped ${skipped} (already fresh)`);
}

// ponytail: in-process worker like the email queue — split out if AI volume grows
export const aiReportsWorker = new Worker<ReportJob>(
  QUEUE_NAME,
  async (job) => generateForAllOrgs(job.data.kind),
  { connection, concurrency: 1 },
);

aiReportsWorker.on("failed", (job, err) => {
  console.error(`[ai-reports-cron] job ${job?.name} failed: ${err.message}`);
});

/** Register the repeatable schedulers. No-op (with a warning) when AI is unconfigured. */
export async function scheduleAiReports(): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("[ai-reports-cron] ANTHROPIC_API_KEY missing — scheduled reports disabled");
    return;
  }
  for (const [kind, pattern] of Object.entries(SCHEDULES)) {
    await aiReportsQueue.upsertJobScheduler(
      `ai-report-${kind}`,
      { pattern },
      { name: kind, data: { kind: kind as AiReportKind } },
    );
  }
  console.log("[ai-reports-cron] schedulers registered (daily/weekly/monthly)");
}
