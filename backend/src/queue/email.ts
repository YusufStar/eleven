import { Queue, Worker } from "bullmq";
import { mail } from "../plugins/mail";

/**
 * All outgoing email goes through this BullMQ queue — API handlers only
 * enqueue (fire-and-forget) and never wait for SMTP.
 */

const connection = {
  url: process.env.REDIS_URL ?? "redis://localhost:6379",
};

export type EmailJob = {
  to: string;
  subject: string;
  html: string;
};

const QUEUE_NAME = "emails";

export const emailQueue = new Queue<EmailJob>(QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5_000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
});

/** Fire-and-forget: never throws, never blocks the request path. */
export function enqueueEmail(job: EmailJob): void {
  emailQueue.add("send", job).catch((err) => {
    // Redis down — degrade to a direct async send so mail still goes out
    console.error("[email-queue] enqueue failed, sending directly:", err?.message);
    mail
      .sendMail({ from: process.env.MAIL_FROM!, ...job })
      .catch((e) => console.error("[email-queue] direct send failed:", e?.message));
  });
}

// ponytail: in-process worker — split into its own process when volume matters
export const emailWorker = new Worker<EmailJob>(
  QUEUE_NAME,
  async (job) => {
    await mail.sendMail({
      from: process.env.MAIL_FROM!,
      to: job.data.to,
      subject: job.data.subject,
      html: job.data.html,
    });
  },
  { connection, concurrency: 5 },
);

emailWorker.on("completed", (job) => {
  console.log(`[email-queue] sent "${job.data.subject}" to ${job.data.to}`);
});
emailWorker.on("failed", (job, err) => {
  console.error(`[email-queue] failed "${job?.data.subject}" to ${job?.data.to}: ${err.message}`);
});
