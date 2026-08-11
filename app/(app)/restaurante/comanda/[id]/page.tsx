"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  RiAddLine,
  RiArrowLeftLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiSearchLine,
  RiSendPlaneLine,
} from "@remixicon/react"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { listarProductos, type VarianteProducto } from "@/lib/api/catalogo"
import { contextoPos } from "@/lib/api/ventas"
import { sesionAbierta } from "@/lib/api/caja"
import {
  agregarItem,
  cancelarComanda,
  cobrarComanda,
  eliminarItem,
  enviarCocina,
  obtenerComanda,
  type EstacionCocina,
  type ModificadorDto,
} from "@/lib/api/restaurante"
import type { MetodoPago } from "@/lib/api/ventas"
import { cn } from "@/lib/utils"

function money(v: string | number) {
  const n = typeof v === "string" ? parseFloat(v) : v
  return Number.isFinite(n) ? n.toFixed(2) : "0.00"
}

function precioVariante(v: VarianteProducto): number {
  const p = v.prices?.find((pr) => Number(pr.minQuantity) === 1)?.monto
  if (p !== undefined) return Number(p)
  return Number(v.cost) || 0
}

const ESTACIONES: { value: EstacionCocina; label: string }[] = [
  { value: "COCINA", label: "Cocina" },
  { value: "BARRA", label: "Barra" },
  { value: "OTRO", label: "Otro" },
]

const METODOS: { value: MetodoPago; label: string }[] = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TARJETA", label: "Tarjeta" },
  { value: "TRANSFERENCIA_BANCARIA", label: "Transferencia" },
  { value: "BILLETERA_DIGITAL", label: "Billetera digital" },
  { value: "OTRO", label: "Otro" },
]

