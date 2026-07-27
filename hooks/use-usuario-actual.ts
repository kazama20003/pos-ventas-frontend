"use client"

import * as React from "react"

import { obtenerPerfil } from "@/lib/api/auth"
import { leerSesion } from "@/lib/auth/session"

export type UsuarioVista = {
  name: string
  email: string
  avatar?: string
}

const INVITADO: UsuarioVista = { name: "Invitado", email: "" }

/** Deriva un nombre presentable a partir del correo (el perfil no trae nombre). */
function nombreDesdeEmail(email: string): string {
  const local = email.split("@")[0] ?? ""
  if (!local) return "Cuenta"
  return local
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

export function useUsuarioActual(): UsuarioVista {
  const [usuario, setUsuario] = React.useState<UsuarioVista>(INVITADO)

  React.useEffect(() => {
    const sesion = leerSesion()
    if (!sesion) return
    let activo = true
    obtenerPerfil(sesion.accessToken)
      .then((perfil) => {
        if (!activo) return
        setUsuario({
          name: nombreDesdeEmail(perfil.email),
          email: perfil.email,
        })
      })
      .catch(() => {
        /* sesión inválida: se mantiene INVITADO */
      })
    return () => {
      activo = false
    }
  }, [])

  return usuario
}
