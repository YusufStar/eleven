"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useProfileGithub } from "@/services/settings/use-profile-github";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { GithubIcon } from "@hugeicons/core-free-icons";

export default function ProfileSettingsPage() {
  const searchParams = useSearchParams();
  const { connection, isPending, disconnect, isDisconnecting } = useProfileGithub();

  useEffect(() => {
    const status = searchParams.get("github");
    if (status === "connected" || status === "error") {
      window.history.replaceState({}, "", "/dashboard/settings/profile");
    }
  }, [searchParams]);

  const connectUrl = typeof window !== "undefined" ? `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333"}/profile/github/connect` : "";

  return (
    <div className="container mx-auto py-2">
      <h1 className="text-2xl font-semibold tracking-tight mb-2">Profile</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Manage your personal account and integrations.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={GithubIcon} className="size-5" strokeWidth={2} />
            Your GitHub account
          </CardTitle>
          <CardDescription>
            Link your personal GitHub account. This is shown in the team list so others can see your GitHub identity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : connection ? (
            <div className="flex flex-wrap items-center gap-4">
              {connection.avatarUrl && (
                <img
                  src={connection.avatarUrl}
                  alt=""
                  className="size-10 rounded-full"
                />
              )}
              <div>
                <p className="font-medium">@{connection.githubLogin}</p>
                <p className="text-muted-foreground text-sm">GitHub connected</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => disconnect()}
                disabled={isDisconnecting}
                className="ml-auto"
              >
                {isDisconnecting ? "Disconnecting…" : "Disconnect"}
              </Button>
            </div>
          ) : (
            <a href={connectUrl}>
              <Button>
                <HugeiconsIcon icon={GithubIcon} className="size-4 mr-2" strokeWidth={2} />
                Connect GitHub
              </Button>
            </a>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
