"use client"

import * as React from "react"
import { useEffect, useState } from "react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import { UnfoldMoreIcon, PlusSignIcon } from "@hugeicons/core-free-icons"
import { authClient } from "@/lib/auth-client"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { initials } from "@/lib/string"
import { CreateOrgModal } from "@/components/auth/create-org-modal"

export function TeamSwitcher() {
  const { isMobile } = useSidebar()
  const [createOrgOpen, setCreateOrgOpen] = useState(false)
  const { data: organizations, isPending: isOrganizationsPending } = authClient.useListOrganizations()
  const { data: activeOrganization, isPending: isActiveOrganizationPending } = authClient.useActiveOrganization()

  const setActiveOrganization = async (organizationId: string) => {
    await authClient.organization.setActive({
      organizationId,
    })
  }

  useEffect(() => {
    if (!isOrganizationsPending && !isActiveOrganizationPending && organizations && organizations.length > 0 && !activeOrganization) {
      setActiveOrganization(organizations[0].id)
    }
  }, [organizations, activeOrganization, isOrganizationsPending, isActiveOrganizationPending])

  if (!organizations || !activeOrganization) {
    return null
  }

  return (
    <>
      <CreateOrgModal
        open={createOrgOpen}
        onOpenChange={setCreateOrgOpen}
      />
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarImage className="rounded-lg" src={activeOrganization.logo ?? undefined} />
                <AvatarFallback className="rounded-lg">
                  {initials(activeOrganization.name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeOrganization.name}</span>
                <span className="truncate text-xs">Free</span>
              </div>
              <HugeiconsIcon icon={UnfoldMoreIcon} strokeWidth={2} className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Teams
            </DropdownMenuLabel>
            {organizations.map((organization, index) => (
              <DropdownMenuItem
                key={organization.id}
                onClick={() => setActiveOrganization(organization.id)}
                className="gap-2 p-2"
              >
                <Avatar className="size-6 rounded-md">
                  <AvatarImage className="rounded-lg" src={organization.logo ?? undefined} />
                  <AvatarFallback className="rounded-md">
                    {initials(organization.name)}
                  </AvatarFallback>
                </Avatar>
                {organization.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={() => setCreateOrgOpen(true)}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">Add organization</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
    </>
  )
}
