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
  LayoutBottomIcon,
  AudioWave01Icon,
  CommandIcon,
  Home02Icon,
  ContactIcon,
  PipelineIcon,
  UserGroupIcon,
  Settings05Icon,
  Task01Icon,
  ChartIcon,
  Notification01Icon,
  CreditCardIcon,
} from "@hugeicons/core-free-icons"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "https://github.com/shadcn.png",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: <HugeiconsIcon icon={LayoutBottomIcon} strokeWidth={2} />,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: <HugeiconsIcon icon={AudioWave01Icon} strokeWidth={2} />,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: <HugeiconsIcon icon={CommandIcon} strokeWidth={2} />,
      plan: "Free",
    },
  ],
  navMain: [
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
        { title: "All contacts", url: "/dashboard/contacts" },
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
      title: "Team",
      url: "/dashboard/team",
      icon: <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} />,
      items: [
        { title: "Members", url: "/dashboard/team" },
        { title: "Invite", url: "/dashboard/team/invite" },
        { title: "Roles", url: "/dashboard/team/roles" },
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
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
