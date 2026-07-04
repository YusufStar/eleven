import type { PrismaClient } from "../../prisma/generated/prisma/client";
import type { NotificationType } from "../../prisma/generated/prisma/enums";
import { renderEmail, notificationCta } from "./email-templates";
import { enqueueEmail } from "../queue/email";

export type NotifyParams = {
  prisma: PrismaClient;
  organizationId: string;
  /** Member ids. The actor is always filtered out — nobody is notified about their own action. */
  recipientIds: string[];
  actorId?: string | null;
  type: NotificationType;
  title: string;
  body?: string | null;
  link?: string | null;
  /** "low" | "normal" | "high" — defaults per type */
  priority?: string;
};

/** Grouping bucket used by filters and per-category preferences. */
export function categoryForType(type: NotificationType): string {
  if (type.startsWith("TASK_")) return "task";
  if (type === "MENTION") return "mention";
  if (type.startsWith("PROJECT_") || type === "SPRINT_STARTED") return "project";
  if (type === "MEETING_INVITED") return "meeting";
  return "system";
}

function defaultPriority(type: NotificationType): string {
  if (type === "MENTION" || type === "TASK_ASSIGNED") return "high";
  return "normal";
}

type CategoryPrefs = Record<string, { inApp?: boolean; email?: boolean } | undefined>;

function isQuietNow(pref: { quietHoursStart: number | null; quietHoursEnd: number | null }, timezone: string | null): boolean {
  if (pref.quietHoursStart == null || pref.quietHoursEnd == null) return false;
  let hour: number;
  try {
    hour = Number(
      new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: timezone ?? "UTC" }).format(new Date()),
    );
  } catch {
    hour = new Date().getUTCHours();
  }
  const { quietHoursStart: start, quietHoursEnd: end } = pref;
  // window may wrap midnight, e.g. 22 → 7
  return start <= end ? hour >= start && hour < end : hour >= start || hour < end;
}

/** Creates in-app notifications and fans out matching emails through the queue.
 *  Respects per-member NotificationPreference (in-app/email per category, quiet hours for email). */
export async function notify(params: NotifyParams): Promise<void> {
  const { prisma, organizationId, recipientIds, actorId, type, title, body, link } = params;
  const recipients = [...new Set(recipientIds)].filter((id) => id && id !== actorId);
  if (recipients.length === 0) return;

  const category = categoryForType(type);
  const priority = params.priority ?? defaultPriority(type);

  const members = await prisma.member.findMany({
    where: { id: { in: recipients } },
    select: {
      id: true,
      timezone: true,
      user: { select: { email: true } },
      notificationPreference: true,
    },
  });

  const inAppRecipients = members.filter((m) => {
    const cats = (m.notificationPreference?.categories ?? {}) as CategoryPrefs;
    return cats[category]?.inApp !== false;
  });
  if (inAppRecipients.length > 0) {
    await prisma.notification.createMany({
      data: inAppRecipients.map((m) => ({
        organizationId,
        recipientId: m.id,
        actorId: actorId ?? null,
        type,
        category,
        priority,
        title,
        body: body ?? null,
        link: link ?? null,
      })),
    });
  }

  // email fan-out — enqueued, never awaited by the caller's request path
  const actor = actorId
    ? await prisma.member.findUnique({
        where: { id: actorId },
        select: { user: { select: { name: true } } },
      })
    : null;
  const base = process.env.FRONTEND_URL ?? "http://localhost:3000";
  const paragraphs = [
    body || "There's an update waiting in your workspace.",
    ...(actor?.user.name ? [`From ${actor.user.name}.`] : []),
  ];
  const html = renderEmail({
    title,
    paragraphs,
    ctaLabel: notificationCta(type),
    ctaUrl: link ? `${base}${link}` : base,
  });
  for (const m of members) {
    const pref = m.notificationPreference;
    if (!m.user.email) continue;
    if (pref) {
      if (!pref.emailEnabled) continue;
      const cats = (pref.categories ?? {}) as CategoryPrefs;
      if (cats[category]?.email === false) continue;
      if (isQuietNow(pref, m.timezone)) continue;
    }
    enqueueEmail({ to: m.user.email, subject: `${title} — Eleven`, html });
  }
}

/** Notify every member of the organization except the actor. */
export async function notifyOrganization(
  params: Omit<NotifyParams, "recipientIds">,
): Promise<void> {
  const members = await params.prisma.member.findMany({
    where: { organizationId: params.organizationId },
    select: { id: true },
  });
  await notify({ ...params, recipientIds: members.map((m) => m.id) });
}
