import { authedFetch } from "./authed"

export type FilaStock = {
  varianteId: string
  sku: string
  nombre: string
  productoNombre: string | null
  almacenId: string
  almacenCodigo: string
  almacenNombre: string
  sucursalId: string
  sucursalNombre: string | null
  enStock: string
  reserved: string
  enTransito: string
  available: string
  costoPromedio: string
  valor: string
  stockMinimo: string
  stockMaximo: string
  bajoMinimo: boolean
}

export type AlertaReabastecimiento = {
  varianteId: string
  sku: string
  nombre: string
  productoNombre: string | null
  almacenId: string
  almacenNombre: string
  sucursalId: string
  sucursalNombre: string | null
  available: string
  stockMinimo: string
  stockMaximo: string
  sugerido: string
}

export type ResumenAlmacen = {
  almacenId: string
  almacenNombre: string
  sucursalNombre: string | null
  variantes: number
  unidades: string
  valor: string
}

export type ConsolidadoStock = {
  items: FilaStock[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  truncado: boolean
  totales: {
    unidades: string
    valor: string
    almacenes: number
    variantes: number
  }
  resumenPorAlmacen: ResumenAlmacen[]
}

export type FiltrosStock = {
  almacenId?: string
  sucursalId?: string
  q?: string
  soloConStock?: boolean
  page?: number
  pageSize?: number
}

export const consolidadoStock = (filtros: FiltrosStock = {}) => {
  const qs = new URLSearchParams()
  if (filtros.almacenId) qs.set("almacenId", filtros.almacenId)
  if (filtros.sucursalId) qs.set("sucursalId", filtros.sucursalId)
  if (filtros.q) qs.set("q", filtros.q)
  if (filtros.soloConStock) qs.set("soloConStock", "true")
  if (filtros.page) qs.set("page", String(filtros.page))
  if (filtros.pageSize) qs.set("pageSize", String(filtros.pageSize))
  const s = qs.toString()
  return authedFetch<ConsolidadoStock>(`/inventario/stock${s ? `?${s}` : ""}`)
}

export const alertasReabastecimiento = (filtros: {
  almacenId?: string
  sucursalId?: string
} = {}) => {
  const qs = new URLSearchParams()
  if (filtros.almacenId) qs.set("almacenId", filtros.almacenId)
  if (filtros.sucursalId) qs.set("sucursalId", filtros.sucursalId)
  const s = qs.toString()
  return authedFetch<{ total: number; items: AlertaReabastecimiento[] }>(
    `/inventario/alertas${s ? `?${s}` : ""}`
  )
}

export type DefinirNivelStockDto = {
  almacenId: string
  varianteId: string
  stockMinimo: number
  stockMaximo?: number
}

export const definirNivelStock = (dto: DefinirNivelStockDto) =>
  authedFetch<{ id: string; stockMinimo: string; stockMaximo: string }>(
    "/inventario/nivel",
    { method: "POST", body: dto }
  )

// ---- Conteos físicos ----

export type EstadoConteo =
  | "BORRADOR"
  | "EN_PROGRESO"
  | "ENVIADO"
  | "APROBADO"
  | "CONTABILIZADO"
  | "CANCELADO"

type AlmacenRef = { id: string; codigo: string; nombre: string }

export type ConteoItem = {
  id: string
  varianteId: string
  cantidadEsperada: string
  cantidadContada: string | null
  cantidadDiferencia: string | null
  motivo: string | null
  variant?: { id: string; sku: string; nombre: string }
}

export type Conteo = {
  id: string
  number: string
  estado: EstadoConteo
  almacenId: string
  iniciadoEn: string | null
  completadoEn: string | null
  postedAt: string | null
  creadoEn: string
  warehouse?: AlmacenRef
  articulos?: ConteoItem[]
  _count?: { articulos: number }
}

export const listarConteos = (estado?: string) => {
  const qs = estado ? `?estado=${encodeURIComponent(estado)}` : ""
  return authedFetch<Conteo[]>(`/inventario/conteos${qs}`)
}

export const obtenerConteo = (id: string) =>
  authedFetch<Conteo>(`/inventario/conteos/${id}`)

export const crearConteo = (almacenId: string) =>
  authedFetch<Conteo>("/inventario/conteos", {
    method: "POST",
    body: { almacenId },
  })

export type RegistrarConteoDto = {
  articulos: { varianteId: string; cantidadContada: number; motivo?: string }[]
}

export const registrarConteo = (id: string, dto: RegistrarConteoDto) =>
  authedFetch<Conteo>(`/inventario/conteos/${id}/registrar`, {
    method: "POST",
    body: dto,
  })

export const contabilizarConteo = (id: string) =>
  authedFetch<Conteo>(`/inventario/conteos/${id}/contabilizar`, {
    method: "POST",
  })

export const cancelarConteo = (id: string) =>
  authedFetch<{ id: string; estado: EstadoConteo }>(
    `/inventario/conteos/${id}/cancelar`,
    { method: "POST" }
  )

// ---- Reservas ----

export type EstadoReserva =
  | "ACTIVA"
  | "PARCIALMENTE_ATENDIDA"
  | "ATENDIDA"
  | "LIBERADA"
  | "VENCIDA"
  | "CANCELADA"

export type Reserva = {
  id: string
  almacenId: string
  varianteId: string
  cantidad: string
  cantidadAtendida: string
  estado: EstadoReserva
  referenciaType: string
  venceEn: string | null
  creadoEn: string
  variant?: { id: string; sku: string; nombre: string }
  warehouse?: AlmacenRef
}

export const listarReservas = (almacenId?: string, estado?: string) => {
  const qs = new URLSearchParams()
  if (almacenId) qs.set("almacenId", almacenId)
  if (estado) qs.set("estado", estado)
  const s = qs.toString()
  return authedFetch<Reserva[]>(`/inventario/reservas${s ? `?${s}` : ""}`)
}

export type CrearReservaDto = {
  almacenId: string
  varianteId: string
  cantidad: number
  referencia?: string
  venceEn?: string
}

export const crearReserva = (dto: CrearReservaDto) =>
  authedFetch<Reserva>("/inventario/reservas", { method: "POST", body: dto })

export const liberarReserva = (id: string) =>
  authedFetch<{ id: string; estado: EstadoReserva }>(
    `/inventario/reservas/${id}/liberar`,
    { method: "POST" }
  )

export type LoteVencimiento = {
  loteId: string
  lotNumber: string
  venceEn: string
  diasParaVencer: number
  vencido: boolean
  cantidad: string
  varianteId: string
  sku: string
  nombre: string
  productoNombre: string | null
  almacenId: string
  almacenNombre: string
  sucursalId: string
  sucursalNombre: string | null
}

export type RespuestaVencimientos = {
  total: number
  vencidos: number
  porVencer: number
  diasAviso: number
  items: LoteVencimiento[]
}

/** GET /inventario/vencimientos — lotes por vencer o vencidos (control de caducidad). */
export function listarVencimientos(params?: { dias?: number; almacenId?: string }) {
  const qs = new URLSearchParams()
  if (params?.dias) qs.set("dias", String(params.dias))
  if (params?.almacenId) qs.set("almacenId", params.almacenId)
  const cola = qs.toString()
  return authedFetch<RespuestaVencimientos>(
    `/inventario/vencimientos${cola ? `?${cola}` : ""}`
  )
}
