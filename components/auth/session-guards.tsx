"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { useAuthContext } from "@/components/auth/auth-provider"

function Cargando() {
  return (
    <div className="flex h-svh w-full items-center justify-center bg-background">
      <div className="size-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
    </div>
  )
}

/** Protege rutas privadas: sin sesión válida → /login. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuthContext()
  const router = useRouter()

  React.useEffect(() => {
    if (status === "anonimo") router.replace("/login")
  }, [status, router])

  if (status !== "autenticado") return <Cargando />
  return <>{children}</>
}

/** Rutas de auth: si ya hay sesión válida → /dashboard (no re-mostrar login). */
export function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const { status } = useAuthContext()
  const router = useRouter()

  React.useEffect(() => {
    if (status === "autenticado") router.replace("/dashboard")
  }, [status, router])

  if (status === "autenticado") return null
  return <>{children}</>
}
