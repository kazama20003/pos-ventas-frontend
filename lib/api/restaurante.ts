import { authedFetch } from "./authed"
import type { MetodoPago } from "./ventas"

// ---- Enums (espejo del backend) ----

export type EstadoMesa = "LIBRE" | "OCUPADA" | "CUENTA" | "RESERVADA" | "INACTIVA"

export type TipoComanda = "MESA" | "LLEVAR" | "DELIVERY"

export type EstacionCocina = "COCINA" | "BARRA" | "OTRO"

export type EstadoCocinaItem =
  | "PENDIENTE"
  | "EN_PREPARACION"
  | "LISTO"
  | "ENTREGADO"
  | "CANCELADO"

export type EstadoComanda =
  | "ABIERTA"
  | "ENVIADA"
  | "EN_PREPARACION"
  | "SERVIDA"
  | "COBRADA"
  | "CANCELADA"
  | string

// ---- Tipos (los Decimal llegan como string) ----

export type Mesa = {
  id: string
  inquilinoId?: string
  sucursalId: string
  codigo: string
  nombre: string
  zona?: string | null
  capacidad?: number | null
  posX?: number | null
  posY?: number | null
  estado: EstadoMesa
}

export type Modificador = {
  id?: string
  nombre: string
  precioExtra?: string | number | null
}

export type ItemComanda = {
  id: string
  comandaId?: string
  varianteId: string
  productoNombre: string
  cantidad: string | number
  precioUnitario: string | number
  notas?: string | null
  estacion?: EstacionCocina | null
  estadoCocina: EstadoCocinaItem
  modificadores?: Modificador[]
}

export type Comanda = {
  id: string
  inquilinoId?: string
  sucursalId: string
  mesaId?: string | null
  mozoId?: string | null
  tipo: TipoComanda
  estado: EstadoComanda
  comensales?: number | null
  notas?: string | null
  subtotal: string | number
  total: string | number
  propina?: string | number | null
  mesa?: Pick<Mesa, "id" | "codigo" | "nombre"> | null
  items: ItemComanda[]
  creadoEn?: string
}

/** Fila del mapa de salón: mesa + comanda en curso (si hay). */
export type MapaMesa = Mesa & {
  comanda?: {
    id: string
    estado: EstadoComanda
    tipo: TipoComanda
    total: string | number
    comensales?: number | null
  } | null
}

// ---- Mesas ----

export const listarMesas = (sucursalId: string) =>
  authedFetch<Mesa[]>(
    `/restaurante/mesas?sucursalId=${encodeURIComponent(sucursalId)}`
  )

export type CrearMesaDto = {
  sucursalId: string
  codigo: string
  nombre: string
  zona?: string
  capacidad?: number
  posX?: number
  posY?: number
}

export const crearMesa = (dto: CrearMesaDto) =>
  authedFetch<Mesa>("/restaurante/mesas", { method: "POST", body: dto })

export type ActualizarMesaDto = {
  nombre?: string
  zona?: string
  capacidad?: number
  posX?: number
  posY?: number
  estado?: EstadoMesa
}

export const actualizarMesa = (id: string, dto: ActualizarMesaDto) =>
  authedFetch<Mesa>(`/restaurante/mesas/${id}`, { method: "PATCH", body: dto })

export const eliminarMesa = (id: string) =>
  authedFetch<{ id: string }>(`/restaurante/mesas/${id}`, { method: "DELETE" })

// ---- Mapa de salón ----

export const obtenerMapa = (sucursalId: string) =>
  authedFetch<MapaMesa[]>(
    `/restaurante/mapa?sucursalId=${encodeURIComponent(sucursalId)}`
  )

// ---- Comandas ----

export type CrearComandaDto = {
  sucursalId: string
  tipo?: TipoComanda
  mesaId?: string
  mozoId?: string
  comensales?: number
  notas?: string
}

export const crearComanda = (dto: CrearComandaDto) =>
  authedFetch<Comanda>("/restaurante/comandas", { method: "POST", body: dto })

export type ListarComandasParams = {
  sucursalId: string
  estado?: EstadoComanda
}

export const listarComandas = (params: ListarComandasParams) => {
  const qs = new URLSearchParams()
  qs.set("sucursalId", params.sucursalId)
  if (params.estado) qs.set("estado", params.estado)
  return authedFetch<Comanda[]>(`/restaurante/comandas?${qs.toString()}`)
}

export const obtenerComanda = (id: string) =>
  authedFetch<Comanda>(`/restaurante/comandas/${id}`)

export type ModificadorDto = { nombre: string; precioExtra?: number }

export type AgregarItemDto = {
  varianteId: string
  cantidad: number
  precioUnitario: number
  productoNombre: string
  notas?: string
  estacion?: EstacionCocina
  modificadores?: ModificadorDto[]
}

export const agregarItem = (comandaId: string, dto: AgregarItemDto) =>
  authedFetch<Comanda>(`/restaurante/comandas/${comandaId}/items`, {
    method: "POST",
    body: dto,
  })

export const eliminarItem = (itemId: string) =>
  authedFetch<{ id: string }>(`/restaurante/items/${itemId}`, {
    method: "DELETE",
  })

export const enviarCocina = (comandaId: string) =>
  authedFetch<Comanda>(`/restaurante/comandas/${comandaId}/enviar-cocina`, {
    method: "POST",
  })

export const cancelarComanda = (comandaId: string) =>
  authedFetch<Comanda>(`/restaurante/comandas/${comandaId}/cancelar`, {
    method: "POST",
  })

export type PagoComandaDto = {
  method: MetodoPago
  monto: number
  referencia?: string
}

export type CobrarComandaDto = {
  empresaId: string
  serieId: string
  sesionCajaId?: string
  clienteId?: string
  propina?: number
  pagos: PagoComandaDto[]
  itemIds?: string[]
}

export const cobrarComanda = (comandaId: string, dto: CobrarComandaDto) =>
  authedFetch<{ id: string; number?: string; estado: string; total: string }>(
    `/restaurante/comandas/${comandaId}/cobrar`,
    { method: "POST", body: dto }
  )

// ---- KDS (cocina) ----

export type KdsParams = {
  sucursalId: string
  estacion?: EstacionCocina
}

export const obtenerKds = (params: KdsParams) => {
  const qs = new URLSearchParams()
  qs.set("sucursalId", params.sucursalId)
  if (params.estacion) qs.set("estacion", params.estacion)
  return authedFetch<Comanda[]>(`/restaurante/kds?${qs.toString()}`)
}

export const actualizarEstadoCocina = (
  itemId: string,
  estado: EstadoCocinaItem
) =>
  authedFetch<ItemComanda>(`/restaurante/items/${itemId}/cocina`, {
    method: "PATCH",
    body: { estado },
  })
