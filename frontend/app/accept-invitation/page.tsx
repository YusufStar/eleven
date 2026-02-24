import { Suspense } from "react";
import { AcceptInvitationClient } from "./accept-invitation-client";
import { Spinner } from "@/components/ui/spinner";

function AcceptInvitationFallback() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
      <Spinner className="size-8" />
      <p className="text-muted-foreground text-sm">Loading...</p>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<AcceptInvitationFallback />}>
      <AcceptInvitationClient />
    </Suspense>
  );
}
