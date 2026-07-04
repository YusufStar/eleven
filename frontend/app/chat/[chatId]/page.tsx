"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useChatSearch,
  usePinnedMessages,
  useSendMessage,
  type Message,
  type SendMessagePayload,
} from "@/services/chat";
import { authClient } from "@/lib/auth-client";
import { useTeamMembersList } from "@/services/team";
import { ChatList } from "@/components/chat/chat-list";
import { ChatInput } from "@/components/chat/chat-input";
import { ThreadPanel } from "@/components/chat/thread-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HugeiconsIcon } from "@hugeicons/react";
import { PinIcon, Search01Icon } from "@hugeicons/core-free-icons";
import { useDebouncedCallback } from "@/lib/use-debounced-callback";

function snippet(m: Message): string {
  return m.content?.slice(0, 80) ?? "attachment";
}

export default function ChatConversationPage() {
  const params = useParams();
  const chatId = (params?.chatId as string) ?? "";
  const { data: session } = authClient.useSession();
  const { data: activeOrganization } = authClient.useActiveOrganization();
  const { data: teamData } = useTeamMembersList({ pageSize: 100 });
  const currentUserId = session?.user?.id ?? null;
  const sendMessage = useSendMessage();

  const [threadRoot, setThreadRoot] = React.useState<Message | null>(null);
  const [searchInput, setSearchInput] = React.useState("");
  const [searchQ, setSearchQ] = React.useState("");
  const debouncedSetQ = useDebouncedCallback((v: string) => setSearchQ(v), 300);
  const searchQuery = useChatSearch(chatId, searchQ);
  const [pinnedOpen, setPinnedOpen] = React.useState(false);
  const pinned = usePinnedMessages(chatId, pinnedOpen);

  const isOrgChat = activeOrganization?.id === chatId;
  const title = React.useMemo(() => {
    if (isOrgChat) return `# ${activeOrganization?.name ?? "Organization"}`;
    const otherUserId = chatId.split("-").find((id) => id && id !== currentUserId);
    const other = (teamData?.data ?? []).find((m) => m.userId === otherUserId);
    return other?.user.name ?? "Direct message";
  }, [isOrgChat, activeOrganization?.name, chatId, currentUserId, teamData?.data]);

  const handleSend = (payload: SendMessagePayload) => {
    if (!chatId) return;
    sendMessage.mutate({ chatId, payload: { ...payload, content: payload.content ?? null } });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col p-4">
      <header className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-2">
        <h1 className="min-w-0 truncate text-xl font-semibold">{title}</h1>
        <div className="flex items-center gap-1.5">
          {/* message search */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <HugeiconsIcon icon={Search01Icon} className="size-4" strokeWidth={2} />
                Search
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-2" align="end">
              <Input
                autoFocus
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  debouncedSetQ(e.target.value);
                }}
                placeholder="Search messages…"
                className="mb-2"
              />
              <div className="max-h-72 space-y-1 overflow-y-auto">
                {searchQ.trim().length < 2 ? (
                  <p className="px-1 py-2 text-xs text-muted-foreground">Type at least 2 characters.</p>
                ) : searchQuery.isPending ? (
                  <p className="px-1 py-2 text-xs text-muted-foreground">Searching…</p>
                ) : (searchQuery.data?.data ?? []).length === 0 ? (
                  <p className="px-1 py-2 text-xs text-muted-foreground">No results.</p>
                ) : (
                  searchQuery.data!.data.map((m) => (
                    <div key={m.id} className="rounded-md border px-2 py-1.5 text-xs">
                      <p className="font-medium">{m.sender.name}</p>
                      <p className="truncate text-muted-foreground">{snippet(m)}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {new Date(m.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* pinned messages */}
          <Popover open={pinnedOpen} onOpenChange={setPinnedOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <HugeiconsIcon icon={PinIcon} className="size-4" strokeWidth={2} />
                Pinned
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-2" align="end">
              <div className="max-h-72 space-y-1 overflow-y-auto">
                {pinned.isPending ? (
                  <p className="px-1 py-2 text-xs text-muted-foreground">Loading…</p>
                ) : (pinned.data?.data ?? []).length === 0 ? (
                  <p className="px-1 py-2 text-xs text-muted-foreground">No pinned messages yet.</p>
                ) : (
                  pinned.data!.data.map((m) => (
                    <div key={m.id} className="rounded-md border border-status-yellow/30 px-2 py-1.5 text-xs">
                      <p className="font-medium">{m.sender.name}</p>
                      <p className="truncate text-muted-foreground">{snippet(m)}</p>
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </header>

      <ChatList
        chatId={chatId}
        currentUserId={currentUserId}
        onOpenThread={setThreadRoot}
        className="mb-4 min-h-0 rounded border bg-muted/30"
      />

      <ChatInput
        chatId={chatId}
        onSend={handleSend}
        disabled={sendMessage.isPending}
        placeholder="Type a message… use @ to mention"
        className="shrink-0"
      />

      <ThreadPanel
        chatId={chatId}
        rootMessage={threadRoot}
        currentUserId={currentUserId}
        onClose={() => setThreadRoot(null)}
      />
    </div>
  );
}
