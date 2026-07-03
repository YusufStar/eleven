import type { PrismaClient } from "../../prisma/generated/prisma/client";
import type { NotificationType } from "../../prisma/generated/prisma/enums";

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
