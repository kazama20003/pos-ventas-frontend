import { authedFetch } from "./authed"

export type EstadoSesionCaja =
  | "ABIERTA"
  | "CERRANDO"
  | "CERRADA"
  | "CONCILIADA"
  | "CANCELADA"

export type TipoMovimientoManual =
  | "INGRESO_EFECTIVO"
  | "EGRESO_EFECTIVO"
  | "RETIRO"

export type SesionAbierta = {
  id: string
  cajaId: string
  sucursalId: string
  abiertoEn: string
  openingAmount: string
  cashRegister: { codigo: string; nombre: string }
} | null

export const sesionAbierta = (sucursalId: string) =>
  authedFetch<SesionAbierta>(
    `/caja/sesiones/abierta?sucursalId=${encodeURIComponent(sucursalId)}`
  )

export type AbrirCajaDto = {
  sucursalId: string
  cajaId: string
  terminalId?: string
  montoApertura: number
}

export const abrirCaja = (dto: AbrirCajaDto) =>
  authedFetch<{ id: string; estado: EstadoSesionCaja; abiertoEn: string }>(
    "/caja/sesiones",
    { method: "POST", body: dto }
  )

export type ResumenCaja = {
  id: string
  estado: EstadoSesionCaja
  abiertoEn: string
  montoApertura: string
  efectivoEsperado: string
}

export const resumenCaja = (sesionId: string) =>
  authedFetch<ResumenCaja>(`/caja/sesiones/${sesionId}/resumen`)

export type MovimientoCaja = {
  id: string
  tipo: string
  monto: string
  signo: number
  motivo: string | null
  occurredAt: string
}

export const movimientosCaja = (sesionId: string) =>
  authedFetch<MovimientoCaja[]>(`/caja/sesiones/${sesionId}/movimientos`)

export type MovimientoCajaDto = {
  sesionCajaId: string
  tipo: TipoMovimientoManual
  monto: number
  motivo?: string
}

export const registrarMovimiento = (dto: MovimientoCajaDto) =>
  authedFetch<{
    sesionCajaId: string
    tipo: TipoMovimientoManual
    efectivoEsperado: string
  }>("/caja/sesiones/movimiento", { method: "POST", body: dto })

export type SesionCajaResumen = {
  id: string
  cajaId: string
  estado: EstadoSesionCaja
  abiertoEn: string
  cerradoEn: string | null
  caja: { codigo: string; nombre: string }
  montoApertura: string
  efectivoEsperado: string | null
  montoDeclarado: string | null
  diferencia: string | null
}

export const listarSesiones = (sucursalId: string, limite = 20) =>
  authedFetch<SesionCajaResumen[]>(
    `/caja/sesiones?sucursalId=${encodeURIComponent(sucursalId)}&limite=${limite}`
  )

export type CerrarCajaDto = {
  sesionCajaId: string
  montoDeclarado: number
  motivo?: string
  conteos?: { denominacion: number; cantidad: number }[]
}

export const cerrarCaja = (dto: CerrarCajaDto) =>
  authedFetch<{
    id: string
    estado: EstadoSesionCaja
    efectivoEsperado: string
    montoDeclarado: string
    diferencia: string
  }>("/caja/sesiones/cerrar", { method: "POST", body: dto })
