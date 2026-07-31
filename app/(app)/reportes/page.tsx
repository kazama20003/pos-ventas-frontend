"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  RiArrowRightLine,
  RiBarChartBoxLine,
  RiCoinsLine,
  RiShoppingCart2Line,
  RiStore2Line,
} from "@remixicon/react"

import { PageHeader } from "@/components/layout/page-header"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  reporteSucursales,
  topProductos,
  type FilaSucursalReporte,
} from "@/lib/api/reportes"

function money(v: string | number) {
  return `S/ ${Number(v).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`
}

type Periodo = "hoy" | "mes" | "mes_anterior" | "personalizado"

function rangoDe(periodo: Periodo, custom: { desde: string; hasta: string }) {
  const hoy = new Date()
  const y = hoy.getFullYear()
  const m = hoy.getMonth()
  if (periodo === "hoy") {
    const d = new Date(y, m, hoy.getDate())
    return { desde: ymd(d), hasta: ymd(new Date(d.getTime() + 86400000)) }
  }
  if (periodo === "mes") {
    return { desde: ymd(new Date(y, m, 1)), hasta: ymd(new Date(y, m + 1, 1)) }
  }
  if (periodo === "mes_anterior") {
    return { desde: ymd(new Date(y, m - 1, 1)), hasta: ymd(new Date(y, m, 1)) }
  }
  return custom
}

