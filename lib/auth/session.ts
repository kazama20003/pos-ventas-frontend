import type { TokensEmitidos } from "@/lib/api/types"

const KEY = "gekko.session"

/** Sesión mínima en el cliente. Reemplazar por cookies httpOnly en producción. */
export function guardarSesion(tokens: TokensEmitidos) {
  if (typeof window === "undefined") return
  localStorage.setItem(KEY, JSON.stringify(tokens))
}

export function leerSesion(): TokensEmitidos | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(KEY)
  return raw ? (JSON.parse(raw) as TokensEmitidos) : null
}

export function limpiarSesion() {
  if (typeof window === "undefined") return
  localStorage.removeItem(KEY)
}
