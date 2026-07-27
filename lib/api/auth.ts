import { apiFetch } from "./client"
import type {
  LoginGoogleDto,
  RefrescarDto,
  TokensEmitidos,
  UsuarioAutenticado,
} from "./types"

/** POST /identidad/auth/google — login passwordless con Google. */
export function loginGoogle(dto: LoginGoogleDto) {
  return apiFetch<TokensEmitidos>("/identidad/auth/google", {
    method: "POST",
    body: dto,
  })
}

/** POST /identidad/auth/refrescar — renueva los tokens. */
export function refrescarTokens(dto: RefrescarDto) {
  return apiFetch<TokensEmitidos>("/identidad/auth/refrescar", {
    method: "POST",
    body: dto,
  })
}

/** GET /identidad/auth/perfil — usuario autenticado. */
export function obtenerPerfil(token: string) {
  return apiFetch<UsuarioAutenticado>("/identidad/auth/perfil", { token })
}
