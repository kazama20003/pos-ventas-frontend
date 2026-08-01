import { authedFetch } from "./authed"

export type TipoDocumento =
  | "FACTURA"
  | "BOLETA"
  | "NOTA_CREDITO"
  | "NOTA_DEBITO"

export type EstadoRegistro = "ACTIVO" | "ARCHIVADO" | string

export type Serie = {
  id: string
  empresaId: string
  sucursalId: string | null
  documentType: TipoDocumento
  series: string
  nextNumber: number
  estado: EstadoRegistro
}

export const listarSeries = (empresaId: string) =>
  authedFetch<Serie[]>(`/series?empresaId=${encodeURIComponent(empresaId)}`)

export type CrearSerieDto = {
  empresaId: string
  sucursalId?: string
  documentType: TipoDocumento
  series: string
  nextNumber?: number
}

export const crearSerie = (dto: CrearSerieDto) =>
  authedFetch<Serie>("/series", { method: "POST", body: dto })

export const activarSerie = (id: string) =>
  authedFetch<{ id: string; estado: string }>(`/series/${id}/activar`, {
    method: "POST",
  })

export const archivarSerie = (id: string) =>
  authedFetch<{ id: string; estado: string }>(`/series/${id}/archivar`, {
    method: "POST",
  })

export const DOC_LABEL: Record<TipoDocumento, string> = {
  BOLETA: "Boleta",
  FACTURA: "Factura",
  NOTA_CREDITO: "Nota de crédito",
  NOTA_DEBITO: "Nota de débito",
}
