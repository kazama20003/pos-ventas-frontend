import { authedFetch } from "./authed"

export type TipoBeneficio =
  | "PORCENTAJE"
  | "MONTO_FIJO"
  | "PRECIO_FIJO"
  | "LLEVA_N_PAGA_M"

export type EstadoPromocion = "PROGRAMADA" | "ACTIVA" | "PAUSADA" | "EXPIRADA"

export type PromocionLista = {
  id: string
  codigo: string
  nombre: string
  tipoBeneficio: TipoBeneficio
  valor: string | null
  estado: EstadoPromocion
  /** Estado derivado por fechas (cosmético); el `estado` guardado no cambia. */
  estadoEfectivo: EstadoPromocion
  prioridad: number
  iniciaEn: string
  terminaEn: string | null
  usoActual: number
  usoMaximo: number | null
  _count: { scopes: number }
}

export type PromocionDetalle = {
  id: string
  empresaId: string
  codigo: string
  nombre: string
  descripcion: string | null
  tipoBeneficio: TipoBeneficio
  valor: string | null
  compraCantidad: number | null
  pagaCantidad: number | null
  iniciaEn: string
  terminaEn: string | null
  estado: EstadoPromocion
  prioridad: number
  acumulable: boolean
  cantidadMinima: string | null
  montoMinimoVenta: string | null
  usoMaximo: number | null
  usoActual: number
  scopes: { alcance: string; referenciaId: string | null }[]
}

export type CrearPromocionDto = {
  empresaId: string
  codigo: string
  nombre: string
  descripcion?: string
  tipoBeneficio: TipoBeneficio
  valor?: number
  compraCantidad?: number
  pagaCantidad?: number
  iniciaEn: string
  terminaEn?: string
  prioridad?: number
  acumulable?: boolean
  cantidadMinima?: number
  montoMinimoVenta?: number
  usoMaximo?: number
  productoIds: string[]
}

export type ActualizarPromocionDto = Partial<
  Omit<CrearPromocionDto, "empresaId">
>

export type ListarPromocionesParams = {
  empresaId: string
  estado?: EstadoPromocion
  q?: string
  page?: number
  pageSize?: number
}

export type ListaPromociones = {
  items: PromocionLista[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export const listarPromociones = (params: ListarPromocionesParams) => {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.set(k, String(v))
  })
  return authedFetch<ListaPromociones>(`/promociones?${qs.toString()}`)
}

export const obtenerPromocion = (id: string) =>
  authedFetch<PromocionDetalle>(`/promociones/${id}`)

export const crearPromocion = (dto: CrearPromocionDto) =>
  authedFetch<{ id: string }>("/promociones", { method: "POST", body: dto })

export const actualizarPromocion = (id: string, dto: ActualizarPromocionDto) =>
  authedFetch<{ id: string }>(`/promociones/${id}`, {
    method: "PATCH",
    body: dto,
  })

export const cambiarEstadoPromocion = (id: string, estado: EstadoPromocion) =>
  authedFetch<{ id: string; estado: EstadoPromocion }>(
    `/promociones/${id}/estado`,
    { method: "PATCH", body: { estado } }
  )

// ---- Vista previa de caja ----

export type PromocionesAplicablesDto = {
  sucursalId: string
  items: { varianteId: string; cantidad: number }[]
}

export type LineaAplicable = {
  varianteId: string
  descuento: {
    promocionId: string
    codigo: string
    descripcion: string
    monto: string
  } | null
}

export type ResultadoAplicables = {
  lineas: LineaAplicable[]
  totalDescuento: string
  promocionIds: string[]
}

export const promocionesAplicables = (dto: PromocionesAplicablesDto) =>
  authedFetch<ResultadoAplicables>("/promociones/aplicables", {
    method: "POST",
    body: dto,
  })
