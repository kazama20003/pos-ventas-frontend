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

// ---- Catálogo de aprovisionamiento: qué proveedor surte qué variante ----

/** Un proveedor que surte una variante (respuesta de proveedoresDeVariante). */
export type ProveedorDeVariante = {
  id: string
  proveedorId: string
  proveedorCodigo: string
  proveedorRazonSocial: string
  supplierSku: string | null
  costo: string
  moneda: string
  leadTimeDays: number
  minOrderQty: string
  isPreferred: boolean
}

/** Una variante surtida por un proveedor (respuesta de listarProductosProveedor). */
export type ProductoDeProveedor = {
  id: string
  varianteId: string
  sku: string
  nombreVariante: string
  productoCodigo: string
  productoNombre: string
  supplierSku: string | null
  costo: string
  moneda: string
  leadTimeDays: number
  minOrderQty: string
  isPreferred: boolean
}

export type VincularProductoProveedorDto = {
  varianteId: string
  supplierSku?: string
  costo: number
  moneda?: string
  leadTimeDays?: number
  minOrderQty?: number
  isPreferred?: boolean
}

export type ActualizarProductoProveedorDto = {
  supplierSku?: string
  costo?: number
  moneda?: string
  leadTimeDays?: number
  minOrderQty?: number
  isPreferred?: boolean
}

/** Proveedores que surten una variante (ordenados: preferido y menor costo primero). */
export const proveedoresDeVariante = (varianteId: string) =>
  authedFetch<ProveedorDeVariante[]>(
    `/proveedores/producto/${varianteId}`
  )

/** Variantes que surte un proveedor. */
export const listarProductosProveedor = (proveedorId: string) =>
  authedFetch<ProductoDeProveedor[]>(`/proveedores/${proveedorId}/productos`)

export const vincularProductoProveedor = (
  proveedorId: string,
  dto: VincularProductoProveedorDto
) =>
  authedFetch<{ id: string; varianteId: string; isPreferred: boolean }>(
    `/proveedores/${proveedorId}/productos`,
    { method: "POST", body: dto }
  )

export const actualizarProductoProveedor = (
  proveedorId: string,
  varianteId: string,
  dto: ActualizarProductoProveedorDto
) =>
  authedFetch<{ id: string; varianteId: string; isPreferred: boolean }>(
    `/proveedores/${proveedorId}/productos/${varianteId}`,
    { method: "PATCH", body: dto }
  )

export const desvincularProductoProveedor = (
  proveedorId: string,
  varianteId: string
) =>
  authedFetch<{ proveedorId: string; varianteId: string; desvinculado: boolean }>(
    `/proveedores/${proveedorId}/productos/${varianteId}`,
    { method: "DELETE" }
  )

export const TIPOS_DOCUMENTO: { value: TipoDocumento; label: string }[] = [
  { value: "RUC", label: "RUC" },
  { value: "DNI", label: "DNI" },
  { value: "CE", label: "Carné extranjería" },
  { value: "PASAPORTE", label: "Pasaporte" },
  { value: "OTRO", label: "Otro" },
]
