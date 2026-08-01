import { authedFetch } from "./authed"

export type EstadoRegistro =
  | "ACTIVO"
  | "INACTIVO"
  | "SUSPENDIDO"
  | "ARCHIVADO"
  | "ELIMINADO"

export type TipoDocumento =
  | "DNI"
  | "RUC"
  | "CE"
  | "PASAPORTE"
  | "ID_TRIBUTARIO_EXTRANJERO"
  | "OTRO"

export type Proveedor = {
  id: string
  codigo: string
  razonSocial: string
  documentType?: TipoDocumento | null
  documentNumber?: string | null
  nombreComercial?: string | null
  contactName?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  moneda?: string
  paymentTermDays: number
  estado: EstadoRegistro
}

export const listarProveedores = (q?: string) =>
  authedFetch<Proveedor[]>(
    `/proveedores${q ? `?q=${encodeURIComponent(q)}` : ""}`
  )

export const obtenerProveedor = (id: string) =>
  authedFetch<Proveedor>(`/proveedores/${id}`)

export type CrearProveedorDto = {
  codigo: string
  razonSocial: string
  documentType?: TipoDocumento
  documentNumber?: string
  nombreComercial?: string
  contactName?: string
  email?: string
  phone?: string
  address?: string
  moneda?: string
  paymentTermDays?: number
}

export const crearProveedor = (dto: CrearProveedorDto) =>
  authedFetch<{ id: string; codigo: string; razonSocial: string; estado: string }>(
    "/proveedores",
    { method: "POST", body: dto }
  )

export type ActualizarProveedorDto = {
  razonSocial?: string
  contactName?: string
  email?: string
  phone?: string
  paymentTermDays?: number
}

export const actualizarProveedor = (id: string, dto: ActualizarProveedorDto) =>
  authedFetch<{ id: string; razonSocial: string; estado: string }>(
    `/proveedores/${id}`,
    { method: "PATCH", body: dto }
  )

export const desactivarProveedor = (id: string) =>
  authedFetch<{ id: string; estado: string }>(
    `/proveedores/${id}/desactivar`,
    { method: "POST" }
  )

export const TIPOS_DOCUMENTO: { value: TipoDocumento; label: string }[] = [
  { value: "RUC", label: "RUC" },
  { value: "DNI", label: "DNI" },
  { value: "CE", label: "Carné extranjería" },
  { value: "PASAPORTE", label: "Pasaporte" },
  { value: "OTRO", label: "Otro" },
]
