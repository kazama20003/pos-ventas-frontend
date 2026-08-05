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

// ---- Historial de ventas ----

export type EstadoVenta =
  | "BORRADOR"
  | "PENDIENTE_PAGO"
  | "PAGADA_PARCIALMENTE"
  | "PAGADA"
  | "COMPLETADA"
  | "ANULADA"
  | "DEVUELTA_PARCIALMENTE"
  | "DEVUELTA"
  | "VENCIDA"

export type VentaListada = {
  id: string
  number: string
  estado: EstadoVenta
  moneda: string
  total: string
  totalPagado: string
  creadoEn: string
  completadoEn: string | null
  items: number
  cliente: {
    razonSocial: string
    documentType: string | null
    documentNumber: string | null
  } | null
  cajero: { membresiaId: string; nombre: string }
}

export type ListarVentasParams = {
  sucursalId: string
  estado?: EstadoVenta
  cajeroId?: string
  clienteId?: string
  desde?: string
  hasta?: string
  q?: string
  page?: number
  pageSize?: number
}

export type ListaVentasResult = {
  items: VentaListada[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export const listarVentas = (params: ListarVentasParams) => {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.set(k, String(v))
  })
  return authedFetch<ListaVentasResult>(`/ventas?${qs.toString()}`)
}
