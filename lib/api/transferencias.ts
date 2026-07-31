import { authedFetch } from "./authed"

export type EstadoTransferencia =
  | "BORRADOR"
  | "SOLICITADA"
  | "APROBADA"
  | "EN_TRANSITO"
  | "RECIBIDA_PARCIALMENTE"
  | "RECIBIDA"
  | "CANCELADA"
  | "RECHAZADA"

type AlmacenRef = { id: string; codigo: string; nombre: string }

export type TransferenciaItem = {
  id: string
  varianteId: string
  requestedQty: string | number
  shippedQty: string | number
  receivedQty: string | number
  variant?: { id: string; sku: string; nombre: string }
}

export type Transferencia = {
  id: string
  number: string
  estado: EstadoTransferencia
  almacenOrigenId: string
  almacenDestinoId: string
  notes?: string | null
  shippedAt?: string | null
  recibidoEn?: string | null
  creadoEn: string
  originWarehouse?: AlmacenRef
  destinationWarehouse?: AlmacenRef
  articulos?: TransferenciaItem[]
  _count?: { articulos: number }
}

export const listarTransferencias = (estado?: string) => {
  const qs = estado ? `?estado=${encodeURIComponent(estado)}` : ""
  return authedFetch<Transferencia[]>(`/inventario/transferencias${qs}`)
}

export const obtenerTransferencia = (id: string) =>
  authedFetch<Transferencia>(`/inventario/transferencias/${id}`)

export type CrearTransferenciaDto = {
  almacenOrigenId: string
  almacenDestinoId: string
  notas?: string
  idempotencyKey: string
  articulos: { varianteId: string; cantidad: number }[]
}

export const crearTransferencia = (dto: CrearTransferenciaDto) =>
  authedFetch<Transferencia>("/inventario/transferencias", {
    method: "POST",
    body: dto,
  })

export type RecibirTransferenciaDto = {
  idempotencyKey: string
  articulos: { varianteId: string; cantidad: number }[]
}

export const recibirTransferencia = (
  id: string,
  dto: RecibirTransferenciaDto
) =>
  authedFetch<Transferencia>(`/inventario/transferencias/${id}/recibir`, {
    method: "POST",
    body: dto,
  })

export const cancelarTransferencia = (id: string) =>
  authedFetch<Transferencia>(`/inventario/transferencias/${id}/cancelar`, {
    method: "POST",
  })
