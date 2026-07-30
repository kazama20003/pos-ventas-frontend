"use client"

import * as React from "react"

import { authedFetch } from "@/lib/api/authed"
import { leerSesion, limpiarSesion } from "@/lib/auth/session"
import type { UsuarioAutenticado } from "@/lib/api/types"

export type EstadoAuth = "cargando" | "autenticado" | "anonimo"

export type AuthState = {
  status: EstadoAuth
  user: UsuarioAutenticado | null
  logout: () => void
}

/**
 * Verifica la sesión guardada contra GET /identidad/auth/perfil (con refresh
 * automático). Devuelve el estado para proteger rutas.
 */
export function useAuth(): AuthState {
  const [status, setStatus] = React.useState<EstadoAuth>("cargando")
  const [user, setUser] = React.useState<UsuarioAutenticado | null>(null)

  React.useEffect(() => {
    if (!leerSesion()) {
      setStatus("anonimo")
      return
    }
    let vivo = true
    authedFetch<UsuarioAutenticado>("/identidad/auth/perfil")
      .then((u) => {
        if (!vivo) return
        setUser(u)
        setStatus("autenticado")
      })
      .catch(() => {
        if (!vivo) return
        setStatus("anonimo")
      })
    return () => {
      vivo = false
    }
  }, [])

  const logout = React.useCallback(() => {
    limpiarSesion()
    setUser(null)
    setStatus("anonimo")
  }, [])

  return { status, user, logout }
}
