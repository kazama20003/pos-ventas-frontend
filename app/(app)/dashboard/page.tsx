"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import {
  RiShoppingCart2Line,
  RiMoneyDollarCircleLine,
  RiUser3Line,
  RiArchiveLine,
  RiArrowUpLine,
  RiArrowDownLine,
  RiCashLine,
  RiWalletLine,
  RiBankCardLine,
  RiRefreshLine,
} from "@remixicon/react"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { OnboardingChecklist } from "@/components/onboarding/onboarding-checklist"
import { AlertaVencimientos } from "@/components/inventario/alerta-vencimientos"
import { obtenerDashboard } from "@/lib/api/reportes"

const fmtMoneda = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
})

const moneda = (v: string | number) => fmtMoneda.format(Number(v) || 0)

function calcularDelta(hoy: number, ayer: number): number | null {
  if (!ayer) return null
  return ((hoy - ayer) / ayer) * 100
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) {
    return <span className="text-xs text-muted-foreground">— vs. ayer</span>
  }
  const up = delta >= 0
  return (
    <>
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
          up
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "bg-destructive/10 text-destructive"
        )}
      >
        {up ? (
          <RiArrowUpLine className="size-3" />
        ) : (
          <RiArrowDownLine className="size-3" />
        )}
        {`${up ? "+" : ""}${delta.toFixed(1)}%`}
      </span>
      <span className="ml-2 text-xs text-muted-foreground">vs. ayer</span>
    </>
  )
}

const DIAS = ["D", "L", "M", "X", "J", "V", "S"]

function etiquetaDia(fecha: string) {
  const d = new Date(`${fecha}T12:00:00`)
  return DIAS[d.getDay()] ?? ""
}

function Skeletons() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-7 w-32 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            <div className="h-56 w-full animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 w-full animate-pulse rounded bg-muted" />
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: obtenerDashboard,
    refetchOnWindowFocus: true,
  })

  const deltaVentas = data
    ? calcularDelta(Number(data.hoy.total), Number(data.ayer.total))
    : null
  const deltaTx = data
    ? calcularDelta(data.hoy.cantidad, data.ayer.cantidad)
    : null

  const topHoy = data?.topProductosHoy ?? []
  const topMes = data?.topProductos ?? []
  const usaMes = topHoy.length === 0 && topMes.length > 0
  const top = usaMes ? topMes : topHoy

  const semana = data?.semana ?? []
  const maxSemana = Math.max(...semana.map((d) => Number(d.total) || 0), 0)

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Resumen de la operación de hoy"
        actions={
          <Link href="/ventas">
            <Button size="sm">Nueva venta</Button>
          </Link>
        }
      />
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4 md:p-6">
        <OnboardingChecklist />
        <AlertaVencimientos />

        {isLoading && <Skeletons />}

        {isError && (
          <Card>
            <CardContent className="flex items-center justify-between gap-4 pt-6">
              <p className="text-sm text-muted-foreground">
                No se pudo cargar el resumen del dashboard.
              </p>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                <RiRefreshLine className="size-4" />
                Reintentar
              </Button>
            </CardContent>
          </Card>
        )}

        {data && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardDescription>Ventas de hoy</CardDescription>
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <RiMoneyDollarCircleLine className="size-5" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl">
                    {moneda(data.hoy.total)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DeltaBadge delta={deltaVentas} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardDescription>Transacciones hoy</CardDescription>
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <RiShoppingCart2Line className="size-5" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl">{data.hoy.cantidad}</CardTitle>
                </CardHeader>
                <CardContent>
                  <DeltaBadge delta={deltaTx} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardDescription>Ticket promedio</CardDescription>
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <RiBankCardLine className="size-5" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl">
                    {moneda(data.hoy.ticketPromedio)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <span className="text-xs text-muted-foreground">
                    por venta de hoy
                  </span>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardDescription>Ventas del mes</CardDescription>
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <RiWalletLine className="size-5" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl">
                    {moneda(data.mes.total)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <span className="text-xs text-muted-foreground">
                    {data.mes.cantidad} ventas este mes
                  </span>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Link href="/inventario">
                <Card className="transition-colors hover:bg-accent/50">
                  <CardContent className="flex items-center gap-3 pt-6">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <RiArchiveLine className="size-5" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold tabular-nums">
                        {data.operacion.bajoStock}
                      </p>
                      <p className="text-xs text-muted-foreground">Bajo stock</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/caja">
                <Card className="transition-colors hover:bg-accent/50">
                  <CardContent className="flex items-center gap-3 pt-6">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <RiCashLine className="size-5" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold tabular-nums">
                        {data.operacion.cajasAbiertas}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Cajas abiertas
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/clientes">
                <Card className="transition-colors hover:bg-accent/50">
                  <CardContent className="flex items-center gap-3 pt-6">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <RiUser3Line className="size-5" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold tabular-nums">
                        {data.operacion.clientesNuevosMes}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Clientes nuevos (mes)
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/facturacion">
                <Card className="transition-colors hover:bg-accent/50">
                  <CardContent className="flex items-center gap-3 pt-6">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <RiMoneyDollarCircleLine className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-lg font-semibold tabular-nums">
                        {moneda(data.cxc.saldoPendiente)}
                      </p>
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        Por cobrar
                        {data.cxc.vencidas > 0 && (
                          <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 font-medium text-destructive">
                            {data.cxc.vencidas} vencidas
                          </span>
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Ventas de la semana</CardTitle>
                  <CardDescription>Últimos 7 días</CardDescription>
                </CardHeader>
                <CardContent>
                  {maxSemana === 0 ? (
                    <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                      Aún no hay ventas esta semana
                    </div>
                  ) : (
                    <div className="flex h-56 items-end gap-3">
                      {semana.map((d) => {
                        const total = Number(d.total) || 0
                        const h = Math.round((total / maxSemana) * 100)
                        return (
                          <div
                            key={d.fecha}
                            className="flex flex-1 flex-col items-center gap-2"
                            title={`${d.fecha}: ${moneda(total)} (${d.cantidad} ventas)`}
                          >
                            <div
                              className="w-full rounded-t-lg bg-primary/80 transition-all hover:bg-primary"
                              style={{ height: `${Math.max(h, total > 0 ? 2 : 0)}%` }}
                            />
                            <span className="text-xs text-muted-foreground">
                              {etiquetaDia(d.fecha)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top productos</CardTitle>
                  <CardDescription>
                    {usaMes ? "Más vendidos del mes" : "Más vendidos hoy"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {top.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Sin ventas aún
                    </p>
                  ) : (
                    top.map((p, i) => (
                      <div
                        key={p.varianteId ?? `${p.nombre}-${i}`}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="truncate text-sm">{p.nombre}</span>
                        <span className="shrink-0 text-sm font-medium tabular-nums text-muted-foreground">
                          {Number(p.cantidad) || 0}
                        </span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </>
  )
}
