import { authedFetch } from "./authed"

export type EstadoComprobante =
  | "BORRADOR"
  | "EN_COLA"
  | "ENVIANDO"
  | "ACEPTADO"
  | "RECHAZADO"
  | "OBSERVADO"
  | "ANULADO"
  | "ERROR"

export type TipoComprobante =
  | "FACTURA"
  | "BOLETA"
  | "NOTA_CREDITO"
  | "NOTA_DEBITO"

export type ComprobanteResumen = {
  id: string
  documentType: TipoComprobante
  series: string
  number: number | string
  estado: EstadoComprobante
  total: string
  moneda: string
  issueDate: string
  customerName: string | null
}

export type ComprobanteItem = {
  id: string
  lineNumber: number
  descripcion: string
  cantidad: string
  precioUnitario: string
  montoImpuesto: string
  montoOtrosTributos: string
  total: string
}

export type ComprobanteEvento = {
  id: string
  tipo?: string
  occurredAt: string
  detalle?: string | null
}

export type ComprobanteDetalle = {
  id: string
  documentType: TipoComprobante
  series: string
  number: number | string
  estado: EstadoComprobante
  moneda: string
  issueDate: string
  customerName: string | null
  customerDocumentNumber: string | null
  subtotal: string
  taxableTotal: string
  exemptTotal: string
  unaffectedTotal: string
  totalDescuento: string
  totalImpuesto: string
  otrosTributos: string
  total: string
  sunatTicket: string | null
  sunatResponseCode: string | null
  sunatDescription: string | null
  articulos: ComprobanteItem[]
  eventos: ComprobanteEvento[]
}

export const listarComprobantes = (estado?: string) =>
  authedFetch<ComprobanteResumen[]>(
    `/facturacion-electronica/comprobantes${
      estado ? `?estado=${encodeURIComponent(estado)}` : ""
    }`
  )

export const obtenerComprobante = (id: string) =>
  authedFetch<ComprobanteDetalle>(`/facturacion-electronica/comprobantes/${id}`)

export const reintentarComprobante = (id: string) =>
  authedFetch<{ id: string; estado: EstadoComprobante }>(
    `/facturacion-electronica/comprobantes/${id}/reintentar`,
    { method: "POST" }
  )

export const DOC_LABEL: Record<TipoComprobante, string> = {
  BOLETA: "Boleta",
  FACTURA: "Factura",
  NOTA_CREDITO: "Nota de crédito",
  NOTA_DEBITO: "Nota de débito",
}

export const ESTADO_LABEL: Record<EstadoComprobante, string> = {
  BORRADOR: "Borrador",
  EN_COLA: "En cola",
  ENVIANDO: "Enviando",
  ACEPTADO: "Aceptado",
  RECHAZADO: "Rechazado",
  OBSERVADO: "Observado",
  ANULADO: "Anulado",
  ERROR: "Error",
}
