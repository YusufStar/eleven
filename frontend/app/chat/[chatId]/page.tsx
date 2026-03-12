"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useSendMessage } from "@/services/chat";
import type { SendMessagePayload } from "@/services/chat";
import { authClient } from "@/lib/auth-client";
import { ChatList } from "@/components/chat/chat-list";
import { ChatInput } from "@/components/chat/chat-input";
import { Button } from "@/components/ui/button";

export default function ChatConversationPage() {
  const params = useParams();
  const chatId = (params?.chatId as string) ?? "";
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id ?? null;
  const sendMessage = useSendMessage();

  const handleSend = (payload: SendMessagePayload) => {
    if (!chatId) return;
    sendMessage.mutate({ chatId, payload: { content: payload.content ?? null, medias: payload.medias } });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col p-4">
      <header className="flex shrink-0 items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Chat</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </header>

      <ChatList
        chatId={chatId}
        currentUserId={currentUserId}
        className="min-h-0 rounded border bg-muted/30 mb-4"
      />

      <ChatInput
        onSend={handleSend}
        disabled={sendMessage.isPending}
        placeholder="Type a message..."
        className="shrink-0"
      />
    </div>
  );
}