export default function ComandaPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const params = useParams<{ id: string }>()
  const comandaId = params.id

  const comanda = useQuery({
    queryKey: ["comanda", comandaId],
    queryFn: () => obtenerComanda(comandaId),
  })

  const invalidar = () => {
    qc.invalidateQueries({ queryKey: ["comanda", comandaId] })
  }

  // ---- Agregar producto ----
  const [buscar, setBuscar] = React.useState(false)
  const [q, setQ] = React.useState("")
  const [qDeb, setQDeb] = React.useState("")
  const [seleccion, setSeleccion] = React.useState<{
    variante: VarianteProducto
    productoNombre: string
  } | null>(null)
  const [cantidad, setCantidad] = React.useState("1")
  const [notas, setNotas] = React.useState("")
  const [estacion, setEstacion] = React.useState<EstacionCocina>("COCINA")
  const [mods, setMods] = React.useState<ModificadorDto[]>([])
  const [modNombre, setModNombre] = React.useState("")
  const [modPrecio, setModPrecio] = React.useState("")

  React.useEffect(() => {
    const t = setTimeout(() => setQDeb(q), 300)
    return () => clearTimeout(t)
  }, [q])

  const productos = useQuery({
    queryKey: ["restaurante-productos", qDeb],
    queryFn: () => listarProductos({ q: qDeb || undefined, pageSize: 20 }),
    enabled: buscar,
  })

  const agregar = useMutation({
    mutationFn: () => {
      if (!seleccion) throw new Error("Selecciona un producto")
      return agregarItem(comandaId, {
        varianteId: seleccion.variante.id,
        cantidad: Number(cantidad) || 1,
        precioUnitario: precioVariante(seleccion.variante),
        productoNombre: seleccion.productoNombre,
        notas: notas.trim() || undefined,
        estacion,
        modificadores: mods.length ? mods : undefined,
      })
    },
    onSuccess: () => {
      invalidar()
      setSeleccion(null)
      setCantidad("1")
      setNotas("")
      setMods([])
      setQ("")
      setBuscar(false)
    },
  })

  const quitar = useMutation({
    mutationFn: (itemId: string) => eliminarItem(itemId),
    onSuccess: invalidar,
  })

  const enviar = useMutation({
    mutationFn: () => enviarCocina(comandaId),
    onSuccess: invalidar,
  })

  const cancelar = useMutation({
    mutationFn: () => cancelarComanda(comandaId),
    onSuccess: () => {
      invalidar()
      router.push("/restaurante")
    },
  })

  // ---- Cobro ----
  const [cobro, setCobro] = React.useState(false)
  const c = comanda.data
  const ctx = useQuery({
    queryKey: ["ventas-contexto", c?.sucursalId],
    queryFn: () => contextoPos(c!.sucursalId),
    enabled: cobro && Boolean(c?.sucursalId),
  })
  const sesion = useQuery({
    queryKey: ["sesion-abierta", c?.sucursalId],
    queryFn: () => sesionAbierta(c!.sucursalId),
    enabled: cobro && Boolean(c?.sucursalId),
  })

  const [empresaId, setEmpresaId] = React.useState("")
  const [serieId, setSerieId] = React.useState("")
  const [metodo, setMetodo] = React.useState<MetodoPago>("EFECTIVO")
  const [monto, setMonto] = React.useState("")
  const [propina, setPropina] = React.useState("")

  // Prellenar empresa/serie desde el contexto POS cuando llega.
  React.useEffect(() => {
    if (ctx.data) {
      setEmpresaId((prev) => prev || ctx.data.empresaId)
      setSerieId((prev) => prev || ctx.data.series[0]?.id || "")
    }
  }, [ctx.data])

  React.useEffect(() => {
    if (cobro && c && !monto) setMonto(money(c.total))
  }, [cobro, c, monto])

  const cobrar = useMutation({
    mutationFn: () =>
      cobrarComanda(comandaId, {
        empresaId: empresaId.trim(),
        serieId: serieId.trim(),
        sesionCajaId: sesion.data?.id,
        propina: propina ? Number(propina) : undefined,
        pagos: [{ method: metodo, monto: Number(monto) || 0 }],
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["restaurante-mapa"] })
      router.push("/restaurante")
    },
  })

  if (comanda.isLoading) {
    return (
      <>
        <PageHeader title="Comanda" />
        <div className="flex-1 overflow-auto p-6">
          <Skeleton className="h-40 w-full max-w-3xl rounded-2xl" />
        </div>
      </>
    )
  }

  if (comanda.isError || !c) {
    return (
      <>
        <PageHeader title="Comanda" />
        <div className="flex-1 overflow-auto p-6">
          <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            No se pudo cargar la comanda:{" "}
            {(comanda.error as Error)?.message ?? "no encontrada"}
          </div>
        </div>
      </>
    )
  }

  const titulo =
    c.tipo === "MESA"
      ? c.mesa?.nombre ?? "Mesa"
      : c.tipo === "LLEVAR"
        ? "Para llevar"
        : "Delivery"

  const editable = c.estado !== "COBRADA" && c.estado !== "CANCELADA"

  return (
    <>
      <PageHeader
        title={titulo}
        description={`Comanda ${c.tipo}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{c.estado}</Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/restaurante")}
            >
              <RiArrowLeftLine />
              Salón
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto grid w-full max-w-5xl gap-4 lg:grid-cols-[1fr_320px]">
          {/* Items */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Items</h2>
              {editable ? (
                <Button size="sm" onClick={() => setBuscar((v) => !v)}>
                  <RiAddLine />
                  Agregar producto
                </Button>
              ) : null}
            </div>

            {/* Buscador de productos */}
            {buscar && editable ? (
              <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
                {!seleccion ? (
                  <>
                    <div className="relative">
                      <RiSearchLine className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Buscar producto…"
                        className="h-10 pl-9"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-64 overflow-auto">
                      {productos.isLoading ? (
                        <p className="p-2 text-sm text-muted-foreground">
                          Buscando…
                        </p>
                      ) : (productos.data?.items.length ?? 0) === 0 ? (
                        <p className="p-2 text-sm text-muted-foreground">
                          Sin resultados
                        </p>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {productos.data?.items.map((p) =>
                            p.variants.map((v) => (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() =>
                                  setSeleccion({
                                    variante: v,
                                    productoNombre:
                                      p.variants.length > 1
                                        ? `${p.nombre} — ${v.nombre}`
                                        : p.nombre,
                                  })
                                }
                                className="flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-muted/50"
                              >
                                <span className="min-w-0 truncate">
                                  {p.nombre}
                                  {p.variants.length > 1 ? (
                                    <span className="text-muted-foreground">
                                      {" "}
                                      · {v.nombre}
                                    </span>
                                  ) : null}
                                </span>
                                <span className="tabular-nums text-muted-foreground">
                                  S/ {money(precioVariante(v))}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {seleccion.productoNombre}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSeleccion(null)}
                        className="text-xs text-muted-foreground hover:underline"
                      >
                        Cambiar
                      </button>
                    </div>
                    <div className="flex flex-wrap items-end gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted-foreground">
                          Cantidad
                        </label>
                        <Input
                          className="w-24"
                          type="number"
                          value={cantidad}
                          onChange={(e) => setCantidad(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted-foreground">
                          Estación
                        </label>
                        <Select
                          className="w-36"
                          value={estacion}
                          onChange={(v) => setEstacion(v as EstacionCocina)}
                          options={ESTACIONES}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-muted-foreground">
                        Notas
                      </label>
                      <Input
                        value={notas}
                        onChange={(e) => setNotas(e.target.value)}
                        placeholder="Sin cebolla, término medio…"
                      />
                    </div>

                    {/* Modificadores libres */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-muted-foreground">
                        Modificadores
                      </label>
                      {mods.length ? (
                        <div className="flex flex-wrap gap-1">
                          {mods.map((m, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs"
                            >
                              {m.nombre}
                              {m.precioExtra ? ` +${money(m.precioExtra)}` : ""}
                              <button
                                type="button"
                                onClick={() =>
                                  setMods(mods.filter((_, j) => j !== i))
                                }
                              >
                                <RiCloseLine className="size-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : null}
                      <div className="flex items-end gap-2">
                        <Input
                          className="flex-1"
                          value={modNombre}
                          onChange={(e) => setModNombre(e.target.value)}
                          placeholder="Extra queso"
                        />
                        <Input
                          className="w-24"
                          type="number"
                          value={modPrecio}
                          onChange={(e) => setModPrecio(e.target.value)}
                          placeholder="0.00"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!modNombre.trim()}
                          onClick={() => {
                            setMods([
                              ...mods,
                              {
                                nombre: modNombre.trim(),
                                precioExtra: modPrecio
                                  ? Number(modPrecio)
                                  : undefined,
                              },
                            ])
                            setModNombre("")
                            setModPrecio("")
                          }}
                        >
                          Añadir
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={agregar.isPending}
                        onClick={() => agregar.mutate()}
                      >
                        Agregar a la comanda
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setBuscar(false)}
                      >
                        Cerrar
                      </Button>
                    </div>
                    {agregar.isError ? (
                      <span className="text-xs text-destructive">
                        {(agregar.error as Error).message}
                      </span>
                    ) : null}
                  </div>
                )}
              </div>
            ) : null}

            {/* Lista de items */}
            {c.items.length === 0 ? (
              <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                Sin items todavía.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {c.items.map((it) => (
                  <div
                    key={it.id}
                    className="flex items-start gap-3 rounded-2xl border bg-card p-3"
                  >
                    <span className="mt-0.5 min-w-8 text-center font-semibold tabular-nums">
                      {Number(it.cantidad)}×
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">
                          {it.productoNombre}
                        </span>
                        <Badge variant="outline">{it.estadoCocina}</Badge>
                      </div>
                      {it.modificadores?.length ? (
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {it.modificadores
                            .map(
                              (m) =>
                                m.nombre +
                                (m.precioExtra
                                  ? ` (+${money(m.precioExtra)})`
                                  : "")
                            )
                            .join(", ")}
                        </div>
                      ) : null}
                      {it.notas ? (
                        <div className="mt-0.5 text-xs italic text-muted-foreground">
                          {it.notas}
                        </div>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="tabular-nums font-medium">
                        S/ {money(Number(it.precioUnitario) * Number(it.cantidad))}
                      </div>
                      {editable && it.estadoCocina === "PENDIENTE" ? (
                        <button
                          type="button"
                          onClick={() => quitar.mutate(it.id)}
                          disabled={quitar.isPending}
                          className="mt-1 inline-flex items-center gap-1 text-xs text-destructive hover:underline"
                        >
                          <RiDeleteBinLine className="size-3.5" />
                          Quitar
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Panel lateral */}
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl border bg-card p-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span className="tabular-nums">S/ {money(c.subtotal)}</span>
              </div>
              {c.propina ? (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Propina</span>
                  <span className="tabular-nums">S/ {money(c.propina)}</span>
                </div>
              ) : null}
              <div className="mt-2 flex items-center justify-between border-t pt-2 text-lg font-semibold">
                <span>Total</span>
                <span className="tabular-nums">S/ {money(c.total)}</span>
              </div>
            </div>

            {editable ? (
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  disabled={enviar.isPending || c.items.length === 0}
                  onClick={() => enviar.mutate()}
                >
                  <RiSendPlaneLine />
                  Enviar a cocina
                </Button>
                <Button
                  disabled={c.items.length === 0}
                  onClick={() => setCobro((v) => !v)}
                >
                  Cobrar
                </Button>
                <Button
                  variant="destructive"
                  disabled={cancelar.isPending}
                  onClick={() => cancelar.mutate()}
                >
                  Cancelar comanda
                </Button>
              </div>
            ) : null}

            {/* Panel de cobro */}
            {cobro && editable ? (
              <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
                <h3 className="text-sm font-semibold">Cobrar</h3>
                {!ctx.data && ctx.isError ? (
                  <p className="text-xs text-muted-foreground">
                    No se pudo cargar el contexto fiscal. Ingresa empresa y serie
                    manualmente (TODO: integrar selección de comprobante).
                  </p>
                ) : null}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">
                    Empresa (ID)
                  </label>
                  <Input
                    value={empresaId}
                    onChange={(e) => setEmpresaId(e.target.value)}
                    placeholder="empresaId"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">Serie</label>
                  {ctx.data && ctx.data.series.length ? (
                    <Select
                      value={serieId}
                      onChange={setSerieId}
                      placeholder="Serie"
                      options={ctx.data.series.map((s) => ({
                        value: s.id,
                        label: `${s.series} · ${s.documentType}`,
                      }))}
                    />
                  ) : (
                    <Input
                      value={serieId}
                      onChange={(e) => setSerieId(e.target.value)}
                      placeholder="serieId"
                    />
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {sesion.data
                    ? `Caja: ${sesion.data.cashRegister.nombre}`
                    : "Sin sesión de caja abierta"}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">
                    Método de pago
                  </label>
                  <Select
                    value={metodo}
                    onChange={(v) => setMetodo(v as MetodoPago)}
                    options={METODOS}
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex flex-1 flex-col gap-1">
                    <label className="text-xs text-muted-foreground">Monto</label>
                    <Input
                      type="number"
                      value={monto}
                      onChange={(e) => setMonto(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <label className="text-xs text-muted-foreground">
                      Propina
                    </label>
                    <Input
                      type="number"
                      value={propina}
                      onChange={(e) => setPropina(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <Button
                  className={cn(cobrar.isPending && "opacity-70")}
                  disabled={
                    cobrar.isPending || !empresaId.trim() || !serieId.trim()
                  }
                  onClick={() => cobrar.mutate()}
                >
                  Confirmar cobro
                </Button>
                {cobrar.isError ? (
                  <span className="text-xs text-destructive">
                    {(cobrar.error as Error).message}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  )
}
