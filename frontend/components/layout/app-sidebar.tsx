"use client"

import * as React from "react"

import { NavMain, type NavMainItem } from "@/components/layout/nav-main"
import { NavUser } from "@/components/layout/nav-user"
import { TeamSwitcher } from "@/components/layout/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Home02Icon,
  UserGroupIcon,
  Settings05Icon,
  Task01Icon,
  Activity01Icon,
  ChartIcon,
  Notification01Icon,
  Folder01Icon,
  File02Icon,
  BubbleChatQuestionIcon,
  AiVideoIcon,
  RocketIcon,
} from "@hugeicons/core-free-icons"

const navMain: NavMainItem[] = [
  {
    title: "Chat",
    url: "/chat",
    icon: <HugeiconsIcon icon={BubbleChatQuestionIcon} strokeWidth={2} />,
  },
  {
    title: "Meet",
    url: "/meet",
    icon: <HugeiconsIcon icon={AiVideoIcon} strokeWidth={2} />,
  },
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: <HugeiconsIcon icon={Home02Icon} strokeWidth={2} />,
  },
  {
    title: "Tasks",
    url: "/dashboard/tasks",
    icon: <HugeiconsIcon icon={Task01Icon} strokeWidth={2} />,
  },
  {
    title: "Sprints",
    url: "/dashboard/sprints",
    icon: <HugeiconsIcon icon={RocketIcon} strokeWidth={2} />,
  },
  {
    title: "Projects",
    url: "/dashboard/projects",
    icon: <HugeiconsIcon icon={Folder01Icon} strokeWidth={2} />,
  },
  {
    title: "Files",
    url: "/dashboard/files",
    icon: <HugeiconsIcon icon={File02Icon} strokeWidth={2} />,
  },
  {
    title: "Team",
    url: "/dashboard/team",
    icon: <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} />,
    items: [
      { title: "Members", url: "/dashboard/team" },
      { title: "Invite", url: "/dashboard/team/invite" },
    ],
  },
  {
    title: "Activity",
    url: "/dashboard/activities",
    icon: <HugeiconsIcon icon={Activity01Icon} strokeWidth={2} />,
  },
  {
    title: "Analytics",
    url: "/dashboard/metrics",
    icon: <HugeiconsIcon icon={ChartIcon} strokeWidth={2} />,
    items: [
      { title: "Metrics", url: "/dashboard/metrics" },
      { title: "AI Reports", url: "/dashboard/reports" },
    ],
  },
  {
    title: "Notifications",
    url: "/dashboard/notifications",
    icon: <HugeiconsIcon icon={Notification01Icon} strokeWidth={2} />,
    items: [
      { title: "All", url: "/dashboard/notifications" },
      { title: "Preferences", url: "/dashboard/notifications/preferences" },
    ],
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: <HugeiconsIcon icon={Settings05Icon} strokeWidth={2} />,
    items: [
      { title: "Organization", url: "/dashboard/settings" },
      { title: "Profile", url: "/dashboard/settings/profile" },
    ],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
