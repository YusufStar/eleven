import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization } from "better-auth/plugins";
import { prisma } from "../db/prisma";
import { renderEmail } from "../lib/email-templates";
import { enqueueEmail } from "../queue/email";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailVerification: {
        sendOnSignUp: true,
        sendVerificationEmail: async ({ user, url }) => {
            enqueueEmail({
                to: user.email as string,
                subject: "Verify your email — Eleven",
                html: renderEmail({
                    preheader: "One click and your workspace is ready.",
                    title: "Welcome to Eleven.",
                    paragraphs: [
                        `Hi ${user.name || "there"} — confirm this address and your monochrome workspace is ready.`,
                        "If you didn't create an Eleven account, you can safely ignore this email.",
                    ],
                    ctaLabel: "Verify email",
                    ctaUrl: url,
                    footnote: url,
                }),
            });
        },
    },
    plugins: [
        organization({
            allowUserToCreateOrganization: true,
            sendInvitationEmail: async (data) => {
                const inviteUrl = `${process.env.FRONTEND_URL}/accept-invitation?token=${data.invitation.id}`;
                const orgName = data.organization?.name ?? "an organization";
                const inviterName = data.inviter?.user?.name;

                enqueueEmail({
                    to: data.invitation.email,
                    subject: `Join ${orgName} on Eleven`,
                    html: renderEmail({
                        preheader: `You've been invited to ${orgName}.`,
                        title: `You're invited to ${orgName}.`,
                        paragraphs: [
                            inviterName
                                ? `${inviterName} invited you to work together in ${orgName} on Eleven — projects, tasks, and chat in one place.`
                                : `You've been invited to work in ${orgName} on Eleven — projects, tasks, and chat in one place.`,
                            "If you weren't expecting this invitation, you can safely ignore this email.",
                        ],
                        ctaLabel: "Accept invitation",
                        ctaUrl: inviteUrl,
                        footnote: inviteUrl,
                    }),
                });
            },
        }),
    ],
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
    },
    trustedOrigins: [process.env.FRONTEND_URL!],
});

export type Auth = typeof auth;
