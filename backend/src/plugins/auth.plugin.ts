import { Elysia } from "elysia";
import { auth } from "../auth/auth";

export const authPlugin = new Elysia({ name: "auth" })
    .derive({ as: "global" }, async ({ request }) => {
        const session = await auth.api.getSession({
            headers: request.headers,
        });
        return { session: session?.session, user: session?.user };
    })
    .macro({
        // Route'larda requireAuth: true dersen otomatik kontrol
        requireAuth(enabled: boolean) {
            if (!enabled) return;
            return {
                beforeHandle({ session, user, error }: any) {
                    if (!session || !user) return error(401, { message: "Unauthorized" });
                },
            };
        },
    });