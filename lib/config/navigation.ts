import {
  RiDashboardLine,
  RiPriceTag3Line,
  RiShoppingCart2Line,
  RiArchiveLine,
  RiUser3Line,
  RiCashLine,
  RiFileList3Line,
  RiSettings3Line,
  RiNotification3Line,
  RiChat3Line,
  RiBuilding2Line,
  RiWallet3Line,
  RiTeamLine,
} from "@remixicon/react"
import type * as React from "react"

export type NavIcon = React.ComponentType<{ className?: string }>

export type NavItem = {
  title: string
  href: string
  icon: NavIcon
  badge?: string
  badgeTone?: "success" | "warning" | "info"
}

export type NavSection = {
  label?: string
  items: NavItem[]
}

export type Workspace = "operacion" | "administracion"

/** Menú principal por espacio de trabajo (refleja los 2 contextos del backend). */
export const primaryNav: Record<Workspace, NavSection[]> = {
  operacion: [
    {
      items: [
        { title: "Dashboard", href: "/dashboard", icon: RiDashboardLine },
        { title: "Productos", href: "/productos", icon: RiPriceTag3Line },
        { title: "Ventas", href: "/ventas", icon: RiShoppingCart2Line },
        { title: "Inventario", href: "/inventario", icon: RiArchiveLine },
        { title: "Clientes", href: "/clientes", icon: RiUser3Line },
        { title: "Caja", href: "/caja", icon: RiCashLine },
      ],
    },
    {
      label: "Cuenta",
      items: [
        {
          title: "Notificaciones",
          href: "/notificaciones",
          icon: RiNotification3Line,
          badge: "24",
          badgeTone: "success",
        },
        {
          title: "Mensajes",
          href: "/mensajes",
          icon: RiChat3Line,
          badge: "8",
          badgeTone: "warning",
        },
        { title: "Configuración", href: "/configuracion", icon: RiSettings3Line },
      ],
    },
  ],
  administracion: [
    {
      items: [
        { title: "Dashboard", href: "/dashboard", icon: RiDashboardLine },
        { title: "Empresas", href: "/empresas", icon: RiBuilding2Line },
        { title: "Sucursales", href: "/sucursales", icon: RiTeamLine },
        { title: "Suscripción", href: "/suscripcion", icon: RiWallet3Line },
        { title: "Reportes", href: "/reportes", icon: RiFileList3Line },
      ],
    },
    {
      label: "Cuenta",
      items: [
        {
          title: "Notificaciones",
          href: "/notificaciones",
          icon: RiNotification3Line,
          badge: "3",
          badgeTone: "info",
        },
        { title: "Configuración", href: "/configuracion", icon: RiSettings3Line },
      ],
    },
  ],
}

export const workspaceLabels: Record<Workspace, string> = {
  operacion: "Operación",
  administracion: "Admin",
}

/** Navegación pública del landing. */
export const marketingNav: { title: string; href: string }[] = [
  { title: "Producto", href: "/#producto" },
  { title: "Funciones", href: "/#funciones" },
  { title: "Precios", href: "/#precios" },
  { title: "Contacto", href: "/#contacto" },
]
