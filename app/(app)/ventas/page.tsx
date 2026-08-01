"use client"

import * as React from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  RiAddLine,
  RiBankCardLine,
  RiCheckLine,
  RiDeleteBinLine,
  RiErrorWarningLine,
  RiExchangeLine,
  RiInformationLine,
  RiMoneyDollarCircleLine,
  RiSearchLine,
  RiShoppingCart2Line,
  RiSmartphoneLine,
  RiStore2Line,
  RiSubtractLine,
} from "@remixicon/react"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ApiError } from "@/lib/api/client"
import { listarProductos, type VarianteProducto } from "@/lib/api/catalogo"
import { sesionAbierta } from "@/lib/api/caja"
import {
  contextoPos,
  crearVenta,
  type MetodoPago,
  type SerieComprobante,
  type VentaCreada,
} from "@/lib/api/ventas"
import { useSucursalActiva } from "@/hooks/use-sucursal-activa"

const sol = (v: string | number) =>
  `S/ ${Number(v).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

function errMsg(e: unknown) {
  return (e as ApiError | Error | null)?.message ?? null
}

/** Precio aplicable a una cantidad: el de mayor minQuantity que no la supere. */
function precioDe(v: VarianteProducto, qty: number): number | null {
  const precios = (v.prices ?? [])
    .map((p) => ({ monto: Number(p.monto), min: Number(p.minQuantity) || 0 }))
    .sort((a, b) => a.min - b.min)
  if (precios.length === 0) return null
  const aplicables = precios.filter((p) => p.min <= qty)
  const elegido = aplicables.length
    ? aplicables[aplicables.length - 1]
    : precios[0]
  return elegido.monto
}

function stockDe(v: VarianteProducto): number {
  return (v.saldosInventario ?? []).reduce(
    (acc, s) => acc + (Number(s.available) || 0),
    0
  )
}

type LineaCarrito = {
  varianteId: string
  producto: string
  variante: string
  sku: string
  precio: number
  cantidad: number
}

const METODOS: {
  value: MetodoPago
  label: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { value: "EFECTIVO", label: "Efectivo", icon: RiMoneyDollarCircleLine },
  { value: "TARJETA", label: "Tarjeta", icon: RiBankCardLine },
  { value: "BILLETERA_DIGITAL", label: "Yape/Plin", icon: RiSmartphoneLine },
  { value: "TRANSFERENCIA_BANCARIA", label: "Transf.", icon: RiExchangeLine },
]

/* ------------------------------------------------------------------ */
/* Página                                                             */
/* ------------------------------------------------------------------ */

export default function VentasPage() {
  const { sucursalId, sucursal } = useSucursalActiva()

  const ctx = useQuery({
    queryKey: ["pos-contexto", sucursalId],
    queryFn: () => contextoPos(sucursalId!),
    enabled: !!sucursalId,
  })
  const caja = useQuery({
    queryKey: ["sesion-abierta", sucursalId],
    queryFn: () => sesionAbierta(sucursalId!),
    enabled: !!sucursalId,
  })

  const [carrito, setCarrito] = React.useState<LineaCarrito[]>([])
  const [serieId, setSerieId] = React.useState("")
  const [ticket, setTicket] = React.useState<VentaCreada | null>(null)
  const [vueltoTicket, setVueltoTicket] = React.useState(0)
  const idemRef = React.useRef<string | null>(null)

  const series = ctx.data?.series ?? []
  const serieEfectiva =
    serieId ||
    series.find((s) => s.documentType === "BOLETA")?.id ||
    series[0]?.id ||
    ""

  const agregar = (v: VarianteProducto, producto: string) => {
    const precio = precioDe(v, 1)
    if (precio == null) return
    setCarrito((prev) => {
      const i = prev.findIndex((l) => l.varianteId === v.id)
      if (i >= 0) {
        const next = [...prev]
        next[i] = { ...next[i], cantidad: next[i].cantidad + 1 }
        return next
      }
      return [
        ...prev,
        {
          varianteId: v.id,
          producto,
          variante: v.nombre,
          sku: v.sku,
          precio,
          cantidad: 1,
        },
      ]
    })
  }
  const setCantidad = (id: string, delta: number) =>
    setCarrito((prev) =>
      prev
        .map((l) =>
          l.varianteId === id
            ? { ...l, cantidad: Math.max(0, l.cantidad + delta) }
            : l
        )
        .filter((l) => l.cantidad > 0)
    )
  const quitar = (id: string) =>
    setCarrito((prev) => prev.filter((l) => l.varianteId !== id))

  const nuevaVenta = () => {
    setCarrito([])
    setTicket(null)
    idemRef.current = null
  }

  return (
    <>
      <PageHeader
        title="Punto de venta"
        description={sucursal ? `Vendiendo · ${sucursal.nombre}` : "Nueva venta"}
      />

      <div className="flex-1 overflow-hidden">
        {!sucursalId ? (
          <div className="p-6">
            <Aviso
              icon={RiStore2Line}
              titulo="Elige una sucursal"
              texto="Selecciona la sucursal activa en la barra lateral para vender."
            />
          </div>
        ) : (
          <div className="grid h-full gap-0 lg:grid-cols-[1fr_380px]">
            {/* Panel izquierdo: catálogo + carrito */}
            <div className="flex min-h-0 flex-col gap-4 overflow-auto p-5 md:p-6">
              {ctx.data && !ctx.data.tienePrecios ? (
                <Banner texto="No hay lista de precios configurada para esta empresa. Los productos no tendrán precio de venta." />
              ) : null}
              {ctx.data && series.length === 0 ? (
                <Banner texto="No hay serie de comprobante activa. Configúrala para poder cobrar." />
              ) : null}

              <BuscadorProductos onAgregar={agregar} />

              <Carrito
                lineas={carrito}
                onMas={(id) => setCantidad(id, 1)}
                onMenos={(id) => setCantidad(id, -1)}
                onQuitar={quitar}
              />
            </div>

            {/* Panel derecho: cobro (Pro oscuro) */}
            <PanelCobro
              carrito={carrito}
              ctx={ctx.data}
              sesionCajaId={caja.data?.id ?? null}
              cargando={ctx.isLoading}
              series={series}
              serieId={serieEfectiva}
              onSerie={setSerieId}
              sucursalId={sucursalId}
              idemRef={idemRef}
              onVenta={(v, vuelto) => {
                setTicket(v)
                setVueltoTicket(vuelto)
              }}
            />
          </div>
        )}
      </div>

      {/* Ticket de éxito */}
      <Sheet
        open={ticket != null}
        onOpenChange={(o) => {
          if (!o) nuevaVenta()
        }}
      >
        <SheetContent className="w-full gap-0 p-0 sm:!max-w-sm">
          <SheetHeader className="border-b">
            <SheetTitle>Venta registrada</SheetTitle>
          </SheetHeader>
          {ticket ? (
            <TicketVenta
              venta={ticket}
              vuelto={vueltoTicket}
              onNueva={nuevaVenta}
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Buscador de productos                                              */
/* ------------------------------------------------------------------ */

function BuscadorProductos({
  onAgregar,
}: {
  onAgregar: (v: VarianteProducto, producto: string) => void
}) {
  const [q, setQ] = React.useState("")
  const [debounced, setDebounced] = React.useState("")
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 250)
    return () => clearTimeout(t)
  }, [q])

  const busqueda = useQuery({
    queryKey: ["pos-buscar", debounced],
    queryFn: () => listarProductos({ q: debounced, pageSize: 12 }),
    enabled: debounced.length >= 2,
  })

  const items = React.useMemo(() => {
    const prods = busqueda.data?.items ?? []
    return prods.flatMap((p) =>
      (p.variants ?? []).map((v) => ({ producto: p.nombre, variante: v }))
    )
  }, [busqueda.data])

  return (
    <div>
      <div className="relative">
        <RiSearchLine className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar producto por nombre, código o barras…"
          className="h-14 rounded-2xl pl-12 text-base shadow-sm"
          autoFocus
        />
      </div>

      {debounced.length >= 2 ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {busqueda.isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))
          ) : items.length === 0 ? (
            <p className="col-span-full py-6 text-center text-sm text-muted-foreground">
              Sin resultados para “{debounced}”.
            </p>
          ) : (
            items.map(({ producto, variante }) => {
              const precio = precioDe(variante, 1)
              const stock = stockDe(variante)
              return (
                <button
                  key={variante.id}
                  type="button"
                  onClick={() => onAgregar(variante, producto)}
                  disabled={precio == null}
                  className="group flex flex-col rounded-2xl border bg-card p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md disabled:opacity-50"
                >
                  <span className="line-clamp-2 text-sm font-medium">
                    {producto}
                    {variante.nombre && variante.nombre !== producto
                      ? ` · ${variante.nombre}`
                      : ""}
                  </span>
                  <span className="mt-1 font-mono text-xs text-muted-foreground">
                    {variante.sku} · stock {stock}
                  </span>
                  <span className="mt-2 flex items-center justify-between">
                    <span className="text-base font-semibold tabular-nums">
                      {precio == null ? "Sin precio" : sol(precio)}
                    </span>
                    <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <RiAddLine className="size-4" />
                    </span>
                  </span>
                </button>
              )
            })
          )}
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          Escribe al menos 2 caracteres para buscar.
        </p>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Carrito                                                            */
/* ------------------------------------------------------------------ */

function Carrito({
  lineas,
  onMas,
  onMenos,
  onQuitar,
}: {
  lineas: LineaCarrito[]
  onMas: (id: string) => void
  onMenos: (id: string) => void
  onQuitar: (id: string) => void
}) {
  if (lineas.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <RiShoppingCart2Line className="size-6" />
        </span>
        <div>
          <p className="text-sm font-medium">Carrito vacío</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Busca productos arriba y agrégalos a la venta.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {lineas.map((l) => (
        <div
          key={l.varianteId}
          className="flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-sm"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {l.producto}
              {l.variante && l.variante !== l.producto ? ` · ${l.variante}` : ""}
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              {sol(l.precio)} c/u
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-xl border p-1">
            <button
              type="button"
              onClick={() => onMenos(l.varianteId)}
              className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <RiSubtractLine className="size-4" />
            </button>
            <span className="w-8 text-center text-sm font-semibold tabular-nums">
              {l.cantidad}
            </span>
            <button
              type="button"
              onClick={() => onMas(l.varianteId)}
              className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <RiAddLine className="size-4" />
            </button>
          </div>

          <span className="w-24 text-right text-sm font-semibold tabular-nums">
            {sol(l.precio * l.cantidad)}
          </span>

          <button
            type="button"
            onClick={() => onQuitar(l.varianteId)}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <RiDeleteBinLine className="size-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Panel de cobro (Pro oscuro)                                        */
/* ------------------------------------------------------------------ */

function PanelCobro({
  carrito,
  ctx,
  sesionCajaId,
  cargando,
  series,
  serieId,
  onSerie,
  sucursalId,
  idemRef,
  onVenta,
}: {
  carrito: LineaCarrito[]
  ctx: { empresaId: string; moneda: string; tienePrecios: boolean } | undefined
  sesionCajaId: string | null
  cargando: boolean
  series: SerieComprobante[]
  serieId: string
  onSerie: (id: string) => void
  sucursalId: string
  idemRef: React.RefObject<string | null>
  onVenta: (v: VentaCreada, vuelto: number) => void
}) {
  const [metodo, setMetodo] = React.useState<MetodoPago>("EFECTIVO")
  const [recibido, setRecibido] = React.useState("")

  const total = carrito.reduce((acc, l) => acc + l.precio * l.cantidad, 0)
  const items = carrito.reduce((acc, l) => acc + l.cantidad, 0)
  const esEfectivo = metodo === "EFECTIVO"
  const recibidoNum = Number(recibido) || 0
  const vuelto = esEfectivo ? Math.max(0, recibidoNum - total) : 0

  const m = useMutation({
    mutationFn: () => {
      if (!idemRef.current) idemRef.current = crypto.randomUUID()
      return crearVenta({
        empresaId: ctx!.empresaId,
        sucursalId,
        serieId,
        sesionCajaId: esEfectivo ? (sesionCajaId ?? undefined) : undefined,
        moneda: ctx!.moneda,
        idempotencyKey: idemRef.current,
        items: carrito.map((l) => ({
          varianteId: l.varianteId,
          cantidad: l.cantidad,
        })),
        pagos: [{ method: metodo, monto: total }],
      })
    },
    onSuccess: (v) => {
      onVenta(v, vuelto)
      setRecibido("")
    },
  })
  const err = errMsg(m.error)

  const faltaCaja = esEfectivo && !sesionCajaId
  const faltaEfectivo = esEfectivo && recibido !== "" && recibidoNum < total
  const bloqueado =
    carrito.length === 0 ||
    !serieId ||
    !ctx?.tienePrecios ||
    faltaCaja ||
    (esEfectivo && recibidoNum < total) ||
    m.isPending

  return (
    <aside className="relative flex min-h-0 flex-col overflow-hidden border-l bg-gradient-to-b from-zinc-900 to-zinc-950 text-white">
      <div className="pointer-events-none absolute -right-24 top-10 size-64 rounded-full bg-primary/20 blur-3xl" />

      <div className="relative flex min-h-0 flex-1 flex-col overflow-auto p-6">
        {/* Total */}
        <div>
          <p className="text-sm text-white/50">Total a cobrar</p>
          <p className="text-5xl font-semibold tracking-tight tabular-nums">
            {sol(total)}
          </p>
          <p className="mt-1 text-xs text-white/40">
            {items} artículo{items === 1 ? "" : "s"} · IGV incluido
          </p>
        </div>

        {/* Serie */}
        {series.length > 1 ? (
          <div className="mt-6">
            <p className="mb-2 text-xs text-white/50">Comprobante</p>
            <div className="flex flex-wrap gap-1.5">
              {series.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSerie(s.id)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ring-1 transition-colors ${
                    s.id === serieId
                      ? "bg-white/15 text-white ring-white/25"
                      : "text-white/60 ring-white/10 hover:bg-white/10"
                  }`}
                >
                  {s.documentType} {s.series}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* Método de pago */}
        <div className="mt-6">
          <p className="mb-2 text-xs text-white/50">Método de pago</p>
          <div className="grid grid-cols-2 gap-2">
            {METODOS.map((mt) => {
              const on = metodo === mt.value
              const Icon = mt.icon
              return (
                <button
                  key={mt.value}
                  type="button"
                  onClick={() => setMetodo(mt.value)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium ring-1 transition-all ${
                    on
                      ? "bg-white text-zinc-900 ring-white"
                      : "text-white/70 ring-white/10 hover:bg-white/10"
                  }`}
                >
                  <Icon className="size-4" />
                  {mt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Efectivo recibido / vuelto */}
        {esEfectivo ? (
          <div className="mt-6">
            <p className="mb-2 text-xs text-white/50">Efectivo recibido</p>
            <input
              inputMode="decimal"
              value={recibido}
              onChange={(e) =>
                setRecibido(e.target.value.replace(/[^0-9.]/g, ""))
              }
              placeholder="0.00"
              className="h-12 w-full rounded-xl border border-white/15 bg-white/5 px-4 text-xl tabular-nums text-white outline-none placeholder:text-white/30 focus:border-white/40"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[total, 20, 50, 100, 200].map((v, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRecibido(v.toFixed(2))}
                  className="rounded-lg bg-white/10 px-2.5 py-1 text-xs text-white/70 transition-colors hover:bg-white/20"
                >
                  {i === 0 ? "Exacto" : sol(v)}
                </button>
              ))}
            </div>
            {recibido !== "" ? (
              <div className="mt-3 flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                <span className="text-sm text-white/60">Vuelto</span>
                <span className="text-lg font-semibold tabular-nums">
                  {sol(vuelto)}
                </span>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Avisos */}
        {faltaCaja ? (
          <p className="mt-4 flex items-center gap-1.5 rounded-xl bg-amber-500/15 px-3 py-2 text-xs text-amber-300">
            <RiInformationLine className="size-4 shrink-0" />
            Abre una caja para cobrar en efectivo.
          </p>
        ) : null}
        {faltaEfectivo ? (
          <p className="mt-4 flex items-center gap-1.5 rounded-xl bg-amber-500/15 px-3 py-2 text-xs text-amber-300">
            <RiInformationLine className="size-4 shrink-0" />
            El efectivo recibido no cubre el total.
          </p>
        ) : null}
        {err ? (
          <p className="mt-4 flex items-center gap-1.5 rounded-xl bg-destructive/20 px-3 py-2 text-xs text-red-300">
            <RiErrorWarningLine className="size-4 shrink-0" />
            {err}
          </p>
        ) : null}
      </div>

      {/* Cobrar */}
      <div className="relative border-t border-white/10 p-4">
        <button
          type="button"
          disabled={bloqueado || cargando}
          onClick={() => m.mutate()}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40 disabled:shadow-none"
        >
          <RiCheckLine className="size-5" />
          {m.isPending ? "Cobrando…" : `Cobrar ${sol(total)}`}
        </button>
      </div>
    </aside>
  )
}

/* ------------------------------------------------------------------ */
/* Ticket                                                             */
/* ------------------------------------------------------------------ */

function TicketVenta({
  venta,
  vuelto,
  onNueva,
}: {
  venta: VentaCreada
  vuelto: number
  onNueva: () => void
}) {
  return (
    <div className="flex flex-1 flex-col gap-5 overflow-auto p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          <RiCheckLine className="size-7" />
        </span>
        <div>
          <p className="text-base font-semibold">¡Venta cobrada!</p>
          <p className="font-mono text-sm text-muted-foreground">
            {venta.number}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border">
        <Fila label="Subtotal" valor={sol(venta.subtotal)} />
        <Fila label="Total" valor={sol(venta.total)} fuerte />
        <Fila label="Pagado" valor={sol(venta.totalPagado)} />
        {vuelto > 0 ? <Fila label="Vuelto" valor={sol(vuelto)} fuerte /> : null}
      </div>

      <Button type="button" size="lg" className="w-full" onClick={onNueva}>
        <RiAddLine />
        Nueva venta
      </Button>
    </div>
  )
}

function Fila({
  label,
  valor,
  fuerte,
}: {
  label: string
  valor: string
  fuerte?: boolean
}) {
  return (
    <div className="flex items-center justify-between border-b px-4 py-2.5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`tabular-nums ${fuerte ? "font-bold" : "font-medium"}`}>
        {valor}
      </span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Auxiliares                                                         */
/* ------------------------------------------------------------------ */

function Banner({ texto }: { texto: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
      <RiInformationLine className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <p className="text-muted-foreground">{texto}</p>
    </div>
  )
}

function Aviso({
  icon: Icon,
  titulo,
  texto,
}: {
  icon: React.ComponentType<{ className?: string }>
  titulo: string
  texto: string
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-card px-6 py-14 text-center">
      <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-sm font-medium">{titulo}</p>
        <p className="mt-1 text-sm text-muted-foreground">{texto}</p>
      </div>
    </div>
  )
}
