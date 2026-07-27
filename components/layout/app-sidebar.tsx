"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { RiSearchLine } from "@remixicon/react"

import { GekkoMark } from "@/components/brand/gekko-logo"

import { cn } from "@/lib/utils"
import { siteConfig } from "@/lib/config/site"
import {
  primaryNav,
  type Workspace,
} from "@/lib/config/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher"
import { NavUser } from "@/components/layout/nav-user"
import { useUsuarioActual } from "@/hooks/use-usuario-actual"

const badgeTone: Record<string, string> = {
  success: "bg-emerald-500 text-white",
  warning: "bg-amber-500 text-white",
  info: "bg-sky-500 text-white",
}

export function AppSidebar() {
  const pathname = usePathname()
  const [workspace, setWorkspace] = React.useState<Workspace>("operacion")
  const sections = primaryNav[workspace]
  const user = useUsuarioActual()

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/")

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-3">
        {/* Marca */}
        <div className="flex items-center justify-between gap-2 px-1 pt-1">
          <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <GekkoMark className="size-5" />
            </span>
            <div className="flex items-baseline gap-1 group-data-[collapsible=icon]:hidden">
              <span className="text-base font-semibold">{siteConfig.shortName}</span>
              <span className="text-xs text-sidebar-foreground/50">
                {siteConfig.version}
              </span>
            </div>
          </Link>
        </div>

        {/* Búsqueda */}
        <div className="relative group-data-[collapsible=icon]:hidden">
          <RiSearchLine className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sidebar-foreground/50" />
          <SidebarInput placeholder="Buscar…" className="h-9 rounded-full pl-9" />
        </div>

        {/* Selector de espacio de trabajo */}
        <WorkspaceSwitcher value={workspace} onValueChange={setWorkspace} />
      </SidebarHeader>

      <SidebarContent className="px-1">
        {sections.map((section, i) => (
          <SidebarGroup key={section.label ?? `section-${i}`}>
            {section.label ? (
              <SidebarGroupLabel className="uppercase tracking-wider">
                {section.label}
              </SidebarGroupLabel>
            ) : null}
            {section.label ? <SidebarSeparator className="mb-1" /> : null}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isActive(item.href)}
                      tooltip={item.title}
                      render={<Link href={item.href} />}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                    {item.badge ? (
                      <SidebarMenuBadge
                        className={cn(
                          "rounded-full px-1.5",
                          badgeTone[item.badgeTone ?? "info"]
                        )}
                      >
                        {item.badge}
                      </SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
