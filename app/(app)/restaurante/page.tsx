"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { RiAddLine, RiRestaurant2Line, RiTakeawayLine } from "@remixicon/react"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { listarSucursales } from "@/lib/api/organizacion"
import {
  crearComanda,
  crearMesa,
  obtenerMapa,
  type EstadoMesa,
  type MapaMesa,
} from "@/lib/api/restaurante"
import { cn } from "@/lib/utils"

function money(v: string | number) {
  const n = typeof v === "string" ? parseFloat(v) : v
  return Number.isFinite(n) ? n.toFixed(2) : "0.00"
}

const ESTADO_LABEL: Record<EstadoMesa, string> = {
  LIBRE: "Libre",
  OCUPADA: "Ocupada",
  CUENTA: "Por pagar",
  RESERVADA: "Reservada",
  INACTIVA: "Inactiva",
}

// Color de tarjeta por estado de mesa.
function mesaClases(estado: EstadoMesa) {
  switch (estado) {
    case "LIBRE":
      return "border-emerald-300/60 bg-emerald-50 dark:bg-emerald-500/10"
    case "OCUPADA":
      return "border-amber-300/60 bg-amber-50 dark:bg-amber-500/10"
    case "CUENTA":
      return "border-blue-300/60 bg-blue-50 dark:bg-blue-500/10"
    case "RESERVADA":
      return "border-violet-300/60 bg-violet-50 dark:bg-violet-500/10"
    default:
      return "border-border bg-muted/40 opacity-70"
  }
}

export default function RestauranteSalonPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [sucursalId, setSucursalId] = React.useState("")
  const [nuevaMesa, setNuevaMesa] = React.useState(false)
  const [form, setForm] = React.useState({ codigo: "", nombre: "", capacidad: "" })

  const sucursales = useQuery({
    queryKey: ["sucursales"],
    queryFn: listarSucursales,
  })

  // Default: primera sucursal.
  React.useEffect(() => {
    if (!sucursalId && sucursales.data && sucursales.data.length > 0) {
      setSucursalId(sucursales.data[0].id)
    }
  }, [sucursales.data, sucursalId])

  const mapa = useQuery({
    queryKey: ["restaurante-mapa", sucursalId],
    queryFn: () => obtenerMapa(sucursalId),
    enabled: Boolean(sucursalId),
  })

  const abrirComanda = useMutation({
    mutationFn: (vars: { mesaId?: string; tipo: "MESA" | "LLEVAR" }) =>
      crearComanda({
        sucursalId,
        tipo: vars.tipo,
        mesaId: vars.mesaId,
      }),
    onSuccess: (comanda) => {
      qc.invalidateQueries({ queryKey: ["restaurante-mapa", sucursalId] })
      router.push(`/restaurante/comanda/${comanda.id}`)
    },
  })

  const crearMesaMut = useMutation({
    mutationFn: () =>
      crearMesa({
        sucursalId,
        codigo: form.codigo.trim(),
        nombre: form.nombre.trim() || form.codigo.trim(),
        capacidad: form.capacidad ? Number(form.capacidad) : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["restaurante-mapa", sucursalId] })
      setForm({ codigo: "", nombre: "", capacidad: "" })
      setNuevaMesa(false)
    },
  })

  function clickMesa(m: MapaMesa) {
    if (m.comanda) {
      router.push(`/restaurante/comanda/${m.comanda.id}`)
      return
    }
    if (m.estado === "INACTIVA") return
    abrirComanda.mutate({ mesaId: m.id, tipo: "MESA" })
  }

  const mesas = mapa.data ?? []

  return (
    <>
      <PageHeader
        title="Salón"
        description="Mapa de mesas y comandas en curso"
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
            <Button
              variant="outline"
              size="sm"
              disabled={!sucursalId || abrirComanda.isPending}
              onClick={() => abrirComanda.mutate({ tipo: "LLEVAR" })}
            >
              <RiTakeawayLine />
              Para llevar
            </Button>
            <Button
              size="sm"
              disabled={!sucursalId}
              onClick={() => setNuevaMesa((v) => !v)}
            >
              <RiAddLine />
              Nueva mesa
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
          {nuevaMesa ? (
            <div className="flex flex-wrap items-end gap-2 rounded-2xl border bg-card p-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Código</label>
                <Input
                  className="w-32"
                  value={form.codigo}
                  onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                  placeholder="M-01"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Nombre</label>
                <Input
                  className="w-44"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Mesa 1"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Capacidad</label>
                <Input
                  className="w-24"
                  type="number"
                  value={form.capacidad}
                  onChange={(e) =>
                    setForm({ ...form, capacidad: e.target.value })
                  }
                  placeholder="4"
                />
              </div>
              <Button
                size="sm"
                disabled={!form.codigo.trim() || crearMesaMut.isPending}
                onClick={() => crearMesaMut.mutate()}
              >
                Guardar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNuevaMesa(false)}
              >
                Cancelar
              </Button>
              {crearMesaMut.isError ? (
                <span className="text-xs text-destructive">
                  {(crearMesaMut.error as Error).message}
                </span>
              ) : null}
            </div>
          ) : null}

          {mapa.isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
          ) : mapa.isError ? (
            <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              No se pudo cargar el salón: {(mapa.error as Error).message}
            </div>
          ) : mesas.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed py-16 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <RiRestaurant2Line className="size-7" />
              </span>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">Aún no hay mesas</h2>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Crea tu primera mesa o toma un pedido para llevar.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {mesas.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => clickMesa(m)}
                  disabled={abrirComanda.isPending}
                  className={cn(
                    "flex h-28 flex-col items-start justify-between rounded-2xl border p-3 text-left shadow-sm transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    mesaClases(m.estado)
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="truncate font-semibold">{m.nombre}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {m.codigo}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {ESTADO_LABEL[m.estado]}
                    {m.capacidad ? ` · ${m.capacidad} pers.` : ""}
                  </div>
                  {m.comanda ? (
                    <div className="w-full">
                      <div className="text-sm font-semibold tabular-nums">
                        S/ {money(m.comanda.total)}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {m.comanda.estado}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-muted-foreground">
                      Toca para abrir comanda
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
