import { authedFetch } from "./authed"

export type EstadoRegistro =
  | "ACTIVO"
  | "INACTIVO"
  | "SUSPENDIDO"
  | "ARCHIVADO"
  | "ELIMINADO"

export type TipoCliente = "PERSONA" | "EMPRESA"

export type TipoDocumento =
  | "DNI"
  | "RUC"
  | "CE"
  | "PASAPORTE"
  | "ID_TRIBUTARIO_EXTRANJERO"
  | "OTRO"

export type Cliente = {
  id: string
  codigo: string
  tipo: TipoCliente
  documentType?: TipoDocumento | null
  documentNumber?: string | null
  razonSocial: string
  nombreComercial?: string | null
  email?: string | null
  phone?: string | null
  estado: EstadoRegistro
}

export const listarClientes = (q?: string) =>
  authedFetch<Cliente[]>(`/clientes${q ? `?q=${encodeURIComponent(q)}` : ""}`)

export const obtenerCliente = (id: string) =>
  authedFetch<Cliente>(`/clientes/${id}`)

export type CrearClienteDto = {
  codigo: string
  tipo: TipoCliente
  documentType?: TipoDocumento
  documentNumber?: string
  razonSocial: string
  nombreComercial?: string
  email?: string
  phone?: string
  defaultCurrency?: string
}

export const crearCliente = (dto: CrearClienteDto) =>
  authedFetch<{ id: string; codigo: string; razonSocial: string; estado: string }>(
    "/clientes",
    { method: "POST", body: dto }
  )

export type ActualizarClienteDto = {
  razonSocial?: string
  nombreComercial?: string
  email?: string
  phone?: string
}

export const actualizarCliente = (id: string, dto: ActualizarClienteDto) =>
  authedFetch<{ id: string; razonSocial: string; estado: string }>(
    `/clientes/${id}`,
    { method: "PATCH", body: dto }
  )

export const desactivarCliente = (id: string) =>
  authedFetch<{ id: string; estado: string }>(`/clientes/${id}/desactivar`, {
    method: "POST",
  })

export const TIPOS_DOCUMENTO: { value: TipoDocumento; label: string }[] = [
  { value: "DNI", label: "DNI" },
  { value: "RUC", label: "RUC" },
  { value: "CE", label: "Carné extranjería" },
  { value: "PASAPORTE", label: "Pasaporte" },
  { value: "OTRO", label: "Otro" },
]
