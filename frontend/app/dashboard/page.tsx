"use client"

import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";

export default function DashboardPage() {
    const { data: session } = authClient.useSession()
    const { data: organizations } = authClient.useListOrganizations()

    return (
        <div>
            <pre>
                {JSON.stringify(session, null, 2)}
            </pre>
            <Separator className="my-4"/>
            <pre>
                {JSON.stringify(organizations, null, 2)}
            </pre>
        </div>
    );
}