export default function ReportesPage() {
  const [periodo, setPeriodo] = React.useState<Periodo>("mes")
  const [custom, setCustom] = React.useState(() => {
    const hoy = new Date()
    return {
      desde: ymd(new Date(hoy.getFullYear(), hoy.getMonth(), 1)),
      hasta: ymd(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1)),
    }
  })

  const { desde, hasta } = rangoDe(periodo, custom)

  const rep = useQuery({
    queryKey: ["reporte-sucursales", desde, hasta],
    queryFn: () => reporteSucursales(desde, hasta),
  })

  const d = rep.data
  const maxVenta = Math.max(
    1,
    ...(d?.filas ?? []).map((f) => Number(f.ventasTotal))
  )

  return (
    <>
      <PageHeader
        title="Reportes por sucursal"
        description="Ventas y valorizado de inventario por local. Datos calculados en el servidor."
      />

      <div className="flex-1 overflow-auto p-4 md:p-6">
        {/* Periodo */}
        <div className="mb-4 grid gap-3 rounded-2xl border bg-card p-4 shadow-sm ring-1 ring-foreground/5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Periodo</Label>
            <Select
              value={periodo}
              onChange={(v) => setPeriodo(v as Periodo)}
              options={[
                { value: "hoy", label: "Hoy" },
                { value: "mes", label: "Este mes" },
                { value: "mes_anterior", label: "Mes anterior" },
                { value: "personalizado", label: "Personalizado" },
              ]}
            />
          </div>
          {periodo === "personalizado" ? (
            <>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">Desde</Label>
                <Input
                  type="date"
                  value={custom.desde}
                  onChange={(e) =>
                    setCustom((c) => ({ ...c, desde: e.target.value }))
                  }
                  className="h-10"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">Hasta</Label>
                <Input
                  type="date"
                  value={custom.hasta}
                  onChange={(e) =>
                    setCustom((c) => ({ ...c, hasta: e.target.value }))
                  }
                  className="h-10"
                />
              </div>
            </>
          ) : null}
        </div>

        {/* KPIs (totales del backend) */}
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <Kpi
            icon={RiCoinsLine}
            label="Ventas del periodo"
            valor={d ? money(d.totales.ventasTotal) : "—"}
            cargando={rep.isLoading}
            destacado
          />
          <Kpi
            icon={RiShoppingCart2Line}
            label="N° de ventas"
            valor={d ? String(d.totales.ventasCantidad) : "—"}
            cargando={rep.isLoading}
          />
          <Kpi
            icon={RiStore2Line}
            label="Valor inventario"
            valor={d ? money(d.totales.valorInventario) : "—"}
            cargando={rep.isLoading}
          />
        </div>

        {/* Tabla por sucursal */}
        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm ring-1 ring-foreground/5">
          <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-3 text-sm font-semibold">
            <RiBarChartBoxLine className="size-4 text-primary" />
            Desglose por sucursal
          </div>
          {rep.isLoading ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : rep.error ? (
            <p className="p-6 text-center text-sm text-destructive">
              {(rep.error as Error).message}
            </p>
          ) : !d || d.filas.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">
              Sin sucursales o sin datos en el periodo.
            </p>
          ) : (
            <div className="divide-y">
              {d.filas.map((f) => (
                <FilaSucursal
                  key={f.sucursalId}
                  f={f}
                  maxVenta={maxVenta}
                  desde={desde}
                  hasta={hasta}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}

function FilaSucursal({
  f,
  maxVenta,
  desde,
  hasta,
}: {
  f: FilaSucursalReporte
  maxVenta: number
  desde: string
  hasta: string
}) {
  const [abierto, setAbierto] = React.useState(false)
  const share = Math.round((Number(f.ventasTotal) / maxVenta) * 100)

  const top = useQuery({
    queryKey: ["top-productos", f.sucursalId, desde, hasta],
    queryFn: () => topProductos(desde, hasta, f.sucursalId, 5),
    enabled: abierto,
  })

  return (
    <div>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-muted/30"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium">{f.sucursal}</span>
            <span className="font-mono text-xs text-muted-foreground">
              {f.codigo}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${share}%` }}
            />
          </div>
        </div>
        <div className="hidden text-right sm:block">
          <p className="text-xs text-muted-foreground">Ventas</p>
          <p className="font-semibold tabular-nums">{money(f.ventasTotal)}</p>
        </div>
        <div className="hidden text-right md:block">
          <p className="text-xs text-muted-foreground">N°</p>
          <p className="tabular-nums">{f.ventasCantidad}</p>
        </div>
        <div className="hidden text-right md:block">
          <p className="text-xs text-muted-foreground">Ticket prom.</p>
          <p className="tabular-nums">{money(f.ticketPromedio)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Inventario</p>
          <p className="tabular-nums">{money(f.valorInventario)}</p>
        </div>
        <RiArrowRightLine
          className={`size-4 shrink-0 text-muted-foreground transition-transform ${
            abierto ? "rotate-90" : ""
          }`}
        />
      </button>

      {abierto ? (
        <div className="border-t bg-muted/20 px-4 py-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Top productos de esta sucursal
          </p>
          {top.isLoading ? (
            <Skeleton className="h-16 w-full rounded-lg" />
          ) : (top.data ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin ventas.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {(top.data ?? []).map((p, i) => (
                <div
                  key={p.varianteId ?? i}
                  className="flex items-center justify-between gap-3 rounded-lg bg-card px-3 py-2 text-sm"
                >
                  <span className="min-w-0 truncate">
                    <span className="mr-2 text-xs text-muted-foreground">
                      {i + 1}.
                    </span>
                    {p.nombre}
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {Number(p.cantidad).toLocaleString("es-PE")} u ·{" "}
                    <span className="font-semibold">{money(p.total)}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

function Kpi({
  icon: Icon,
  label,
  valor,
  cargando,
  destacado,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  valor: string
  cargando: boolean
  destacado?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm ring-1 ring-foreground/5 ${
        destacado ? "bg-primary/5" : "bg-card"
      }`}
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="size-4" />
        {label}
      </div>
      {cargando ? (
        <Skeleton className="mt-2 h-7 w-28" />
      ) : (
        <p
          className={`mt-1.5 text-xl font-semibold tabular-nums ${
            destacado ? "text-primary" : ""
          }`}
        >
          {valor}
        </p>
      )}
    </div>
  )
}
