import { apiFetch } from "./client"
import { authedFetch } from "./authed"
import type {
  EstadoOnboarding,
  RegistrarEmpresaDto,
  RegistrarEmpresaResponse,
} from "./types"

/** POST /onboarding/registrar — alta self-service de empresa + admin. */
export function registrarEmpresa(dto: RegistrarEmpresaDto) {
  return apiFetch<RegistrarEmpresaResponse>("/onboarding/registrar", {
    method: "POST",
    body: dto,
  })
}

/** GET /onboarding/estado — progreso guiado hacia la primera venta. */
export function obtenerEstadoOnboarding() {
  return authedFetch<EstadoOnboarding>("/onboarding/estado")
}

/** PATCH /onboarding/estado/descartar — oculta la guía de primera venta. */
export function descartarOnboarding() {
  return authedFetch<EstadoOnboarding>("/onboarding/estado/descartar", {
    method: "PATCH",
  })
}
