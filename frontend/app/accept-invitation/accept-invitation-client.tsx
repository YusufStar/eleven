"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

export function AcceptInvitationClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const [accepting, setAccepting] = useState(false);
  const acceptAttemptedRef = useRef(false);

  useEffect(() => {
    if (isSessionPending || !token) return;

    if (!session?.user) {
      const callbackUrl = `/accept-invitation?token=${encodeURIComponent(token)}`;
      router.replace(`/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    if (acceptAttemptedRef.current) return;
    acceptAttemptedRef.current = true;
    setAccepting(true);

    authClient.organization
      .acceptInvitation({ invitationId: token })
      .then(({ data, error }) => {
        setAccepting(false);
        if (error) {
          toast.error(error.message ?? "Failed to accept invitation.");
          acceptAttemptedRef.current = false;
          return;
        }
        if (data?.invitation?.organizationId) {
          authClient.organization.setActive({ organizationId: data.invitation.organizationId }).then(() => {
            toast.success("Invitation accepted. Welcome to the organization.");
            router.replace("/dashboard");
          });
        } else {
          toast.success("Invitation accepted.");
          router.replace("/dashboard");
        }
      })
      .catch(() => {
        setAccepting(false);
        acceptAttemptedRef.current = false;
        toast.error("Failed to accept invitation.");
      });
  }, [session?.user, isSessionPending, token, router]);

  if (!token) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
        <p className="text-muted-foreground text-sm">Invalid or missing invitation link.</p>
        <a href="/dashboard" className="text-primary hover:underline">
          Go to dashboard
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
      {isSessionPending || accepting ? (
        <>
          <Spinner className="size-8" />
          <p className="text-muted-foreground text-sm">
            {!session?.user ? "Redirecting to sign up..." : "Accepting invitation..."}
          </p>
        </>
      ) : null}
    </div>
  );
}
