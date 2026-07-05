import { Elysia } from "elysia";
import { auth } from "../auth/auth";
import { prisma } from "../db/prisma";
import type { Organization, Member } from "../../prisma/generated/prisma/client";

export type ActiveOrgContext = {
    activeOrganizationId: string;
    activeOrganization: Organization;
    activeMember: Member;
};

export const authPlugin = new Elysia({ name: "auth" })
    .derive({ as: "global" }, async ({ request }) => {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        const sessionData = session?.session ?? null;
        const user = session?.user ?? null;
        const activeOrganizationId = (sessionData as { activeOrganizationId?: string } | null)?.activeOrganizationId ?? null;

        let activeOrganization: Organization | null = null;
        let activeMember: Member | null = null;
        if (user?.id && activeOrganizationId) {
            activeOrganization = await prisma.organization.findUnique({ where: { id: activeOrganizationId } }) ?? null;
            activeMember = await prisma.member.findFirst({
                where: { userId: user.id, organizationId: activeOrganizationId },
            }) ?? null;
        }

        return {
            session: sessionData,
            user,
            activeOrganizationId,
            activeOrganization,
            activeMember,
        };
    })
    .macro({
        requireAuth(enabled: boolean) {
            if (!enabled) return;
            return {
                beforeHandle({ session, user, set }: any) {
                    if (!session || !user) {
                        set.status = 401;
                        return { message: "Unauthorized" };
                    }
                },
            };
        },
        requireActiveOrg(_: boolean) {
            return {
                beforeHandle({ activeOrganizationId, activeOrganization, activeMember, set }: any) {
                    if (!activeOrganizationId || !activeOrganization || !activeMember) {
                        set.status = 400;
                        return { message: "Active organization required" };
                    }
                },
            };
        },
        requireAdmin(_: boolean) {
            return {
                beforeHandle({ activeMember, set }: any) {
                    if (!activeMember || activeMember.role !== "owner" && activeMember.role !== "admin") {
                        set.status = 403;
                        return { message: "Owner or admin role required" };
                    }
                },
            };
        },
        // Plan gating: the app unlocks with a one-time payment. Guards write paths
        // so the frontend paywall can't be bypassed by calling the API directly.
        requirePaidOrg(_: boolean) {
            return {
                beforeHandle({ activeOrganization, set }: any) {
                    const paid = activeOrganization && (activeOrganization.plan === "PROFESSIONAL" || activeOrganization.paidAt);
                    if (!paid) {
                        set.status = 402;
                        return { message: "This workspace needs an active plan. Upgrade to continue." };
                    }
                },
            };
        },
    });