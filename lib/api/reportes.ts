import { authedFetch } from "./authed"

export type FilaSucursalReporte = {
  sucursalId: string
  codigo: string
  sucursal: string
  ventasTotal: string
  ventasCantidad: number
  ticketPromedio: string
  valorInventario: string
  skus: number
}

export type ReporteSucursales = {
  filas: FilaSucursalReporte[]
  totales: {
    ventasTotal: string
    ventasCantidad: number
    valorInventario: string
  }
}

export const reporteSucursales = (desde: string, hasta: string) => {
  const qs = new URLSearchParams({ desde, hasta }).toString()
  return authedFetch<ReporteSucursales>(`/reportes/por-sucursal?${qs}`)
}

export type TopProducto = {
  varianteId: string | null
  nombre: string
  cantidad: string | number
  total: string | number
}

export type ResumenPeriodo = {
  total: string
  cantidad: number
  ticketPromedio: string
}

export type DiaSemana = {
  fecha: string
  total: string
  cantidad: number
}

export type DashboardData = {
  hoy: ResumenPeriodo
  ayer: ResumenPeriodo
  mes: ResumenPeriodo
  semana: DiaSemana[]
  topProductosHoy: TopProducto[]
  topProductos: TopProducto[]
  inventario: Record<string, unknown>
  cxc: { saldoPendiente: string; cuentas: number; vencidas: number }
  cxp: { saldoPendiente: string; cuentas: number; vencidas?: number }
  operacion: {
    bajoStock: number
    cajasAbiertas: number
    clientesNuevosMes: number
    lotesPorVencer: number
  }
}

export const obtenerDashboard = () =>
  authedFetch<DashboardData>("/reportes/dashboard")

export const topProductos = (
  desde: string,
  hasta: string,
  sucursalId?: string,
  limite = 10
) => {
  const qs = new URLSearchParams({ desde, hasta, limite: String(limite) })
  if (sucursalId) qs.set("sucursalId", sucursalId)
  return authedFetch<TopProducto[]>(`/reportes/top-productos?${qs.toString()}`)
}
