import { Queue, Worker } from "bullmq";
import { prisma } from "../db/prisma";
import { renderEmail } from "../lib/email-templates";
import { enqueueEmail } from "./email";

/**
 * Notification digests: members who set digest="daily"|"weekly" get one rolled-up
 * email instead of per-event mail. A repeatable job per cadence gathers each
 * opted-in member's notifications from the window and enqueues a single summary.
 */

const connection = { url: process.env.REDIS_URL ?? "redis://localhost:6379" };
const QUEUE_NAME = "notification-digest";

type Cadence = "daily" | "weekly";
type DigestJob = { cadence: Cadence };

export const digestQueue = new Queue<DigestJob>(QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "exponential", delay: 30_000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
});

// daily 08:00, weekly Monday 08:00 (server local time)
const SCHEDULES: Record<Cadence, string> = {
  daily: "0 8 * * *",
  weekly: "0 8 * * 1",
};

const BASE = process.env.FRONTEND_URL ?? "http://localhost:3000";

async function sendDigests(cadence: Cadence): Promise<void> {
  const since = new Date();
  since.setDate(since.getDate() - (cadence === "daily" ? 1 : 7));

  const prefs = await prisma.notificationPreference.findMany({
    where: { digest: cadence, emailEnabled: true },
    select: {
      member: {
        select: {
          id: true,
          user: { select: { email: true, name: true } },
        },
      },
    },
  });

  let sent = 0;
  for (const pref of prefs) {
    const email = pref.member.user.email;
    if (!email) continue;
    const notifications = await prisma.notification.findMany({
      where: { recipientId: pref.member.id, createdAt: { gte: since }, archivedAt: null },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { title: true, body: true },
    });
    if (notifications.length === 0) continue;

    const paragraphs = notifications.map((n) => (n.body ? `${n.title} — ${n.body}` : n.title));
    const window = cadence === "daily" ? "today" : "this week";
    const html = renderEmail({
      title: `Your ${cadence} digest`,
      preheader: `${notifications.length} update${notifications.length === 1 ? "" : "s"} from ${window}`,
      paragraphs: [
        `Here${notifications.length === 1 ? "'s" : " are"} ${notifications.length} update${notifications.length === 1 ? "" : "s"} waiting in your workspace:`,
        ...paragraphs,
      ],
      ctaLabel: "Open Eleven",
      ctaUrl: `${BASE}/dashboard/notifications`,
    });
    enqueueEmail({ to: email, subject: `Your ${cadence} digest — Eleven`, html });
    sent++;
  }
  console.log(`[digest] ${cadence}: queued ${sent} digest email(s)`);
}

// ponytail: in-process worker like the email/ai-reports queues
export const digestWorker = new Worker<DigestJob>(
  QUEUE_NAME,
  async (job) => sendDigests(job.data.cadence),
  { connection, concurrency: 1 },
);

digestWorker.on("failed", (job, err) => {
  console.error(`[digest] job ${job?.name} failed: ${err.message}`);
});

/** Register the repeatable daily/weekly digest schedulers. Idempotent. */
export async function scheduleDigests(): Promise<void> {
  for (const [cadence, pattern] of Object.entries(SCHEDULES)) {
    await digestQueue.upsertJobScheduler(
      `digest-${cadence}`,
      { pattern },
      { name: cadence, data: { cadence: cadence as Cadence } },
    );
  }
  console.log("[digest] schedulers registered (daily/weekly)");
}
