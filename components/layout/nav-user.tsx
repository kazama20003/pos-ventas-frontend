"use client"

import Link from "next/link"
import {
  RiMore2Line,
  RiUser3Line,
  RiSettings3Line,
  RiLogoutBoxRLine,
} from "@remixicon/react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type UserData = {
  name: string
  email: string
  avatar?: string
}

export function NavUser({ user }: { user: UserData }) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button className="flex w-full items-center gap-2 rounded-2xl border border-sidebar-border bg-sidebar-accent/40 p-1.5 text-left transition-colors hover:bg-sidebar-accent group-data-[collapsible=icon]:border-transparent group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0" />
        }
      >
        <Avatar className="size-9 rounded-full">
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback className="rounded-full bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="grid flex-1 leading-tight group-data-[collapsible=icon]:hidden">
          <span className="truncate text-sm font-medium">{user.name}</span>
          <span className="truncate text-xs text-sidebar-foreground/60">
            {user.email}
          </span>
        </div>
        <RiMore2Line className="size-4 shrink-0 text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="end"
        sideOffset={8}
        className="w-56"
      >
        <DropdownMenuLabel className="flex items-center gap-2">
          <Avatar className="size-8 rounded-full">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="rounded-full bg-primary/10 text-primary text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="grid leading-tight">
            <span className="truncate text-sm font-medium">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {user.email}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/configuracion" />}>
          <RiUser3Line />
          Mi perfil
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/configuracion" />}>
          <RiSettings3Line />
          Configuración
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          render={<Link href="/login" />}
        >
          <RiLogoutBoxRLine />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
