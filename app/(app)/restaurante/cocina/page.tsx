"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { RiCheckboxCircleLine, RiFireLine, RiRefreshLine } from "@remixicon/react"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { listarSucursales } from "@/lib/api/organizacion"
import {
  actualizarEstadoCocina,
  obtenerKds,
  type EstacionCocina,
  type EstadoCocinaItem,
} from "@/lib/api/restaurante"
import { cn } from "@/lib/utils"

// Siguiente estado + etiqueta del botón para avanzar la preparación.
const SIGUIENTE: Partial<
  Record<EstadoCocinaItem, { estado: EstadoCocinaItem; label: string }>
> = {
  PENDIENTE: { estado: "EN_PREPARACION", label: "Preparar" },
  EN_PREPARACION: { estado: "LISTO", label: "Listo" },
  LISTO: { estado: "ENTREGADO", label: "Entregar" },
}

const ESTACION_OPTS = [
  { value: "", label: "Todas las estaciones" },
  { value: "COCINA", label: "Cocina" },
  { value: "BARRA", label: "Barra" },
  { value: "OTRO", label: "Otro" },
]

function itemClases(estado: EstadoCocinaItem) {
  switch (estado) {
    case "PENDIENTE":
      return "border-amber-300/60 bg-amber-50 dark:bg-amber-500/10"
    case "EN_PREPARACION":
      return "border-blue-300/60 bg-blue-50 dark:bg-blue-500/10"
    case "LISTO":
      return "border-emerald-300/60 bg-emerald-50 dark:bg-emerald-500/10"
    default:
      return "border-border bg-muted/40"
  }
}

export default function CocinaKdsPage() {
  const qc = useQueryClient()
  const [sucursalId, setSucursalId] = React.useState("")
  const [estacion, setEstacion] = React.useState("")

  const sucursales = useQuery({
    queryKey: ["sucursales"],
    queryFn: listarSucursales,
  })

  React.useEffect(() => {
    if (!sucursalId && sucursales.data && sucursales.data.length > 0) {
      setSucursalId(sucursales.data[0].id)
    }
  }, [sucursales.data, sucursalId])

  const kds = useQuery({
    queryKey: ["kds", sucursalId, estacion],
    queryFn: () =>
      obtenerKds({
        sucursalId,
        estacion: (estacion || undefined) as EstacionCocina | undefined,
      }),
    enabled: Boolean(sucursalId),
    refetchInterval: 10_000,
  })

  const avanzar = useMutation({
    mutationFn: (vars: { itemId: string; estado: EstadoCocinaItem }) =>
      actualizarEstadoCocina(vars.itemId, vars.estado),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kds"] }),
  })

  const comandas = kds.data ?? []

  return (
    <>
      <PageHeader
        title="Cocina (KDS)"
        description="Pantalla de preparación en tiempo real"
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Select
              className="w-44"
              value={sucursalId}
              onChange={setSucursalId}
              placeholder="Sucursal"
              options={(sucursales.data ?? []).map((s) => ({
                value: s.id,
                label: s.nombre,
              }))}
            />
            <Select
              className="w-44"
              value={estacion}
              onChange={setEstacion}
              options={ESTACION_OPTS}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => kds.refetch()}
            >
              <RiRefreshLine />
              Actualizar
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
          {kds.isLoading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-2xl" />
              ))}
            </div>
          ) : kds.isError ? (
            <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              No se pudo cargar la cocina: {(kds.error as Error).message}
            </div>
          ) : comandas.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed py-16 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <RiCheckboxCircleLine className="size-7" />
              </span>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">Nada pendiente</h2>
                <p className="max-w-sm text-sm text-muted-foreground">
                  No hay pedidos en preparación por ahora.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {comandas.map((c) => {
                const items = c.items.filter(
                  (it) =>
                    it.estadoCocina !== "ENTREGADO" &&
                    it.estadoCocina !== "CANCELADO"
                )
                if (items.length === 0) return null
                return (
                  <div
                    key={c.id}
                    className="flex flex-col gap-2 rounded-2xl border bg-card p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 font-semibold">
                        <RiFireLine className="size-4 text-primary" />
                        {c.mesa?.nombre ?? c.mesa?.codigo ?? c.tipo}
                      </span>
                      <Badge variant="outline">{c.tipo}</Badge>
                    </div>
                    <div className="flex flex-col gap-2">
                      {items.map((it) => {
                        const next = SIGUIENTE[it.estadoCocina]
                        return (
                          <div
                            key={it.id}
                            className={cn(
                              "flex items-start gap-2 rounded-xl border p-2.5",
                              itemClases(it.estadoCocina)
                            )}
                          >
                            <span className="min-w-7 text-center font-semibold tabular-nums">
                              {Number(it.cantidad)}×
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium">
                                {it.productoNombre}
                              </div>
                              {it.modificadores?.length ? (
                                <div className="text-xs text-muted-foreground">
                                  {it.modificadores
                                    .map((m) => m.nombre)
                                    .join(", ")}
                                </div>
                              ) : null}
                              {it.notas ? (
                                <div className="text-xs italic text-muted-foreground">
                                  {it.notas}
                                </div>
                              ) : null}
                              {it.estacion ? (
                                <div className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                                  {it.estacion}
                                </div>
                              ) : null}
                            </div>
                            {next ? (
                              <Button
                                size="xs"
                                disabled={avanzar.isPending}
                                onClick={() =>
                                  avanzar.mutate({
                                    itemId: it.id,
                                    estado: next.estado,
                                  })
                                }
                              >
                                {next.label}
                              </Button>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
