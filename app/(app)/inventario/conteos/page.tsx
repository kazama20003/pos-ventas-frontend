"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  RiAddLine,
  RiCheckboxCircleLine,
  RiClipboardLine,
  RiCloseLine,
  RiErrorWarningLine,
} from "@remixicon/react"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError } from "@/lib/api/client"
import {
  cancelarConteo,
  contabilizarConteo,
  crearConteo,
  listarConteos,
  obtenerConteo,
  registrarConteo,
  type Conteo,
  type EstadoConteo,
} from "@/lib/api/inventario"
import { listarAlmacenes } from "@/lib/api/organizacion"

const ESTADO_META: Record<EstadoConteo, { label: string; clase: string }> = {
  BORRADOR: { label: "Borrador", clase: "bg-muted text-muted-foreground" },
  EN_PROGRESO: {
    label: "En progreso",
    clase: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  },
  ENVIADO: {
    label: "Enviado",
    clase: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  },
  APROBADO: {
    label: "Aprobado",
    clase: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  },
  CONTABILIZADO: {
    label: "Contabilizado",
    clase: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  CANCELADO: { label: "Cancelado", clase: "bg-destructive/15 text-destructive" },
}

function num(v: string | number | null) {
  if (v === null) return "—"
  return Number(v).toLocaleString("es-PE", { maximumFractionDigits: 6 })
}

function Badge({ estado }: { estado: EstadoConteo }) {
  const m = ESTADO_META[estado]
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${m.clase}`}
    >
      {m.label}
    </span>
  )
}

export default function ConteosPage() {
  const qc = useQueryClient()
  const conteos = useQuery({ queryKey: ["conteos"], queryFn: () => listarConteos() })
  const almacenes = useQuery({
    queryKey: ["almacenes"],
    queryFn: () => listarAlmacenes(),
  })

  const [almacenId, setAlmacenId] = React.useState("")
  const [seleccion, setSeleccion] = React.useState<string | null>(null)

  const mCrear = useMutation({
    mutationFn: () => crearConteo(almacenId),
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ["conteos"] })
      setSeleccion(c.id)
      setAlmacenId("")
    },
  })
  const errCrear = mCrear.error as ApiError | Error | null

  return (
    <>
      <PageHeader
        title="Conteos físicos"
        description="Compara el stock del sistema con el conteo real y ajusta la diferencia."
      />

      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
          {/* Lista + crear */}
          <section className="flex h-fit flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm ring-1 ring-foreground/5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <RiClipboardLine className="size-4 text-primary" />
              Nuevo conteo
            </h2>
            <div className="flex flex-col gap-2 rounded-xl bg-muted/40 p-3">
              <Label className="text-xs text-muted-foreground">Almacén</Label>
              <Select
                value={almacenId}
                onChange={setAlmacenId}
                placeholder={almacenes.isLoading ? "Cargando…" : "Elige almacén"}
                options={(almacenes.data ?? []).map((a) => ({
                  value: a.id,
                  label: a.nombre,
                  hint: a.codigo,
                }))}
              />
              {errCrear ? (
                <p className="flex items-center gap-1.5 text-xs text-destructive">
                  <RiErrorWarningLine className="size-4" />
                  {errCrear.message}
                </p>
              ) : null}
              <Button
                type="button"
                size="sm"
                disabled={!almacenId || mCrear.isPending}
                onClick={() => mCrear.mutate()}
              >
                <RiAddLine />
                {mCrear.isPending ? "Creando…" : "Iniciar conteo"}
              </Button>
            </div>

            <div className="mt-1 border-t pt-3">
              {conteos.isLoading ? (
                <div className="flex flex-col gap-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-xl" />
                  ))}
                </div>
              ) : (conteos.data ?? []).length === 0 ? (
                <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                  Sin conteos todavía.
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {(conteos.data ?? []).map((c) => {
                    const on = c.id === seleccion
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSeleccion(c.id)}
                        className={`rounded-xl border p-3 text-left transition-colors ${
                          on
                            ? "border-primary/40 bg-primary/5"
                            : "hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-sm font-medium">
                            {c.number}
                          </span>
                          <Badge estado={c.estado} />
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {c.warehouse?.nombre ?? "—"} ·{" "}
                          {c._count?.articulos ?? 0} ítems
                        </p>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Detalle */}
          {seleccion ? (
            <DetalleConteo key={seleccion} id={seleccion} />
          ) : (
            <section className="flex items-center justify-center rounded-2xl border border-dashed bg-card p-10 text-sm text-muted-foreground">
              Elige o inicia un conteo para registrar cantidades.
            </section>
          )}
        </div>
      </div>
    </>
  )
}

