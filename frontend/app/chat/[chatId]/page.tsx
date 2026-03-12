"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useChatMessages, useSendMessage } from "@/services/chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ChatConversationPage() {
  const params = useParams();
  const chatId = (params?.chatId as string) ?? "";
  const [text, setText] = useState("");

  const { data: messagesData, isPending, error } = useChatMessages(chatId);
  const sendMessage = useSendMessage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatId || !text.trim()) return;
    sendMessage.mutate(
      { chatId, payload: { content: text.trim() } },
      { onSuccess: () => setText("") }
    );
  };

  return (
    <div className="flex flex-1 flex-col p-4">
      <h1 className="text-xl font-semibold">Chat</h1>
      <p className="text-muted-foreground text-sm mb-4">Conversation: {chatId}</p>

      <div className="flex-1 min-h-0 overflow-auto rounded border bg-muted/30 p-3 mb-4">
        {isPending && <p className="text-sm text-muted-foreground">Loading messages...</p>}
        {error && <p className="text-sm text-destructive">{String(error.message)}</p>}
        {messagesData?.data != null && (
          <pre className="text-xs whitespace-pre-wrap wrap-break-word">
            {JSON.stringify(messagesData.data, null, 2)}
          </pre>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1"
        />
        <Button type="submit" disabled={sendMessage.isPending || !text.trim()}>
          Submit
        </Button>
      </form>
    </div>
  );
}
