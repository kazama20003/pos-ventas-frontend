"use client"

import * as React from "react"

import { authedFetch } from "@/lib/api/authed"
import { leerPerfil, leerSesion, limpiarSesion } from "@/lib/auth/session"
import type { UsuarioAutenticado } from "@/lib/api/types"

export type EstadoAuth = "cargando" | "autenticado" | "anonimo"

export type UsuarioVista = {
  name: string
  email: string
  picture?: string
}

type AuthContextValue = {
  status: EstadoAuth
  user: UsuarioVista | null
  logout: () => void
  refrescarPerfil: () => void
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

function nombreDesdeEmail(email: string): string {
  const local = email.split("@")[0] ?? ""
  if (!local) return "Cuenta"
  return local.replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).trim()
}

/** Estado de autenticación global y reutilizable (sin librerías externas). */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<EstadoAuth>("cargando")
  const [user, setUser] = React.useState<UsuarioVista | null>(null)

  const verificar = React.useCallback(() => {
    // Perfil cacheado de Google → pinta el avatar al instante.
    const cache = leerPerfil()
    if (cache?.email) {
      setUser({
        name: cache.name || nombreDesdeEmail(cache.email),
        email: cache.email,
        picture: cache.picture,
      })
    }

    if (!leerSesion()) {
      setStatus("anonimo")
      return
    }

    // Hay sesión: mientras validamos /perfil el estado es "cargando", NO el
    // valor previo. Si no, tras registrarse/loguear el guard ve "anonimo" y
    // redirige a /login antes de que /perfil resuelva (rebote al login).
    setStatus("cargando")

    let vivo = true
    authedFetch<UsuarioAutenticado>("/identidad/auth/perfil")
      .then((u) => {
        if (!vivo) return
        setUser((prev) => ({
          name: prev?.name || nombreDesdeEmail(u.email),
          email: u.email,
          picture: prev?.picture,
        }))
        setStatus("autenticado")
      })
      .catch(() => {
        if (vivo) setStatus("anonimo")
      })
    return () => {
      vivo = false
    }
  }, [])

  React.useEffect(() => {
    verificar()
  }, [verificar])

  const logout = React.useCallback(() => {
    limpiarSesion()
    setUser(null)
    setStatus("anonimo")
  }, [])

  const value = React.useMemo<AuthContextValue>(
    () => ({ status, user, logout, refrescarPerfil: verificar }),
    [status, user, logout, verificar]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext(): AuthContextValue {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuthContext debe usarse dentro de <AuthProvider>")
  return ctx
}
