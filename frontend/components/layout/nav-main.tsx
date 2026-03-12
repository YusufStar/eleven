"use client"

import { useEffect, useState } from "react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import Link from "next/link"
import { usePathname } from "next/navigation"

function isPathActive(pathname: string, url: string) {
  if (pathname === url) return true
  if (url !== "/dashboard" && pathname.startsWith(url + "/")) return true
  return false
}

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
    isActive?: boolean
    openInNewTab?: boolean
    items?: { title: string; url: string }[]
  }[]
}) {
  const pathname = usePathname()
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const [openSections, setOpenSections] = useState<Set<string>>(new Set())

  useEffect(() => {
    const active = items.find(
      (item) =>
        isPathActive(pathname, item.url) ||
        item.items?.some((sub) => isPathActive(pathname, sub.url))
    )
    if (active) {
      setOpenSections((prev) => new Set(prev).add(active.title))
    }
  }, [pathname, items])

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Main</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const active =
            (isPathActive(pathname, item.url) ||
              item.items?.some((sub) => isPathActive(pathname, sub.url))) ??
            false
          const isOpen = openSections.has(item.title)
          const isNewTabLink =
            item.openInNewTab && item.items?.length === 1
          const newTabUrl = isNewTabLink ? item.items![0].url : null

          if (isNewTabLink && newTabUrl) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title} isActive={false}>
                  <a
                    href={newTabUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }

          if (isCollapsed) {
            return (
              <DropdownMenu key={item.title}>
                <SidebarMenuItem>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton tooltip={item.title} isActive={active}>
                      {item.icon}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="start" sideOffset={8}>
                    {item.items?.map((subItem) => (
                      <DropdownMenuItem key={subItem.title} asChild>
                        {item.openInNewTab ? (
                          <a
                            href={subItem.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {subItem.title}
                          </a>
                        ) : (
                          <Link href={subItem.url}>{subItem.title}</Link>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </SidebarMenuItem>
              </DropdownMenu>
            )
          }

          return (
            <Collapsible
              key={item.title}
              asChild
              open={isOpen}
              onOpenChange={(open) =>
                setOpenSections((prev) => {
                  const next = new Set(prev)
                  if (open) next.add(item.title)
                  else next.delete(item.title)
                  return next
                })
              }
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title} isActive={active}>
                    {item.icon}
                    <span>{item.title}</span>
                    <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => {
                      const isSubActive = pathname === subItem.url
                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild isActive={isSubActive}>
                            {item.openInNewTab ? (
                              <a
                                href={subItem.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full"
                              >
                                <span>{subItem.title}</span>
                              </a>
                            ) : (
                              <Link href={subItem.url} className="w-full">
                                <span>{subItem.title}</span>
                              </Link>
                            )}
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
