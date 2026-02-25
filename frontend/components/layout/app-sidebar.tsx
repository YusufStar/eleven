"use client"

import * as React from "react"

import { NavMain } from "@/components/layout/nav-main"
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
  ContactIcon,
  PipelineIcon,
  UserGroupIcon,
  Settings05Icon,
  Task01Icon,
  ChartIcon,
  Notification01Icon,
  CreditCardIcon,
  Folder01Icon,
  File02Icon,
} from "@hugeicons/core-free-icons"

const navMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: <HugeiconsIcon icon={Home02Icon} strokeWidth={2} />,
    items: [
      { title: "Overview", url: "/dashboard" },
      { title: "Metrics", url: "/dashboard/metrics" },
    ],
  },
  {
    title: "Contacts",
    url: "/dashboard/contacts",
    icon: <HugeiconsIcon icon={ContactIcon} strokeWidth={2} />,
    items: [
      { title: "People", url: "/dashboard/contacts/people" },
      { title: "Companies", url: "/dashboard/contacts/companies" },
    ],
  },
  {
    title: "Pipeline",
    url: "/dashboard/deals",
    icon: <HugeiconsIcon icon={PipelineIcon} strokeWidth={2} />,
    items: [
      { title: "Board", url: "/dashboard/deals" },
      { title: "All deals", url: "/dashboard/deals/list" },
      { title: "Stages", url: "/dashboard/deals/stages" },
    ],
  },
  {
    title: "Projects",
    url: "/dashboard/projects",
    icon: <HugeiconsIcon icon={Folder01Icon} strokeWidth={2} />,
    items: [
      { title: "All projects", url: "/dashboard/projects" },
    ],
  },
  {
    title: "Files",
    url: "/dashboard/files",
    icon: <HugeiconsIcon icon={File02Icon} strokeWidth={2} />,
    items: [
      { title: "All files", url: "/dashboard/files" },
    ],
  },
  {
    title: "Tasks",
    url: "/dashboard/tasks",
    icon: <HugeiconsIcon icon={Task01Icon} strokeWidth={2} />,
    items: [
      { title: "All tasks", url: "/dashboard/tasks" },
    ],
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
    title: "Activities",
    url: "/dashboard/activities",
    icon: <HugeiconsIcon icon={Task01Icon} strokeWidth={2} />,
    items: [
      { title: "Tasks", url: "/dashboard/activities" },
      { title: "Calendar", url: "/dashboard/activities/calendar" },
      { title: "Log", url: "/dashboard/activities/log" },
    ],
  },
  {
    title: "Reports",
    url: "/dashboard/reports",
    icon: <HugeiconsIcon icon={ChartIcon} strokeWidth={2} />,
    items: [
      { title: "Sales analytics", url: "/dashboard/reports" },
      { title: "Win / Loss", url: "/dashboard/reports/win-loss" },
      { title: "Pipeline report", url: "/dashboard/reports/pipeline" },
    ],
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: <HugeiconsIcon icon={Settings05Icon} strokeWidth={2} />,
    items: [
      { title: "Organization", url: "/dashboard/settings" },
      { title: "Profile", url: "/dashboard/settings/profile" },
      { title: "Plan", url: "/dashboard/settings/plan" },
      { title: "Integrations", url: "/dashboard/settings/integrations" },
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
    title: "Billing",
    url: "/dashboard/billing",
    icon: <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />,
    items: [
      { title: "Invoices", url: "/dashboard/billing" },
      { title: "Upgrade plan", url: "/dashboard/billing/upgrade" },
      { title: "Payment method", url: "/dashboard/billing/payment" },
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
