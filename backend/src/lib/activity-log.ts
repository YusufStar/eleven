import type { PrismaClient } from "../../prisma/generated/prisma/client";
import type { ActivityAction, ActivityEntityType } from "../../prisma/generated/prisma/enums";

export type LogActivityParams = {
  prisma: PrismaClient;
  organizationId: string;
  memberId: string;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId: string;
  entityTitle?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function logActivity(params: LogActivityParams): Promise<void> {
  const { prisma, organizationId, memberId, action, entityType, entityId, entityTitle, metadata } = params;
  await prisma.activity.create({
    data: {
      organizationId,
      memberId,
      action,
      entityType,
      entityId,
      entityTitle: entityTitle ?? null,
      metadata: (metadata ?? undefined) as Parameters<PrismaClient["activity"]["create"]>[0]["data"]["metadata"],
    },
  });
}
