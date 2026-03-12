"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function ChatPage() {
  const router = useRouter();
  const { data: activeOrganization } = authClient.useActiveOrganization();

  useEffect(() => {
    if (activeOrganization?.id) {
      router.replace(`/chat/${activeOrganization.id}`);
    }
  }, [activeOrganization?.id, router]);

  return (
    <div className="flex flex-1 flex-col p-4">
      <h1 className="text-xl font-semibold">Chat</h1>
      <p className="text-muted-foreground text-sm">
        Select a conversation or organization chat.
      </p>
    </div>
  );
}
