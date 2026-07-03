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
};

/** Creates in-app notifications and fans out matching emails through the queue. */
export async function notify(params: NotifyParams): Promise<void> {
  const { prisma, organizationId, recipientIds, actorId, type, title, body, link } = params;
  const recipients = [...new Set(recipientIds)].filter((id) => id && id !== actorId);
  if (recipients.length === 0) return;
  await prisma.notification.createMany({
    data: recipients.map((recipientId) => ({
      organizationId,
      recipientId,
      actorId: actorId ?? null,
      type,
      title,
      body: body ?? null,
      link: link ?? null,
    })),
  });

  // email fan-out — enqueued, never awaited by the caller's request path
  const [members, actor] = await Promise.all([
    prisma.member.findMany({
      where: { id: { in: recipients } },
      select: { user: { select: { email: true } } },
    }),
    actorId
      ? prisma.member.findUnique({
          where: { id: actorId },
          select: { user: { select: { name: true } } },
        })
      : null,
  ]);
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
    if (m.user.email) enqueueEmail({ to: m.user.email, subject: `${title} — Eleven`, html });
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
