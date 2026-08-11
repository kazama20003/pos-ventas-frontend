"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  RiAddLine,
  RiBookmark3Line,
  RiCloseLine,
  RiErrorWarningLine,
  RiLockUnlockLine,
  RiSearchLine,
} from "@remixicon/react"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError } from "@/lib/api/client"
import { listarProductos, type VarianteProducto } from "@/lib/api/catalogo"
import {
  crearReserva,
  liberarReserva,
  listarReservas,
  type EstadoReserva,
  type Reserva,
} from "@/lib/api/inventario"
import { listarAlmacenes } from "@/lib/api/organizacion"

const ESTADO_META: Record<EstadoReserva, { label: string; clase: string }> = {
  ACTIVA: {
    label: "Activa",
    clase: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  },
  PARCIALMENTE_ATENDIDA: {
    label: "Parcial",
    clase: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  ATENDIDA: {
    label: "Atendida",
    clase: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  LIBERADA: { label: "Liberada", clase: "bg-muted text-muted-foreground" },
  VENCIDA: { label: "Vencida", clase: "bg-muted text-muted-foreground" },
  CANCELADA: { label: "Cancelada", clase: "bg-destructive/15 text-destructive" },
}

function num(v: string | number) {
  return Number(v).toLocaleString("es-PE", { maximumFractionDigits: 6 })
}

export default function ReservasPage() {
  const qc = useQueryClient()
  const almacenes = useQuery({
    queryKey: ["almacenes"],
    queryFn: () => listarAlmacenes(),
  })
  const [estadoFiltro, setEstadoFiltro] = React.useState("")
  const reservas = useQuery({
    queryKey: ["reservas", estadoFiltro],
    queryFn: () => listarReservas(undefined, estadoFiltro || undefined),
  })

  const invalidar = () => qc.invalidateQueries({ queryKey: ["reservas"] })

  const mLiberar = useMutation({
    mutationFn: (id: string) => liberarReserva(id),
    onSuccess: invalidar,
  })

  return (
    <>
      <PageHeader
        title="Reservas de stock"
        description="Aparta stock disponible para un pedido sin descontarlo del físico."
      />

      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
          {/* Crear */}
          <FormularioReserva
            almacenes={almacenes.data ?? []}
            onCreada={invalidar}
          />

          {/* Lista */}
          <section className="overflow-hidden rounded-2xl border bg-card shadow-sm ring-1 ring-foreground/5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/30 px-4 py-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <RiBookmark3Line className="size-4 text-primary" />
                Reservas
              </h2>
              <div className="w-44">
                <Select
                  value={estadoFiltro}
                  onChange={setEstadoFiltro}
                  placeholder="Todos los estados"
                  options={[
                    { value: "", label: "Todos los estados" },
                    { value: "ACTIVA", label: "Activas" },
                    { value: "LIBERADA", label: "Liberadas" },
                    { value: "ATENDIDA", label: "Atendidas" },
                  ]}
                />
              </div>
            </div>

            {reservas.isLoading ? (
              <div className="flex flex-col gap-2 p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : (reservas.data ?? []).length === 0 ? (
              <p className="p-10 text-center text-sm text-muted-foreground">
                Sin reservas.
              </p>
            ) : (
              <div className="divide-y">
                {(reservas.data ?? []).map((r) => (
                  <FilaReserva
                    key={r.id}
                    r={r}
                    onLiberar={() => mLiberar.mutate(r.id)}
                    liberando={mLiberar.isPending}
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

function FilaReserva({
  r,
  onLiberar,
  liberando,
}: {
  r: Reserva
  onLiberar: () => void
  liberando: boolean
}) {
  const meta = ESTADO_META[r.estado]
  const pendiente = Number(r.cantidad) - Number(r.cantidadAtendida)
  const activa = r.estado === "ACTIVA" || r.estado === "PARCIALMENTE_ATENDIDA"
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">
            {r.variant?.nombre ?? "—"}
          </span>
          <span
            className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${meta.clase}`}
          >
            {meta.label}
          </span>
        </div>
        <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
          {r.variant?.sku ?? ""} · {r.warehouse?.nombre ?? "—"} ·{" "}
          {r.referenciaType}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold tabular-nums">{num(r.cantidad)}</p>
        <p className="text-xs text-muted-foreground">pend {num(pendiente)}</p>
      </div>
      {activa ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={liberando}
          onClick={onLiberar}
        >
          <RiLockUnlockLine />
          Liberar
        </Button>
      ) : null}
    </div>
  )
}

function FormularioReserva({
  almacenes,
  onCreada,
}: {
  almacenes: { id: string; nombre: string; codigo: string }[]
  onCreada: () => void
}) {
  const [almacenId, setAlmacenId] = React.useState("")
  const [variante, setVariante] = React.useState<{
    id: string
    label: string
  } | null>(null)
  const [cantidad, setCantidad] = React.useState("")
  const [referencia, setReferencia] = React.useState("")

  const m = useMutation({
    mutationFn: () =>
      crearReserva({
        almacenId,
        varianteId: variante!.id,
        cantidad: Number(cantidad),
        referencia: referencia.trim() || undefined,
      }),
    onSuccess: () => {
      onCreada()
      setVariante(null)
      setCantidad("")
      setReferencia("")
    },
  })
  const err = m.error as ApiError | Error | null
  const valido = almacenId && variante && Number(cantidad) > 0

  return (
    <section className="flex h-fit flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm ring-1 ring-foreground/5">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <RiAddLine className="size-4 text-primary" />
        Nueva reserva
      </h2>

      <div className="grid gap-1.5">
        <Label className="text-xs text-muted-foreground">Almacén</Label>
        <Select
          value={almacenId}
          onChange={setAlmacenId}
          placeholder="Elige almacén"
          options={almacenes.map((a) => ({
            value: a.id,
            label: a.nombre,
            hint: a.codigo,
          }))}
        />
      </div>

      <div className="grid gap-1.5">
        <Label className="text-xs text-muted-foreground">Producto</Label>
        {variante ? (
          <div className="flex items-center gap-2 rounded-xl border p-2.5">
            <span className="min-w-0 flex-1 truncate text-sm">
              {variante.label}
            </span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => setVariante(null)}
            >
              <RiCloseLine />
            </Button>
          </div>
        ) : (
          <BuscadorVariantes
            onElegir={(v, prod) =>
              setVariante({
                id: v.id,
                label: `${prod} · ${v.sku}`,
              })
            }
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-1.5">
          <Label className="text-xs text-muted-foreground">Cantidad</Label>
          <Input
            type="number"
            min={0.000001}
            step="any"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            className="h-10"
          />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs text-muted-foreground">Referencia</Label>
          <Input
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            placeholder="Ej: Pedido 123"
            className="h-10"
          />
        </div>
      </div>

      {err ? (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <RiErrorWarningLine className="size-4" />
          {err.message}
        </p>
      ) : null}

      <Button
        type="button"
        disabled={!valido || m.isPending}
        onClick={() => m.mutate()}
      >
        <RiBookmark3Line />
        {m.isPending ? "Reservando…" : "Reservar stock"}
      </Button>
    </section>
  )
}

function BuscadorVariantes({
  onElegir,
}: {
  onElegir: (v: VarianteProducto, producto: string) => void
}) {
  const [q, setQ] = React.useState("")
  const [debounced, setDebounced] = React.useState("")
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300)
    return () => clearTimeout(t)
  }, [q])

  const busqueda = useQuery({
    queryKey: ["productos", "buscar-reserva", debounced],
    queryFn: () => listarProductos({ q: debounced, pageSize: 8 }),
    enabled: debounced.length >= 2,
  })

  const variantes = React.useMemo(() => {
    const items = busqueda.data?.items ?? []
    // Los servicios no llevan stock: no se pueden reservar.
    return items
      .filter((p) => p.kind !== "SERVICIO")
      .flatMap((p) =>
        (p.variants ?? []).map((v) => ({ producto: p.nombre, variante: v }))
      )
  }, [busqueda.data])

  return (
    <div>
      <div className="relative">
        <RiSearchLine className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar producto…"
          className="h-10 pl-9"
        />
      </div>
      {debounced.length >= 2 ? (
        <div className="mt-1.5 max-h-52 overflow-auto rounded-xl border bg-card p-1 shadow-sm">
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
                  onElegir(variante, producto)
                  setQ("")
                  setDebounced("")
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
              >
                <span className="min-w-0 flex-1 truncate">{producto}</span>
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
