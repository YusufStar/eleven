import { PrismaClient } from "../../prisma/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Superuser — better-auth için
const superAdapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});
export const prisma = new PrismaClient({ adapter: superAdapter });

// RLS rolü — org-scoped sorguları için
const appAdapter = new PrismaPg({
    connectionString: process.env.DATABASE_APP_URL!,
});
const appClient = new PrismaClient({ adapter: appAdapter });

// Her request için org-scoped client
export function dbForOrg(organizationId: string) {
    return appClient.$extends({
        query: {
            $allModels: {
                async $allOperations({ model, operation, args }) {
                    return appClient.$transaction(async (tx) => {
                        await tx.$executeRaw`
              SELECT set_config('app.current_organization_id', ${organizationId}, true)
            `;
                        const delegate = (tx as unknown as Record<string, Record<string, (a: unknown) => Promise<unknown>>>)[
                            model.slice(0, 1).toLowerCase() + model.slice(1)
                        ];
                        return delegate[operation](args);
                    });
                },
            },
        },
    });
}