import { authedFetch } from "./authed"

export type EstadoOrdenCompra =
  | "BORRADOR"
  | "APROBADA"
  | "RECIBIDA_PARCIALMENTE"
  | "RECIBIDA"
  | "CERRADA"
  | "CANCELADA"

export type ItemOrdenCompraDto = {
  varianteId: string
  descripcion: string
  cantidad: number
  costoUnitario: string
  montoImpuesto?: string
}

export type CrearOrdenCompraDto = {
  sucursalId: string
  proveedorId: string
  number: string
  moneda: string
  expectedAt?: string
  notes?: string
  items: ItemOrdenCompraDto[]
}

export type OrdenCompra = {
  id: string
  number: string
  estado: EstadoOrdenCompra
  proveedorId: string
  moneda: string
  subtotal: string
  totalImpuesto: string
  total: string
  expectedAt: string | null
  supplier?: { id: string; razonSocial: string; codigo: string }
  _count?: { articulos: number }
}

export const crearOrden = (dto: CrearOrdenCompraDto) =>
  authedFetch<{
    id: string
    number: string
    estado: EstadoOrdenCompra
    total: string
  }>("/compras/ordenes", { method: "POST", body: dto })

export const listarOrdenes = (proveedorId?: string) =>
  authedFetch<OrdenCompra[]>(
    `/compras/ordenes${proveedorId ? `?proveedorId=${encodeURIComponent(proveedorId)}` : ""}`
  )

export type ItemRecepcionDto = {
  varianteId: string
  cantidad: number
  costoUnitario: string
  montoImpuesto?: string
  lotNumber?: string
  venceEn?: string
}

export type RecepcionarDto = {
  idempotencyKey: string
  pedidoCompraId?: string
  almacenId: string
  proveedorId: string
  number: string
  moneda: string
  supplierDocumentType?: string
  supplierSeries?: string
  supplierNumber?: string
  aCredito?: boolean
  diasCredito?: number
  items: ItemRecepcionDto[]
}

export const recepcionar = (dto: RecepcionarDto) =>
  authedFetch<{
    id: string
    number: string
    estado: string
    total: string
    idempotente: boolean
  }>("/compras/recepciones", { method: "POST", body: dto })
