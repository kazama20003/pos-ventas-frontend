import type { TokensEmitidos } from "@/lib/api/types"

const TOKENS_KEY = "gekko.session"
const PERFIL_KEY = "gekko.perfil"

export type PerfilCache = {
  name?: string
  email?: string
  picture?: string
}

/** Sesión mínima en el cliente. Reemplazar por cookies httpOnly en producción. */
export function guardarSesion(tokens: TokensEmitidos) {
  if (typeof window === "undefined") return
  localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens))
  // Nuevo inicio de sesión = guiado fresco: la bienvenida y los coach-marks
  // deben volver a presentarse para esta cuenta (los flags viven en el
  // navegador, no en el usuario).
  try {
    sessionStorage.removeItem("gekko.guide.welcomed")
    sessionStorage.removeItem("guide-intent")
    for (const k of Object.keys(sessionStorage)) {
      if (k.startsWith("tour:")) sessionStorage.removeItem(k)
    }
    localStorage.removeItem("gekko.guide.welcomed")
  } catch {
    /* sin storage */
  }
}

export function leerSesion(): TokensEmitidos | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(TOKENS_KEY)
  return raw ? (JSON.parse(raw) as TokensEmitidos) : null
}

export function limpiarSesion() {
  if (typeof window === "undefined") return
  localStorage.removeItem(TOKENS_KEY)
  localStorage.removeItem(PERFIL_KEY)
}

/** Decodifica el payload de un JWT (idToken de Google) sin verificar la firma. */
function decodificarJwt(token: string): Record<string, unknown> {
  try {
    const payload = token.split(".")[1]
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    return JSON.parse(decodeURIComponent(escape(json)))
  } catch {
    return {}
  }
}

/**
 * Extrae nombre/correo/foto del idToken de Google y los cachea para pintar el
 * avatar del sidebar al instante (sin esperar a /perfil).
 */
export function guardarPerfilDesdeIdToken(idToken: string) {
  if (typeof window === "undefined") return
  const p = decodificarJwt(idToken)
  const perfil: PerfilCache = {
    name: typeof p.name === "string" ? p.name : undefined,
    email: typeof p.email === "string" ? p.email : undefined,
    picture: typeof p.picture === "string" ? p.picture : undefined,
  }
  localStorage.setItem(PERFIL_KEY, JSON.stringify(perfil))
}

export function leerPerfil(): PerfilCache | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(PERFIL_KEY)
  return raw ? (JSON.parse(raw) as PerfilCache) : null
}
