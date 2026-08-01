"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"

import { misPermisos } from "@/lib/api/usuarios"
import { leerSesion } from "@/lib/auth/session"

export type PermisosState = {
  /** ¿Tiene alguno de estos permisos? Admin siempre true. */
  can: (...claves: string[]) => boolean
  esAdmin: boolean
  isLoading: boolean
  /** true cuando ya se resolvió la consulta (para no ocultar en el flash inicial). */
  cargado: boolean
}

/**
 * Permisos del usuario logueado. Mientras carga, `can` devuelve true (optimista)
 * para no parpadear ocultando y mostrando; una vez cargado, filtra de verdad.
 * El backend igual protege cada endpoint: esto es solo para la UI.
 */
export function usePermisos(): PermisosState {
  const hasSession = typeof window !== "undefined" && leerSesion() != null
  const q = useQuery({
    queryKey: ["mis-permisos"],
    queryFn: misPermisos,
    staleTime: 1000 * 60 * 5,
    enabled: hasSession,
  })

  const set = React.useMemo(
    () => new Set(q.data?.permisos ?? []),
    [q.data]
  )
  const esAdmin = q.data?.esAdmin ?? false
  const cargado = q.isSuccess

  const can = React.useCallback(
    (...claves: string[]) => {
      if (!cargado) return true // optimista mientras carga
      if (esAdmin) return true
      if (claves.length === 0) return true
      return claves.some((c) => set.has(c))
    },
    [cargado, esAdmin, set]
  )

  return { can, esAdmin, isLoading: q.isLoading, cargado }
}
