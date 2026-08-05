"use client"

import * as React from "react"
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import {
  RiAlertLine,
  RiArchiveLine,
  RiCheckLine,
  RiCloseLine,
  RiCoinsLine,
  RiEditLine,
  RiSearchLine,
  RiStackLine,
  RiStore2Line,
} from "@remixicon/react"

import { PageHeader } from "@/components/layout/page-header"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  alertasReabastecimiento,
  consolidadoStock,
  definirNivelStock,
  type FilaStock,
} from "@/lib/api/inventario"
import { listarAlmacenes, listarSucursales } from "@/lib/api/organizacion"

const PAGE_SIZE = 25

function money(v: string | number) {
  const n = Number(v)
  return `S/ ${n.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
function num(v: string | number) {
  const n = Number(v)
  return n.toLocaleString("es-PE", { maximumFractionDigits: 6 })
}

export default function InventarioPage() {
  const qc = useQueryClient()
  const sucursales = useQuery({
    queryKey: ["sucursales"],
    queryFn: listarSucursales,
  })

  const [sucursalId, setSucursalId] = React.useState("")
  const [almacenId, setAlmacenId] = React.useState("")
  const [soloConStock, setSoloConStock] = React.useState(true)
  const [q, setQ] = React.useState("")
  const [debounced, setDebounced] = React.useState("")
  const [page, setPage] = React.useState(1)

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300)
    return () => clearTimeout(t)
  }, [q])

  const almacenes = useQuery({
    queryKey: ["almacenes", sucursalId || "todas"],
    queryFn: () => listarAlmacenes(sucursalId || undefined),
  })

  const stock = useQuery({
    queryKey: [
      "stock-consolidado",
      { sucursalId, almacenId, soloConStock, debounced, page },
    ],
    queryFn: () =>
      consolidadoStock({
        sucursalId: sucursalId || undefined,
        almacenId: almacenId || undefined,
        soloConStock,
        q: debounced || undefined,
        page,
        pageSize: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
  })

  const alertas = useQuery({
    queryKey: ["alertas-stock", { sucursalId, almacenId }],
    queryFn: () =>
      alertasReabastecimiento({
        sucursalId: sucursalId || undefined,
        almacenId: almacenId || undefined,
      }),
  })

  const d = stock.data
  const nAlertas = alertas.data?.total ?? 0

  // Refresca tabla + alertas tras editar un nivel mínimo.
  const invalidarStock = () => {
    qc.invalidateQueries({ queryKey: ["stock-consolidado"] })
    qc.invalidateQueries({ queryKey: ["alertas-stock"] })
  }

  function resetFiltros(cb: () => void) {
    setPage(1)
    cb()
  }

  return (
    <>
      <PageHeader
        title="Stock consolidado"
        description="Existencias y valorizado por almacén y sucursal."
      />

      <div className="flex-1 overflow-auto p-4 md:p-6">
        {/* Filtros */}
        <div className="mb-4 grid gap-3 rounded-2xl border bg-card p-4 shadow-sm ring-1 ring-foreground/5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Sucursal</Label>
            <Select
              value={sucursalId}
              onChange={(v) =>
                resetFiltros(() => {
                  setSucursalId(v)
                  setAlmacenId("")
                })
              }
              placeholder="Todas"
              options={[
                { value: "", label: "Todas las sucursales" },
                ...(sucursales.data ?? []).map((s) => ({
                  value: s.id,
                  label: s.nombre,
                  hint: s.codigo,
                })),
              ]}
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Almacén</Label>
            <Select
              value={almacenId}
              onChange={(v) => resetFiltros(() => setAlmacenId(v))}
              placeholder="Todos"
              options={[
                { value: "", label: "Todos los almacenes" },
                ...(almacenes.data ?? []).map((a) => ({
                  value: a.id,
                  label: a.nombre,
                  hint: a.codigo,
                })),
              ]}
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Buscar producto</Label>
            <div className="relative">
              <RiSearchLine className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => {
                  setPage(1)
                  setQ(e.target.value)
                }}
                placeholder="SKU o nombre…"
                className="h-10 pl-9"
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Existencias</Label>
            <Button
              type="button"
              variant={soloConStock ? "default" : "outline"}
              className="h-10 justify-start"
              onClick={() => resetFiltros(() => setSoloConStock((v) => !v))}
            >
              <RiStackLine />
              {soloConStock ? "Solo con stock" : "Incluir en cero"}
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi
            icon={RiCoinsLine}
            label="Valor total"
            valor={d ? money(d.totales.valor) : "—"}
            cargando={stock.isLoading}
            destacado
          />
          <Kpi
            icon={RiStackLine}
            label="Unidades"
            valor={d ? num(d.totales.unidades) : "—"}
            cargando={stock.isLoading}
          />
          <Kpi
            icon={RiArchiveLine}
            label="Variantes"
            valor={d ? String(d.totales.variantes) : "—"}
            cargando={stock.isLoading}
          />
          <Kpi
            icon={RiAlertLine}
            label="Por reabastecer"
            valor={alertas.isLoading ? "—" : String(nAlertas)}
            cargando={alertas.isLoading}
            alerta={nAlertas > 0}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
          <div className="flex flex-col gap-4">
          {/* Alertas de reabastecimiento */}
          {nAlertas > 0 ? (
            <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 shadow-sm">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
                <RiAlertLine className="size-4" />
                Reabastecer ({nAlertas})
              </h2>
              <div className="flex max-h-80 flex-col gap-2 overflow-auto">
                {(alertas.data?.items ?? []).slice(0, 30).map((a) => (
                  <div
                    key={`${a.varianteId}-${a.almacenId}`}
                    className="rounded-xl border border-amber-500/20 bg-card p-2.5"
                  >
                    <p className="truncate text-sm font-medium">
                      {a.productoNombre ?? a.nombre}
                    </p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {a.sku} · {a.almacenNombre}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {num(a.available)} / mín {num(a.stockMinimo)}
                      </span>
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        pedir {num(a.sugerido)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* Resumen por almacén */}
          <section className="rounded-2xl border bg-card p-4 shadow-sm ring-1 ring-foreground/5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <RiStore2Line className="size-4 text-primary" />
              Valorizado por almacén
            </h2>
            {stock.isLoading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : !d || d.resumenPorAlmacen.length === 0 ? (
              <p className="rounded-xl border border-dashed px-4 py-6 text-center text-xs text-muted-foreground">
                Sin datos.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {d.resumenPorAlmacen.map((a) => (
                  <div key={a.almacenId} className="rounded-xl border p-3">
                    <p className="truncate text-sm font-medium">
                      {a.almacenNombre}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {a.sucursalNombre ?? "—"}
                    </p>
                    <div className="mt-2 flex items-end justify-between">
                      <span className="text-sm font-semibold text-primary">
                        {money(a.valor)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {a.variantes} var · {num(a.unidades)} u
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
          </div>

          {/* Tabla detalle */}
          <section className="overflow-hidden rounded-2xl border bg-card shadow-sm ring-1 ring-foreground/5">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Producto</th>
                    <th className="px-4 py-3 font-medium">Almacén</th>
                    <th className="px-4 py-3 text-right font-medium">Stock</th>
                    <th className="px-4 py-3 text-right font-medium">Disp.</th>
                    <th className="px-4 py-3 text-right font-medium">Tránsito</th>
                    <th className="px-4 py-3 text-right font-medium">Costo</th>
                    <th className="px-4 py-3 text-right font-medium">Valor</th>
                    <th className="px-4 py-3 text-right font-medium">Mín.</th>
                  </tr>
                </thead>
                <tbody>
                  {stock.isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-b">
                        <td colSpan={8} className="px-4 py-2.5">
                          <Skeleton className="h-6 w-full" />
                        </td>
                      </tr>
                    ))
                  ) : !d || d.items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-10 text-center text-sm text-muted-foreground"
                      >
                        Sin existencias para el filtro.
                      </td>
                    </tr>
                  ) : (
                    d.items.map((it) => (
                      <tr
                        key={`${it.varianteId}-${it.almacenId}`}
                        className={`border-b transition-colors hover:bg-muted/30 ${
                          it.bajoMinimo ? "bg-amber-500/5" : ""
                        }`}
                      >
                        <td className="px-4 py-2.5">
                          <p className="font-medium">
                            {it.productoNombre ?? it.nombre}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {it.sku}
                            {it.nombre && it.nombre !== it.productoNombre
                              ? ` · ${it.nombre}`
                              : ""}
                          </p>
                        </td>
                        <td className="px-4 py-2.5">
                          <p>{it.almacenNombre}</p>
                          <p className="text-xs text-muted-foreground">
                            {it.sucursalNombre ?? "—"}
                          </p>
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                          {num(it.enStock)}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                          {num(it.available)}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                          {Number(it.enTransito) > 0 ? num(it.enTransito) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                          {money(it.costoPromedio)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold tabular-nums">
                          {money(it.valor)}
                        </td>
                        <td className="px-2 py-2.5 text-right">
                          <NivelMinimo it={it} onSaved={invalidarStock} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {d && d.total > 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm">
                <span className="text-xs text-muted-foreground">
                  {d.total} fila(s){d.truncado ? " (tope 5000)" : ""} · pág.{" "}
                  {d.page}/{d.totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={d.page <= 1 || stock.isFetching}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Anterior
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={d.page >= d.totalPages || stock.isFetching}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </>
  )
}

function Kpi({
  icon: Icon,
  label,
  valor,
  cargando,
  destacado,
  alerta,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  valor: string
  cargando: boolean
  destacado?: boolean
  alerta?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm ring-1 ring-foreground/5 ${
        alerta
          ? "border-amber-500/30 bg-amber-500/5"
          : destacado
            ? "bg-primary/5"
            : "bg-card"
      }`}
    >
      <div
        className={`flex items-center gap-2 text-xs ${
          alerta ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
        }`}
      >
        <Icon className="size-4" />
        {label}
      </div>
      {cargando ? (
        <Skeleton className="mt-2 h-7 w-24" />
      ) : (
        <p
          className={`mt-1.5 text-xl font-semibold tabular-nums ${
            alerta
              ? "text-amber-600 dark:text-amber-400"
              : destacado
                ? "text-primary"
                : ""
          }`}
        >
          {valor}
        </p>
      )}
    </div>
  )
}

