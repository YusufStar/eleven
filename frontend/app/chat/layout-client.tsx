"use client";

import { ChatSidebar } from "@/components/layout/chat-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export function ChatLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <ChatSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
