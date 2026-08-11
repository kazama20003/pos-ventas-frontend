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

/* ------------------------------------------------------------------ */
/* Flujos de onboarding contextual                                    */
/* ------------------------------------------------------------------ */

export type EstadoPasoFlujo =
  | "PENDIENTE"
  | "COMPLETADO"
  | "OMITIDO"
  | "DESCARTADO"

export type PasoFlujo = {
  stepKey: string
  evento: string
  vista: string
  status: EstadoPasoFlujo
  /** true si el estado se derivó de un evento real (no de un override manual). */
  derivado: boolean
}

export type FlujoOnboarding = {
  flowKey: string
  titulo: string
  descartado: boolean
  completado: boolean
  pasoActivo: string | null
  pasos: PasoFlujo[]
}

export type RespuestaFlujos = {
  hechos: Record<string, boolean>
  flujos: FlujoOnboarding[]
}

/** GET /onboarding/flujos — estado de todos los flujos de onboarding. */
export function obtenerFlujos() {
  return authedFetch<RespuestaFlujos>("/onboarding/flujos")
}

/**
 * PATCH /onboarding/flujos/:flowKey/pasos/:stepKey — override manual de un
 * paso. Con stepKey "_flow" descarta el flujo completo.
 */
export function actualizarPasoFlujo(
  flowKey: string,
  stepKey: string,
  status: "PENDIENTE" | "OMITIDO" | "DESCARTADO",
) {
  return authedFetch<RespuestaFlujos>(
    `/onboarding/flujos/${flowKey}/pasos/${stepKey}`,
    { method: "PATCH", body: { status } },
  )
}