/** Celda editable del stock mínimo (y máximo opcional) de un ítem. */
function NivelMinimo({
  it,
  onSaved,
}: {
  it: FilaStock
  onSaved: () => void
}) {
  const [editando, setEditando] = React.useState(false)
  const [min, setMin] = React.useState(it.stockMinimo)
  const [max, setMax] = React.useState(it.stockMaximo)

  const m = useMutation({
    mutationFn: () =>
      definirNivelStock({
        almacenId: it.almacenId,
        varianteId: it.varianteId,
        stockMinimo: Number(min) || 0,
        stockMaximo: Number(max) || 0,
      }),
    onSuccess: () => {
      onSaved()
      setEditando(false)
    },
  })

  if (!editando) {
    const tieneMin = Number(it.stockMinimo) > 0
    return (
      <button
        type="button"
        onClick={() => {
          setMin(it.stockMinimo)
          setMax(it.stockMaximo)
          setEditando(true)
        }}
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm tabular-nums transition-colors hover:bg-muted"
        title="Definir stock mínimo"
      >
        <span className={tieneMin ? "" : "text-muted-foreground"}>
          {tieneMin ? num(it.stockMinimo) : "—"}
        </span>
        <RiEditLine className="size-3.5 text-muted-foreground" />
      </button>
    )
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Input
        type="number"
        min={0}
        step="any"
        value={min}
        onChange={(e) => setMin(e.target.value)}
        className="h-8 w-20"
        title="Mínimo"
      />
      <Input
        type="number"
        min={0}
        step="any"
        value={max}
        onChange={(e) => setMax(e.target.value)}
        className="h-8 w-20"
        title="Objetivo (máx, opcional)"
      />
      <Button
        type="button"
        size="icon"
        variant="ghost"
        disabled={m.isPending}
        onClick={() => m.mutate()}
      >
        <RiCheckLine />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={() => setEditando(false)}
      >
        <RiCloseLine />
      </Button>
    </div>
  )
}
