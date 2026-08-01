"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"

import { misSucursales, type MisSucursales } from "@/lib/api/usuarios"
import { leerSesion } from "@/lib/auth/session"
import { useSucursalStore } from "@/lib/stores/sucursal-activa"

export type SucursalOpcion = { id: string; codigo: string; nombre: string }

export type SucursalActiva = {
  /** Sucursales donde el usuario puede operar. */
  sucursales: SucursalOpcion[]
  /** true si el usuario es global (admin / rol sin sucursal). */
  global: boolean
  /** ID efectivo: el elegido si sigue siendo válido, o la primera permitida. */
  sucursalId: string | null
  sucursal: SucursalOpcion | null
  setSucursal: (id: string) => void
  almacenId: string | null
  setAlmacen: (id: string | null) => void
  sesionCajaId: string | null
  setSesionCaja: (id: string | null) => void
  isLoading: boolean
}

/**
 * Sucursal/almacén/caja activos del usuario. Deriva el ID efectivo sin escribir
 * en el store durante el render (evita efectos): si lo guardado ya no es válido
 * —p. ej. la sucursal fue archivada o el usuario cambió de permisos— cae a la
 * primera permitida. La escritura solo ocurre cuando el usuario elige.
 */
export function useSucursalActiva(): SucursalActiva {
  const hasSession = typeof window !== "undefined" && leerSesion() != null
  const q = useQuery<MisSucursales>({
    queryKey: ["mis-sucursales"],
    queryFn: misSucursales,
    staleTime: 1000 * 60 * 5,
    enabled: hasSession,
  })

  const sucursales = React.useMemo(() => q.data?.sucursales ?? [], [q.data])
  const guardada = useSucursalStore((s) => s.sucursalId)
  const setSucursal = useSucursalStore((s) => s.setSucursal)
  const almacenId = useSucursalStore((s) => s.almacenId)
  const setAlmacen = useSucursalStore((s) => s.setAlmacen)
  const sesionCajaId = useSucursalStore((s) => s.sesionCajaId)
  const setSesionCaja = useSucursalStore((s) => s.setSesionCaja)

  const sucursalId =
    guardada && sucursales.some((s) => s.id === guardada)
      ? guardada
      : (sucursales[0]?.id ?? null)

  const sucursal = sucursales.find((s) => s.id === sucursalId) ?? null

  return {
    sucursales,
    global: q.data?.global ?? false,
    sucursalId,
    sucursal,
    setSucursal,
    almacenId,
    setAlmacen,
    sesionCajaId,
    setSesionCaja,
    isLoading: q.isLoading,
  }
}
