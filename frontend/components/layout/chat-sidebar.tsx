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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/string";
import { Skeleton } from "@/components/ui/skeleton";

export function ChatSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const isOrgChat = pathname === "/chat";

  const { data: membersData, isPending: membersPending } = useTeamMembersList({
    pageSize: 100,
  });
  const members = membersData?.data ?? [];

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
                  <Link href="/chat" className="flex items-center gap-2">
                    <HugeiconsIcon icon={BubbleChatQuestionIcon} strokeWidth={2} />
                    <span>Organization chat</span>
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
                {members.map((m) => (
                  <SidebarMenuItem key={m.id}>
                    <SidebarMenuButton
                      className="flex items-center font-normal"
                      tooltip={m.user.name ?? m.user.email}
                      onClick={() => {
                        // TODO: open DM with m.userId
                      }}
                    >
                      <Avatar className="size-6 shrink-0 rounded-full">
                        <AvatarImage
                          src={m.user.image ?? m.user.githubProfile?.avatarUrl ?? undefined}
                          alt=""
                        />
                        <AvatarFallback className="text-xs">
                          {initials(m.user.name ?? m.user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate text-sm">
                        {m.user.name || m.user.email || "Member"}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
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