function DetalleConteo({ id }: { id: string }) {
  const qc = useQueryClient()
  const detalle = useQuery({
    queryKey: ["conteo", id],
    queryFn: () => obtenerConteo(id),
  })
  const [contado, setContado] = React.useState<Record<string, string>>({})

  const c = detalle.data
  const editable = c?.estado === "EN_PROGRESO" || c?.estado === "ENVIADO"

  const invalidar = () => {
    qc.invalidateQueries({ queryKey: ["conteos"] })
    qc.invalidateQueries({ queryKey: ["conteo", id] })
  }

  const mRegistrar = useMutation({
    mutationFn: () =>
      registrarConteo(id, {
        articulos: Object.entries(contado)
          .filter(([, v]) => v !== "")
          .map(([varianteId, v]) => ({
            varianteId,
            cantidadContada: Number(v),
          })),
      }),
    onSuccess: () => {
      invalidar()
      setContado({})
    },
  })
  const mContabilizar = useMutation({
    mutationFn: () => contabilizarConteo(id),
    onSuccess: invalidar,
  })
  const mCancelar = useMutation({
    mutationFn: () => cancelarConteo(id),
    onSuccess: invalidar,
  })

  if (detalle.isLoading || !c) {
    return <Skeleton className="h-96 w-full rounded-2xl" />
  }

  const err = (mRegistrar.error ||
    mContabilizar.error ||
    mCancelar.error) as ApiError | Error | null

  // Valor mostrado en el input: lo escrito, o lo ya contado guardado.
  const valorInput = (it: NonNullable<Conteo["articulos"]>[number]) =>
    contado[it.varianteId] ?? (it.cantidadContada ?? "")

  const hayCambios = Object.values(contado).some((v) => v !== "")

  return (
    <section className="flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm ring-1 ring-foreground/5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 p-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold">{c.number}</span>
            <Badge estado={c.estado} />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {c.warehouse?.nombre ?? "—"} · {c.articulos?.length ?? 0} ítems
          </p>
        </div>
        {editable ? (
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!hayCambios || mRegistrar.isPending}
              onClick={() => mRegistrar.mutate()}
            >
              {mRegistrar.isPending ? "Guardando…" : "Guardar conteo"}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={mContabilizar.isPending}
              onClick={() => mContabilizar.mutate()}
            >
              <RiCheckboxCircleLine />
              {mContabilizar.isPending ? "Contabilizando…" : "Contabilizar"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={mCancelar.isPending}
              onClick={() => mCancelar.mutate()}
            >
              <RiCloseLine />
            </Button>
          </div>
        ) : null}
      </div>

      {err ? (
        <p className="flex items-center gap-1.5 border-b bg-destructive/5 px-4 py-2 text-xs text-destructive">
          <RiErrorWarningLine className="size-4" />
          {err.message}
        </p>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Producto</th>
              <th className="px-4 py-2.5 text-right font-medium">Esperado</th>
              <th className="px-4 py-2.5 text-right font-medium">Contado</th>
              <th className="px-4 py-2.5 text-right font-medium">Diferencia</th>
            </tr>
          </thead>
          <tbody>
            {(c.articulos ?? []).map((it) => {
              const val = valorInput(it)
              const dif =
                val === "" || val === null
                  ? null
                  : Number(val) - Number(it.cantidadEsperada)
              return (
                <tr key={it.id} className="border-b">
                  <td className="px-4 py-2">
                    <p className="font-medium">{it.variant?.nombre ?? "—"}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {it.variant?.sku ?? ""}
                    </p>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">
                    {num(it.cantidadEsperada)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {editable ? (
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        value={val ?? ""}
                        onChange={(e) =>
                          setContado((s) => ({
                            ...s,
                            [it.varianteId]: e.target.value,
                          }))
                        }
                        className="ml-auto h-8 w-24"
                      />
                    ) : (
                      <span className="tabular-nums">
                        {num(it.cantidadContada)}
                      </span>
                    )}
                  </td>
                  <td
                    className={`px-4 py-2 text-right font-medium tabular-nums ${
                      dif === null || dif === 0
                        ? "text-muted-foreground"
                        : dif > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-destructive"
                    }`}
                  >
                    {dif === null
                      ? "—"
                      : dif > 0
                        ? `+${num(dif)}`
                        : num(dif)}
                  </td>
                </tr>
              )
            })}
            {(c.articulos ?? []).length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  Este almacén no tenía stock al iniciar el conteo.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  )
}
