import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization } from "better-auth/plugins";
import { prisma } from "../db/prisma";
import { mail } from "../plugins/mail";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailVerification: {
        sendOnSignUp: true,
        sendVerificationEmail: async ({ user, url, token }) => {
            await mail.sendMail({
                from: process.env.MAIL_FROM!,
                to: user.email as string,
                subject: "Verify your email",
                html: `<div>
                    <h1>Verify your email</h1>
                    <p>Click here to verify your email: <a href="${url}">${url}</a></p>
                    <p>If you did not request this verification, please ignore this email.</p>
                    <p>Thank you for using our service.</p>
                </div>`,
            })
        },
    },
    plugins: [
        organization({
            allowUserToCreateOrganization: true,
            sendInvitationEmail: async (data) => {
                const inviteUrl = `${process.env.FRONTEND_URL}/accept-invitation?token=${data.invitation.id}`;

                await mail.sendMail({
                    to: data.invitation.email,
                    subject: "You are invited to join an organization",
                    html: `<div>
                        <h1>You are invited to join an organization</h1>
                        <p>Click here to accept the invitation: <a href="${inviteUrl}">${inviteUrl}</a></p>
                        <p>If you did not request this invitation, please ignore this email.</p>
                        <p>Thank you for using our service.</p>
                    </div>`,
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