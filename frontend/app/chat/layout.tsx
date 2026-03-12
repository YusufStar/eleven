import { Suspense } from "react";
import { ChatLayoutClient } from "./layout-client";

function ChatLayoutFallback() {
  return (
    <div className="flex h-full w-full">
      <div className="w-64 shrink-0 border-r bg-sidebar" />
      <div className="flex flex-1 p-4">
        <div className="h-6 w-48 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<ChatLayoutFallback />}>
      <ChatLayoutClient>{children}</ChatLayoutClient>
    </Suspense>
  );
}
