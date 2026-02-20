import { Elysia } from "elysia";
import { authPlugin } from "./auth.plugin";
import { dbForOrg } from "../db/prisma";

export const orgPlugin = new Elysia({ name: "org" })
    .use(authPlugin)
    .derive({ as: "global" }, ({ session, error }: any) => {
        const organizationId = session?.session?.activeOrganizationId;

        if (!organizationId) {
            return { db: null, organizationId: null };
        }

        return {
            db: dbForOrg(organizationId),
            organizationId,
        };
    })
    .macro({
        requireOrg(enabled: boolean) {
            if (!enabled) return;
            return {
                beforeHandle({ organizationId, error }: any) {
                    if (!organizationId) {
                        return error(403, { message: "No active organization" });
                    }
                },
            };
        },
    });