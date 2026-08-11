"use client"

import * as React from "react"
import { toast } from "sonner"
import { useReactToPrint } from "react-to-print"
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
  RiPrinterLine,
  RiSearchLine,
  RiShoppingCart2Line,
  RiSmartphoneLine,
  RiStore2Line,
  RiSubtractLine,
} from "@remixicon/react"

import { PageHeader } from "@/components/layout/page-header"
import { ContextualTour } from "@/components/onboarding/contextual-tour"
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
import { promocionesAplicables } from "@/lib/api/promociones"
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
  /** Tributos de monto fijo por unidad (ICBPER), sumados aparte del precio. */
  otrosTributos: number
  cantidad: number
}

type TicketSnap = {
  items: { nombre: string; cantidad: number; precio: number }[]
  metodo: string
  fecha: string
  sucursalNombre: string
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
  const [ticketSnap, setTicketSnap] = React.useState<TicketSnap | null>(null)
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
    // Tributos de monto fijo por unidad (ej. ICBPER): se suman aparte del precio.
    const otrosTributos = (v.taxes ?? [])
      .filter((t) => t.tax.tipoCalculo === "MONTO_FIJO")
      .reduce((acc, t) => acc + Number(t.tax.rate), 0)
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
          otrosTributos,
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
    setTicketSnap(null)
    idemRef.current = null
  }

  return (
    <>
      <ContextualTour
        flowKey="primera-venta"
        stepKey="vender"
        pasos={[
          {
            selector: "#buscador-productos",
            titulo: "Busca tu producto",
            descripcion: "Toca un resultado para agregarlo al carrito.",
          },
          {
            selector: "#panel-cobro",
            titulo: "Panel de cobro",
            descripcion: "Elige comprobante y método de pago.",
          },
          {
            selector: "#btn-cobrar",
            titulo: "Cobra aquí",
            descripcion: "Confirma el pago y la venta queda registrada.",
          },
        ]}
      />
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
          <div id="panel-venta" className="grid h-full gap-0 lg:grid-cols-[1fr_380px]">
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

            {/* Panel derecho: cobro */}
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
              onVenta={(v, vuelto, snap) => {
                setTicket(v)
                setVueltoTicket(vuelto)
                setTicketSnap({
                  ...snap,
                  sucursalNombre: sucursal?.nombre ?? "",
                })
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
              snap={ticketSnap}
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
      (p.variants ?? []).map((v) => ({
        producto: p.nombre,
        kind: p.kind,
        variante: v,
      }))
    )
  }, [busqueda.data])

  return (
    <div id="buscador-productos">
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
            items.map(({ producto, kind, variante }) => {
              const precio = precioDe(variante, 1)
              const stock = stockDe(variante)
              const esServicio = kind === "SERVICIO"
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
                    {variante.sku}
                    {esServicio ? " · servicio" : ` · stock ${stock}`}
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
  onVenta: (
    v: VentaCreada,
    vuelto: number,
    snap: Omit<TicketSnap, "sucursalNombre">,
  ) => void
}) {
  const [metodo, setMetodo] = React.useState<MetodoPago>("EFECTIVO")
  const [recibido, setRecibido] = React.useState("")

  const [aplicarPromos, setAplicarPromos] = React.useState(true)

  const bruto = carrito.reduce((acc, l) => acc + l.precio * l.cantidad, 0)
  const otrosTributos = carrito.reduce(
    (acc, l) => acc + (l.otrosTributos ?? 0) * l.cantidad,
    0,
  )
  const items = carrito.reduce((acc, l) => acc + l.cantidad, 0)

  // Promociones detectadas por el backend para este carrito (vista previa).
  const promoItems = carrito.map((l) => ({
    varianteId: l.varianteId,
    cantidad: l.cantidad,
  }))
  const promos = useQuery({
    queryKey: ["promos-aplicables", sucursalId, JSON.stringify(promoItems)],
    queryFn: () => promocionesAplicables({ sucursalId, items: promoItems }),
    enabled: carrito.length > 0,
  })
  const descuento =
    aplicarPromos ? Number(promos.data?.totalDescuento ?? 0) : 0
  const promocionIds = aplicarPromos ? (promos.data?.promocionIds ?? []) : []
  const hayPromo = Number(promos.data?.totalDescuento ?? 0) > 0

  const total = Math.max(0, bruto - descuento) + otrosTributos
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
        sesionCajaId: sesionCajaId ?? undefined,
        moneda: ctx!.moneda,
        idempotencyKey: idemRef.current,
        items: carrito.map((l) => ({
          varianteId: l.varianteId,
          cantidad: l.cantidad,
        })),
        promocionIds: promocionIds.length ? promocionIds : undefined,
        pagos: [{ method: metodo, monto: total }],
      })
    },
    onSuccess: (v) => {
      toast.success(`Venta ${v.number} cobrada`, {
        description: `Total ${sol(v.total)}`,
      })
      onVenta(v, vuelto, {
        items: carrito.map((l) => ({
          nombre: l.producto,
          cantidad: l.cantidad,
          precio: l.precio,
        })),
        metodo,
        fecha: new Date().toISOString(),
      })
      setRecibido("")
    },
    onError: (e) => {
      toast.error("No se pudo cobrar", { description: errMsg(e) ?? undefined })
    },
  })
  const err = errMsg(m.error)

  // Toda venta exige una caja abierta (no solo las de efectivo).
  const faltaCaja = !sesionCajaId
  const faltaEfectivo = esEfectivo && recibido !== "" && recibidoNum < total
  const bloqueado =
    carrito.length === 0 ||
    !serieId ||
    !ctx?.tienePrecios ||
    faltaCaja ||
    (esEfectivo && recibidoNum < total) ||
    m.isPending

  return (
    <aside
      id="panel-cobro"
      className="flex min-h-0 flex-col overflow-hidden border-l bg-muted/30"
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-auto p-6">
        {/* Total */}
        <div>
          <p className="text-sm text-muted-foreground">Total a cobrar</p>
          <p className="text-5xl font-semibold tracking-tight tabular-nums">
            {sol(total)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {items} artículo{items === 1 ? "" : "s"} · IGV incluido
          </p>
        </div>

        {/* Promoción detectada: el cajero confirma o decide no aplicarla. */}
        {hayPromo ? (
          <button
            type="button"
            onClick={() => setAplicarPromos((v) => !v)}
            className={`mt-4 flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition ${
              aplicarPromos
                ? "border-emerald-500/40 bg-emerald-500/10"
                : "border-border bg-card"
            }`}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {aplicarPromos ? "Descuento aplicado" : "Descuento disponible"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {aplicarPromos
                  ? `Ahorro ${sol(descuento)} · antes ${sol(bruto)}`
                  : `Toca para aplicar ${sol(Number(promos.data?.totalDescuento ?? 0))}`}
              </p>
            </div>
            <span
              className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition ${
                aplicarPromos ? "bg-emerald-500" : "bg-muted-foreground/30"
              }`}
            >
              <span
                className={`size-5 rounded-full bg-white shadow transition ${
                  aplicarPromos ? "translate-x-5" : ""
                }`}
              />
            </span>
          </button>
        ) : null}

        {/* Serie */}
        {series.length > 1 ? (
          <div className="mt-6">
            <p className="mb-2 text-xs text-muted-foreground">Comprobante</p>
            <div className="flex flex-wrap gap-1.5">
              {series.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSerie(s.id)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ring-1 transition-colors ${
                    s.id === serieId
                      ? "bg-primary/10 text-primary ring-primary/30"
                      : "text-muted-foreground ring-border hover:bg-muted"
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
          <p className="mb-2 text-xs text-muted-foreground">Método de pago</p>
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
                      ? "bg-primary text-primary-foreground ring-primary"
                      : "bg-card text-muted-foreground ring-border hover:bg-muted"
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
            <p className="mb-2 text-xs text-muted-foreground">
              Efectivo recibido
            </p>
            <input
              inputMode="decimal"
              value={recibido}
              onChange={(e) =>
                setRecibido(e.target.value.replace(/[^0-9.]/g, ""))
              }
              placeholder="0.00"
              className="h-12 w-full rounded-xl border bg-card px-4 text-xl tabular-nums outline-none placeholder:text-muted-foreground/50 focus:border-primary"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[total, 20, 50, 100, 200].map((v, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRecibido(v.toFixed(2))}
                  className="rounded-lg bg-muted px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/70"
                >
                  {i === 0 ? "Exacto" : sol(v)}
                </button>
              ))}
            </div>
            {recibido !== "" ? (
              <div className="mt-3 flex items-center justify-between rounded-xl border bg-card px-4 py-3">
                <span className="text-sm text-muted-foreground">Vuelto</span>
                <span className="text-lg font-semibold tabular-nums">
                  {sol(vuelto)}
                </span>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Avisos */}
        {faltaCaja ? (
          <p className="mt-4 flex items-center gap-1.5 rounded-xl bg-amber-500/15 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
            <RiInformationLine className="size-4 shrink-0" />
            <span>
              No hay caja abierta. Abre tu turno en{" "}
              <a href="/caja" className="font-semibold underline">
                Caja
              </a>{" "}
              para poder vender.
            </span>
          </p>
        ) : null}
        {faltaEfectivo ? (
          <p className="mt-4 flex items-center gap-1.5 rounded-xl bg-amber-500/15 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
            <RiInformationLine className="size-4 shrink-0" />
            El efectivo recibido no cubre el total.
          </p>
        ) : null}
        {err ? (
          <p className="mt-4 flex items-center gap-1.5 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <RiErrorWarningLine className="size-4 shrink-0" />
            {err}
          </p>
        ) : null}
      </div>

      {/* Cobrar */}
      <div className="border-t bg-background/60 p-4">
        <button
          id="btn-cobrar"
          type="button"
          disabled={bloqueado || cargando}
          onClick={() => m.mutate()}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
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
  snap,
  onNueva,
}: {
  venta: VentaCreada
  vuelto: number
  snap: TicketSnap | null
  onNueva: () => void
}) {
  const ticketRef = React.useRef<HTMLDivElement>(null)
  const imprimir = useReactToPrint({
    contentRef: ticketRef,
    documentTitle: `Ticket-${venta.number}`,
    pageStyle: "@page { size: 80mm auto; margin: 4mm } @media print { body { margin: 0 } }",
  })
  const fecha = snap?.fecha ? new Date(snap.fecha) : new Date()

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-auto p-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          <RiCheckLine className="size-6" />
        </span>
        <p className="text-base font-semibold">¡Venta cobrada!</p>
      </div>

      {/* Ticket imprimible (vista previa + fuente de impresión) */}
      <div className="rounded-xl border bg-white p-4 text-black">
        <div ref={ticketRef} className="mx-auto max-w-[280px] font-mono text-[12px] leading-tight text-black">
          <div className="text-center">
            <p className="text-sm font-bold uppercase">
              {snap?.sucursalNombre || "Comprobante"}
            </p>
            <p>{fecha.toLocaleString("es-PE")}</p>
            <p className="font-bold">{venta.number}</p>
          </div>
          <div className="my-2 border-t border-dashed border-black" />
          {(snap?.items ?? []).map((it, i) => (
            <div key={i} className="flex justify-between gap-2">
              <span className="min-w-0 flex-1 truncate">
                {it.cantidad} x {it.nombre}
              </span>
              <span className="tabular-nums">{sol(it.precio * it.cantidad)}</span>
            </div>
          ))}
          <div className="my-2 border-t border-dashed border-black" />
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="tabular-nums">{sol(venta.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold">
            <span>TOTAL</span>
            <span className="tabular-nums">{sol(venta.total)}</span>
          </div>
          <div className="flex justify-between">
            <span>Pagado{snap?.metodo ? ` (${snap.metodo})` : ""}</span>
            <span className="tabular-nums">{sol(venta.totalPagado)}</span>
          </div>
          {vuelto > 0 ? (
            <div className="flex justify-between">
              <span>Vuelto</span>
              <span className="tabular-nums">{sol(vuelto)}</span>
            </div>
          ) : null}
          <div className="my-2 border-t border-dashed border-black" />
          <p className="text-center">¡Gracias por su compra!</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => imprimir()}
        >
          <RiPrinterLine />
          Imprimir
        </Button>
        <Button type="button" className="flex-1" onClick={onNueva}>
          <RiAddLine />
          Nueva venta
        </Button>
      </div>
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
