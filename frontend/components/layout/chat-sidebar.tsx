"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TeamSwitcher } from "@/components/layout/team-switcher";
import { NavUser } from "@/components/layout/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { HugeiconsIcon } from "@hugeicons/react";
import { BubbleChatQuestionIcon } from "@hugeicons/core-free-icons";
import { useTeamMembersList } from "@/services/team";
import { useUnreadCounts } from "@/services/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PresenceDot } from "@/components/ui/status-badge";
import { initials } from "@/lib/string";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";

function UnreadBadge({ count }: { count: number | undefined }) {
  if (!count) return null;
  return (
    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-status-red px-1.5 text-[10px] font-semibold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

/** DM chat id: sorted [myId, otherId] joined by "-" so both users share the same URL. */
function buildDmChatId(myUserId: string, otherUserId: string): string {
  return [myUserId, otherUserId].sort().join("-");
}

export function ChatSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const { data: activeOrganization } = authClient.useActiveOrganization();
  const currentUserId = session?.user?.id ?? null;
  const activeOrgId = activeOrganization?.id ?? null;

  const { data: membersData, isPending: membersPending } = useTeamMembersList({
    pageSize: 100,
  });
  const members = membersData?.data ?? [];

  const chatIds = React.useMemo(() => {
    const ids: string[] = [];
    if (activeOrgId) ids.push(activeOrgId);
    if (currentUserId) {
      for (const m of members) {
        if (m.userId !== currentUserId) ids.push(buildDmChatId(currentUserId, m.userId));
      }
    }
    return ids;
  }, [activeOrgId, currentUserId, members]);
  const { data: unread } = useUnreadCounts(chatIds);

  const chatSegment = pathname === "/chat" ? null : pathname.replace(/^\/chat\/?/, "").split("/")[0] ?? null;
  const isOrgChat = activeOrgId != null && chatSegment === activeOrgId;
  const orgChatHref = activeOrgId ? `/chat/${activeOrgId}` : "/chat";

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Chat</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isOrgChat} tooltip="Organization chat">
                  <Link href={orgChatHref} className="flex items-center gap-2">
                    <HugeiconsIcon icon={BubbleChatQuestionIcon} strokeWidth={2} />
                    <span>Organization chat</span>
                    <UnreadBadge count={activeOrgId ? unread?.[activeOrgId] : 0} />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Team</SidebarGroupLabel>
          <SidebarGroupContent>
            {membersPending ? (
              <SidebarMenu>
                {[1, 2, 3].map((i) => (
                  <SidebarMenuItem key={i}>
                    <div className="flex items-center gap-2 px-2 py-1.5">
                      <Skeleton className="size-8 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            ) : (
              <SidebarMenu className="gap-1">
                {members.map((m) => {
                  const dmChatId = currentUserId ? buildDmChatId(currentUserId, m.userId) : null;
                  const href = dmChatId ? `/chat/${dmChatId}` : "/chat";
                  const isActive = chatSegment === dmChatId;
                  return (
                    <SidebarMenuItem key={m.id}>
                      <SidebarMenuButton
                        asChild
                        className="flex items-center font-normal"
                        tooltip={m.user.name ?? m.user.email}
                        isActive={isActive}
                      >
                        <Link href={href}>
                          <span className="relative inline-flex shrink-0">
                            <Avatar className="size-6 rounded-full">
                              <AvatarImage
                                src={m.user.image ?? m.user.githubProfile?.avatarUrl ?? undefined}
                                alt=""
                              />
                              <AvatarFallback className="text-xs">
                                {initials(m.user.name ?? m.user.email)}
                              </AvatarFallback>
                            </Avatar>
                            <PresenceDot lastSeenAt={m.lastSeenAt} className="absolute -bottom-0.5 -right-0.5 size-2" />
                          </span>
                          <span className="truncate text-sm">
                            {m.user.name || m.user.email || "Member"}
                          </span>
                          <UnreadBadge count={dmChatId ? unread?.[dmChatId] : 0} />
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
                {members.length === 0 && (
                  <SidebarMenuItem>
                    <p className="px-2 py-1.5 text-muted-foreground text-sm">
                      No members
                    </p>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
