import { apiFetch, ApiError } from "./client"
import { refrescarTokens } from "./auth"
import { leerSesion, guardarSesion, limpiarSesion } from "@/lib/auth/session"

type Opts = Omit<Parameters<typeof apiFetch>[1] & object, "token">

/**
 * Fetch autenticado: adjunta el accessToken de la sesión y, si el backend
 * responde 401, intenta refrescar con el refreshToken y reintenta una vez.
 * Si el refresh falla, limpia la sesión (el guard redirige a /login).
 */
export async function authedFetch<T>(path: string, opts: Opts = {}): Promise<T> {
  const s = leerSesion()
  if (!s) throw new ApiError(401, "Sin sesión")

  try {
    return await apiFetch<T>(path, { ...opts, token: s.accessToken })
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      try {
        const nuevos = await refrescarTokens({ refreshToken: s.refreshToken })
        guardarSesion(nuevos)
        return await apiFetch<T>(path, { ...opts, token: nuevos.accessToken })
      } catch {
        limpiarSesion()
        throw e
      }
    }
    throw e
  }
}
