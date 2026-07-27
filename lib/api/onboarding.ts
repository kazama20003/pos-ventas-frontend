import { apiFetch } from "./client"
import type {
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
