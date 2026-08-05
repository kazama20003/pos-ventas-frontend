"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  RiAddLine,
  RiArrowRightLine,
  RiCloseLine,
  RiErrorWarningLine,
  RiInboxUnarchiveLine,
  RiSearchLine,
  RiTruckLine,
} from "@remixicon/react"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError } from "@/lib/api/client"
import { listarProductos, type VarianteProducto } from "@/lib/api/catalogo"
import { listarAlmacenes } from "@/lib/api/organizacion"
import {
  cancelarTransferencia,
  crearTransferencia,
  listarTransferencias,
  obtenerTransferencia,
  recibirTransferencia,
  type EstadoTransferencia,
  type Transferencia,
} from "@/lib/api/transferencias"

type Linea = { varianteId: string; sku: string; nombre: string; cantidad: number }

const ESTADO_META: Record<
  EstadoTransferencia,
  { label: string; clase: string }
> = {
  BORRADOR: { label: "Borrador", clase: "bg-muted text-muted-foreground" },
  SOLICITADA: { label: "Solicitada", clase: "bg-muted text-muted-foreground" },
  APROBADA: { label: "Aprobada", clase: "bg-muted text-muted-foreground" },
  EN_TRANSITO: {
    label: "En tránsito",
    clase: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  RECIBIDA_PARCIALMENTE: {
    label: "Parcial",
    clase: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  },
  RECIBIDA: {
    label: "Recibida",
    clase: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  CANCELADA: { label: "Cancelada", clase: "bg-destructive/15 text-destructive" },
  RECHAZADA: { label: "Rechazada", clase: "bg-destructive/15 text-destructive" },
}

function nuevaClave() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID()
  return `tr-${Date.now()}-${Math.round(Math.random() * 1e9)}`
}

function EstadoBadge({ estado }: { estado: EstadoTransferencia }) {
  const m = ESTADO_META[estado]
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${m.clase}`}
    >
      {m.label}
    </span>
  )
}

export default function TransferenciasPage() {
  const qc = useQueryClient()
  const almacenes = useQuery({
    queryKey: ["almacenes"],
    queryFn: () => listarAlmacenes(),
  })
  const transferencias = useQuery({
    queryKey: ["transferencias"],
    queryFn: () => listarTransferencias(),
  })

  const [origenId, setOrigenId] = React.useState("")
  const [destinoId, setDestinoId] = React.useState("")
  const [notas, setNotas] = React.useState("")
  const [lineas, setLineas] = React.useState<Linea[]>([])
  const [seleccion, setSeleccion] = React.useState<string | null>(null)

  const opcionesAlmacen = React.useMemo(
    () =>
      (almacenes.data ?? []).map((a) => ({
        value: a.id,
        label: a.nombre,
        hint: a.codigo,
      })),
    [almacenes.data]
  )

  function agregarLinea(v: VarianteProducto) {
    setLineas((prev) => {
      if (prev.some((l) => l.varianteId === v.id)) return prev
      return [
        ...prev,
        { varianteId: v.id, sku: v.sku, nombre: v.nombre, cantidad: 1 },
      ]
    })
  }
  function quitarLinea(id: string) {
    setLineas((prev) => prev.filter((l) => l.varianteId !== id))
  }
  function setCantidad(id: string, cantidad: number) {
    setLineas((prev) =>
      prev.map((l) => (l.varianteId === id ? { ...l, cantidad } : l))
    )
  }

  const mCrear = useMutation({
    mutationFn: () =>
      crearTransferencia({
        almacenOrigenId: origenId,
        almacenDestinoId: destinoId,
        notas: notas.trim() || undefined,
        idempotencyKey: nuevaClave(),
        articulos: lineas.map((l) => ({
          varianteId: l.varianteId,
          cantidad: l.cantidad,
        })),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transferencias"] })
      setLineas([])
      setNotas("")
      setDestinoId("")
    },
  })

  const puedeEnviar =
    origenId &&
    destinoId &&
    origenId !== destinoId &&
    lineas.length > 0 &&
    lineas.every((l) => l.cantidad > 0) &&
    !mCrear.isPending

  const errCrear = mCrear.error as ApiError | Error | null

  return (
    <>
      <PageHeader
        title="Transferencias entre almacenes"
        description="Mueve stock de un almacén a otro. Se descuenta al enviar y se suma al recibir."
      />

      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="grid w-full gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          {/* ---- Nueva transferencia ---- */}
          <section className="rounded-2xl border bg-card p-5 shadow-sm ring-1 ring-foreground/5">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <RiTruckLine className="size-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold leading-tight">
                  Nueva transferencia
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  El stock queda en tránsito hasta confirmarse la recepción.
                </p>
              </div>
            </div>

            <div className="mb-3 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">Origen</Label>
                <Select
                  value={origenId}
                  onChange={setOrigenId}
                  placeholder={almacenes.isLoading ? "Cargando…" : "Almacén origen"}
                  options={opcionesAlmacen.filter((o) => o.value !== destinoId)}
                />
              </div>
              <div className="hidden pb-2.5 text-muted-foreground sm:block">
                <RiArrowRightLine className="size-5" />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">Destino</Label>
                <Select
                  value={destinoId}
                  onChange={setDestinoId}
                  placeholder={almacenes.isLoading ? "Cargando…" : "Almacén destino"}
                  options={opcionesAlmacen.filter((o) => o.value !== origenId)}
                />
              </div>
            </div>

            <BuscadorVariantes onAgregar={agregarLinea} />

            <div className="mt-3 flex flex-col gap-2">
              {lineas.length === 0 ? (
                <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                  Busca productos y agrégalos a la transferencia.
                </p>
              ) : (
                lineas.map((l) => (
                  <div
                    key={l.varianteId}
                    className="flex items-center gap-3 rounded-xl border p-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{l.nombre}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {l.sku}
                      </p>
                    </div>
                    <Input
                      type="number"
                      min={0.000001}
                      step="any"
                      value={l.cantidad}
                      onChange={(e) =>
                        setCantidad(l.varianteId, Number(e.target.value))
                      }
                      className="h-9 w-24"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => quitarLinea(l.varianteId)}
                    >
                      <RiCloseLine />
                    </Button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-3 grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Notas (opcional)</Label>
              <Input
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Ej: reposición tienda centro"
                className="h-10"
              />
            </div>

            {errCrear ? (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-destructive">
                <RiErrorWarningLine className="size-4" />
                {errCrear.message}
              </p>
            ) : null}

            <Button
              type="button"
              className="mt-4 w-full"
              disabled={!puedeEnviar}
              onClick={() => mCrear.mutate()}
            >
              <RiTruckLine />
              {mCrear.isPending ? "Enviando…" : "Enviar transferencia"}
            </Button>
          </section>

          {/* ---- Lista ---- */}
          <section className="rounded-2xl border bg-card p-5 shadow-sm ring-1 ring-foreground/5">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <RiInboxUnarchiveLine className="size-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold leading-tight">
                  Transferencias
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Envíos entre almacenes y su recepción.
                </p>
              </div>
            </div>

            {transferencias.isLoading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : (transferencias.data ?? []).length === 0 ? (
              <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                Sin transferencias todavía.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {(transferencias.data ?? []).map((t) => (
                  <FilaTransferencia
                    key={t.id}
                    t={t}
                    abierta={seleccion === t.id}
                    onToggle={() =>
                      setSeleccion((s) => (s === t.id ? null : t.id))
                    }
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  )
}

function BuscadorVariantes({
  onAgregar,
}: {
  onAgregar: (v: VarianteProducto) => void
}) {
  const [q, setQ] = React.useState("")
  const [debounced, setDebounced] = React.useState("")
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300)
    return () => clearTimeout(t)
  }, [q])

  const busqueda = useQuery({
    queryKey: ["productos", "buscar-transferencia", debounced],
    queryFn: () => listarProductos({ q: debounced, pageSize: 8 }),
    enabled: debounced.length >= 2,
  })

  const variantes = React.useMemo(() => {
    const items = busqueda.data?.items ?? []
    return items.flatMap((p) =>
      (p.variants ?? []).map((v) => ({ producto: p.nombre, variante: v }))
    )
  }, [busqueda.data])

  return (
    <div className="relative">
      <div className="relative">
        <RiSearchLine className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar producto para agregar…"
          className="h-10 pl-9"
        />
      </div>
      {debounced.length >= 2 ? (
        <div className="mt-1.5 max-h-56 overflow-auto rounded-xl border bg-card p-1 shadow-sm">
          {busqueda.isLoading ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">Buscando…</p>
          ) : variantes.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              Sin resultados.
            </p>
          ) : (
            variantes.map(({ producto, variante }) => (
              <button
                key={variante.id}
                type="button"
                onClick={() => {
                  onAgregar(variante)
                  setQ("")
                  setDebounced("")
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
              >
                <RiAddLine className="size-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate">
                  {producto}
                  {variante.nombre && variante.nombre !== producto
                    ? ` · ${variante.nombre}`
                    : ""}
                </span>
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  {variante.sku}
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}

function FilaTransferencia({
  t,
  abierta,
  onToggle,
}: {
  t: Transferencia
  abierta: boolean
  onToggle: () => void
}) {
  return (
    <div className="rounded-xl border">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-muted/40"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-medium">{t.number}</span>
            <EstadoBadge estado={t.estado} />
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {t.originWarehouse?.nombre ?? "—"} →{" "}
            {t.destinationWarehouse?.nombre ?? "—"}
            {typeof t._count?.articulos === "number"
              ? ` · ${t._count.articulos} ítem(s)`
              : ""}
          </p>
        </div>
        <RiArrowRightLine
          className={`size-4 shrink-0 text-muted-foreground transition-transform ${
            abierta ? "rotate-90" : ""
          }`}
        />
      </button>
      {abierta ? <DetalleTransferencia id={t.id} /> : null}
    </div>
  )
}

function DetalleTransferencia({ id }: { id: string }) {
  const qc = useQueryClient()
  const detalle = useQuery({
    queryKey: ["transferencia", id],
    queryFn: () => obtenerTransferencia(id),
  })

  // Overrides manuales; si no hay override se usa lo pendiente por recibir.
  const [overrides, setOverrides] = React.useState<Record<string, number>>({})

  const t = detalle.data
  const editable =
    t?.estado === "EN_TRANSITO" || t?.estado === "RECIBIDA_PARCIALMENTE"

  const pendienteDe = (a: { shippedQty: string | number; receivedQty: string | number }) => {
    const pend = Number(a.shippedQty) - Number(a.receivedQty)
    return pend > 0 ? pend : 0
  }
  const valorRecibir = (a: {
    varianteId: string
    shippedQty: string | number
    receivedQty: string | number
  }) => overrides[a.varianteId] ?? pendienteDe(a)

  const invalidar = () => {
    qc.invalidateQueries({ queryKey: ["transferencias"] })
    qc.invalidateQueries({ queryKey: ["transferencia", id] })
  }

  const mRecibir = useMutation({
    mutationFn: () =>
      recibirTransferencia(id, {
        idempotencyKey:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `rec-${Date.now()}`,
        articulos: (t?.articulos ?? [])
          .map((a) => ({ varianteId: a.varianteId, cantidad: valorRecibir(a) }))
          .filter((x) => x.cantidad > 0),
      }),
    onSuccess: invalidar,
  })

  const mCancelar = useMutation({
    mutationFn: () => cancelarTransferencia(id),
    onSuccess: invalidar,
  })

  if (detalle.isLoading || !t) {
    return (
      <div className="border-t p-3">
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    )
  }

  const err = (mRecibir.error || mCancelar.error) as ApiError | Error | null
  const hayRecibir = (t.articulos ?? []).some((a) => valorRecibir(a) > 0)

  return (
    <div className="border-t p-3">
      <div className="flex flex-col gap-2">
        {(t.articulos ?? []).map((a) => {
          const enviado = Number(a.shippedQty)
          const recibido = Number(a.receivedQty)
          const pendiente = enviado - recibido
          return (
            <div
              key={a.id}
              className="flex items-center gap-3 rounded-lg bg-muted/30 p-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  {a.variant?.nombre ?? a.varianteId}
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  {a.variant?.sku ?? ""} · env {enviado} · rec {recibido} · pend{" "}
                  {pendiente}
                </p>
              </div>
              {editable && pendiente > 0 ? (
                <Input
                  type="number"
                  min={0}
                  max={pendiente}
                  step="any"
                  value={valorRecibir(a)}
                  onChange={(e) =>
                    setOverrides((r) => ({
                      ...r,
                      [a.varianteId]: Number(e.target.value),
                    }))
                  }
                  className="h-9 w-24"
                />
              ) : null}
            </div>
          )
        })}
      </div>

      {err ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-destructive">
          <RiErrorWarningLine className="size-4" />
          {err.message}
        </p>
      ) : null}

      {editable ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={!hayRecibir || mRecibir.isPending}
            onClick={() => mRecibir.mutate()}
          >
            <RiInboxUnarchiveLine />
            {mRecibir.isPending ? "Recibiendo…" : "Confirmar recepción"}
          </Button>
          {t.estado === "EN_TRANSITO" && recibido0(t) ? (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={mCancelar.isPending}
              onClick={() => mCancelar.mutate()}
            >
              <RiCloseLine />
              {mCancelar.isPending ? "Cancelando…" : "Cancelar"}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

// Solo se puede cancelar si nada se recibió aún.
function recibido0(t: Transferencia) {
  return (t.articulos ?? []).every((a) => Number(a.receivedQty) === 0)
}
