"use client";

import { ChatSidebar } from "@/components/layout/chat-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export function ChatLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-svh overflow-hidden">
      <SidebarProvider className="h-full min-h-0 w-full">
        <ChatSidebar />
        <SidebarInset className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
