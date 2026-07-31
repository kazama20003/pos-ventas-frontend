import { authedFetch } from "./authed"

export type EstadoRegistro =
  | "ACTIVO"
  | "INACTIVO"
  | "SUSPENDIDO"
  | "ARCHIVADO"
  | "ELIMINADO"

export type Empresa = {
  id: string
  razonSocial: string
  ruc: string
  nombreComercial?: string | null
  moneda?: string
  estado?: EstadoRegistro
  sunatUbigeo?: string | null
  fiscalAddress?: string | null
}

export type Sucursal = {
  id: string
  empresaId: string
  codigo: string
  nombre: string
  estado: EstadoRegistro
  sunatUbigeo?: string | null
  address?: string | null
  phone?: string | null
  timezone?: string
  _count?: { almacenes: number; cajas: number }
}

export type TipoAlmacen = "PRINCIPAL" | "TRANSITO" | "MERMA" | "DEVOLUCIONES"

export type Almacen = {
  id: string
  sucursalId: string
  codigo: string
  nombre: string
  estado: EstadoRegistro
  address?: string | null
  tipo?: TipoAlmacen
  esPredeterminado?: boolean
}

export type Caja = {
  id: string
  sucursalId: string
  codigo: string
  nombre: string
  estado: EstadoRegistro
}

// ---- Empresas ----
export const listarEmpresas = () => authedFetch<Empresa[]>("/empresas")

export type EmpresaDetalle = Empresa & {
  timezone?: string
  sucursales?: { id: string; codigo: string; nombre: string }[]
}

export const obtenerEmpresa = (id: string) =>
  authedFetch<EmpresaDetalle>(`/empresas/${id}`)

export type CrearEmpresaDto = {
  organizacionId: string
  razonSocial: string
  ruc: string
  nombreComercial?: string
  sunatUbigeo?: string
  fiscalAddress?: string
  moneda?: string
}

export const crearEmpresa = (dto: CrearEmpresaDto) =>
  authedFetch<Empresa>("/empresas", { method: "POST", body: dto })

export type ActualizarEmpresaDto = {
  razonSocial?: string
  nombreComercial?: string
  sunatUbigeo?: string
  fiscalAddress?: string
}

export const actualizarEmpresa = (id: string, dto: ActualizarEmpresaDto) =>
  authedFetch<Empresa>(`/empresas/${id}`, { method: "PATCH", body: dto })

// ---- Sucursales ----
export const listarSucursales = () => authedFetch<Sucursal[]>("/sucursales")

export type CrearSucursalDto = {
  empresaId: string
  codigo: string
  nombre: string
  address?: string
  phone?: string
  sunatUbigeo?: string
}

export const crearSucursal = (dto: CrearSucursalDto) =>
  authedFetch<Sucursal>("/sucursales", { method: "POST", body: dto })

export type ActualizarSucursalDto = {
  nombre?: string
  address?: string
  phone?: string
  sunatUbigeo?: string
}

export const actualizarSucursal = (id: string, dto: ActualizarSucursalDto) =>
  authedFetch<Sucursal>(`/sucursales/${id}`, { method: "PATCH", body: dto })

export const archivarSucursal = (id: string) =>
  authedFetch<{ id: string; estado: EstadoRegistro }>(
    `/sucursales/${id}/archivar`,
    { method: "POST" }
  )

export const reactivarSucursal = (id: string) =>
  authedFetch<{ id: string; estado: EstadoRegistro }>(
    `/sucursales/${id}/reactivar`,
    { method: "POST" }
  )

// ---- Almacenes ----
export const listarAlmacenes = (sucursalId?: string) => {
  const qs = sucursalId ? `?sucursalId=${encodeURIComponent(sucursalId)}` : ""
  return authedFetch<Almacen[]>(`/sucursales/almacenes${qs}`)
}

export type CrearAlmacenDto = {
  sucursalId: string
  codigo: string
  nombre: string
  address?: string
  tipo?: TipoAlmacen
}

export const crearAlmacen = (dto: CrearAlmacenDto) =>
  authedFetch<Almacen>("/sucursales/almacenes", { method: "POST", body: dto })

export type ActualizarAlmacenDto = {
  nombre?: string
  address?: string
  tipo?: TipoAlmacen
}

export const actualizarAlmacen = (id: string, dto: ActualizarAlmacenDto) =>
  authedFetch<Almacen>(`/sucursales/almacenes/${id}`, {
    method: "PATCH",
    body: dto,
  })

export const archivarAlmacen = (id: string) =>
  authedFetch<{ id: string; estado: EstadoRegistro }>(
    `/sucursales/almacenes/${id}/archivar`,
    { method: "POST" }
  )

export const marcarAlmacenPredeterminado = (id: string) =>
  authedFetch<{ id: string; esPredeterminado: boolean }>(
    `/sucursales/almacenes/${id}/predeterminado`,
    { method: "POST" }
  )

export const reactivarAlmacen = (id: string) =>
  authedFetch<{ id: string; estado: EstadoRegistro }>(
    `/sucursales/almacenes/${id}/reactivar`,
    { method: "POST" }
  )

// ---- Cajas ----
export const listarCajas = (sucursalId?: string) => {
  const qs = sucursalId ? `?sucursalId=${encodeURIComponent(sucursalId)}` : ""
  return authedFetch<Caja[]>(`/sucursales/cajas${qs}`)
}

export type CrearCajaDto = {
  sucursalId: string
  codigo: string
  nombre: string
}

export const crearCaja = (dto: CrearCajaDto) =>
  authedFetch<Caja>("/sucursales/cajas", { method: "POST", body: dto })

export type ActualizarCajaDto = { nombre?: string }

export const actualizarCaja = (id: string, dto: ActualizarCajaDto) =>
  authedFetch<Caja>(`/sucursales/cajas/${id}`, { method: "PATCH", body: dto })

export const archivarCaja = (id: string) =>
  authedFetch<{ id: string; estado: EstadoRegistro }>(
    `/sucursales/cajas/${id}/archivar`,
    { method: "POST" }
  )

export const reactivarCaja = (id: string) =>
  authedFetch<{ id: string; estado: EstadoRegistro }>(
    `/sucursales/cajas/${id}/reactivar`,
    { method: "POST" }
  )
