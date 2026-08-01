import { authedFetch } from "./authed"

export type MetodoPago =
  | "EFECTIVO"
  | "TARJETA"
  | "TRANSFERENCIA_BANCARIA"
  | "BILLETERA_DIGITAL"
  | "CREDITO_TIENDA"
  | "CREDITO"
  | "OTRO"

export type TipoDocumento =
  | "BOLETA"
  | "FACTURA"
  | "NOTA_CREDITO"
  | "NOTA_DEBITO"
  | "GUIA_REMISION"
  | string

export type SerieComprobante = {
  id: string
  documentType: TipoDocumento
  series: string
}

export type ContextoPos = {
  empresaId: string
  moneda: string
  series: SerieComprobante[]
  tienePrecios: boolean
}

export const contextoPos = (sucursalId: string) =>
  authedFetch<ContextoPos>(
    `/ventas/contexto?sucursalId=${encodeURIComponent(sucursalId)}`
  )

export type ItemVentaDto = {
  varianteId: string
  almacenId?: string
  cantidad: number
}

export type PagoDto = {
  method: MetodoPago
  monto: number
  referencia?: string
}

export type CrearVentaDto = {
  empresaId: string
  sucursalId: string
  serieId: string
  sesionCajaId?: string
  clienteId?: string
  moneda: string
  idempotencyKey: string
  items: ItemVentaDto[]
  pagos?: PagoDto[]
}

export type VentaCreada = {
  id: string
  number: string
  estado: string
  subtotal: string
  total: string
  totalPagado: string
  idempotente: boolean
}

export const crearVenta = (dto: CrearVentaDto) =>
  authedFetch<VentaCreada>("/ventas", { method: "POST", body: dto })
