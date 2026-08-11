"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  RiAddLine,
  RiCheckLine,
  RiDeleteBinLine,
  RiErrorWarningLine,
  RiInboxArchiveLine,
  RiInformationLine,
  RiSearchLine,
  RiShoppingBag3Line,
  RiStore2Line,
} from "@remixicon/react"

import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ApiError } from "@/lib/api/client"
import { listarProductos, type VarianteProducto } from "@/lib/api/catalogo"
import { listarAlmacenes, type Almacen } from "@/lib/api/organizacion"
import { listarProveedores } from "@/lib/api/proveedores"
import {
  crearOrden,
  listarOrdenes,
  recepcionar,
  type EstadoOrdenCompra,
} from "@/lib/api/compras"
import { useSucursalActiva } from "@/hooks/use-sucursal-activa"

const sol = (v: string | number) =>
  `S/ ${Number(v).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

function errMsg(e: unknown) {
  return (e as ApiError | Error | null)?.message ?? null
}

function correlativo(pref: string) {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, "0")
  return `${pref}-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`
}

type Linea = {
  varianteId: string
  nombre: string
  sku: string
  cantidad: number
  costo: string
}

const ESTADO_ORDEN: Record<EstadoOrdenCompra, string> = {
  BORRADOR: "Borrador",
  APROBADA: "Aprobada",
  RECIBIDA_PARCIALMENTE: "Parcial",
  RECIBIDA: "Recibida",
  CERRADA: "Cerrada",
  CANCELADA: "Cancelada",
}

/* ------------------------------------------------------------------ */
/* Página                                                             */
/* ------------------------------------------------------------------ */

export default function ComprasPage() {
  const { sucursalId, sucursal } = useSucursalActiva()
  const [tab, setTab] = React.useState("recepcion")

  return (
    <>
      <PageHeader
        title="Compras"
        description={
          sucursal ? `Reabastecimiento · ${sucursal.nombre}` : "Compras"
        }
      />

      <div className="flex-1 overflow-auto">
        <div className="mx-auto flex max-w-5xl flex-col gap-5 p-5 md:p-6">
          {!sucursalId ? (
            <Aviso
              icon={RiStore2Line}
              titulo="Elige una sucursal"
              texto="Selecciona la sucursal activa en la barra lateral."
            />
          ) : (
            <Tabs value={tab} onValueChange={(v) => setTab(v as string)}>
              <TabsList>
                <TabsTrigger value="recepcion">Ingresar mercadería</TabsTrigger>
                <TabsTrigger value="ordenes">Órdenes de compra</TabsTrigger>
              </TabsList>

              <TabsContent value="recepcion" className="pt-5">
                <Recepcion sucursalId={sucursalId} />
              </TabsContent>
              <TabsContent value="ordenes" className="pt-5">
                <Ordenes sucursalId={sucursalId} />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Buscador de productos (líneas)                                     */
/* ------------------------------------------------------------------ */

function BuscadorLinea({ onAgregar }: { onAgregar: (v: VarianteProducto) => void }) {
  const [q, setQ] = React.useState("")
  const [debounced, setDebounced] = React.useState("")
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 250)
    return () => clearTimeout(t)
  }, [q])

  const busqueda = useQuery({
    queryKey: ["compras-buscar", debounced],
    queryFn: () => listarProductos({ q: debounced, pageSize: 8 }),
    enabled: debounced.length >= 2,
  })
  const items = React.useMemo(() => {
    const prods = busqueda.data?.items ?? []
    // Los servicios no se recepcionan: no tienen stock físico.
    return prods
      .filter((p) => p.kind !== "SERVICIO")
      .flatMap((p) =>
        (p.variants ?? []).map((v) => ({ producto: p.nombre, variante: v }))
      )
  }, [busqueda.data])

  return (
    <div className="relative">
      <RiSearchLine className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar producto para agregar…"
        className="h-10 pl-9"
      />
      {debounced.length >= 2 ? (
        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-xl border bg-card p-1 shadow-lg">
          {busqueda.isLoading ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">Buscando…</p>
          ) : items.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              Sin resultados.
            </p>
          ) : (
            items.map(({ producto, variante }) => (
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

function TablaLineas({
  lineas,
  onCantidad,
  onCosto,
  onQuitar,
}: {
  lineas: Linea[]
  onCantidad: (id: string, v: string) => void
  onCosto: (id: string, v: string) => void
  onQuitar: (id: string) => void
}) {
  if (lineas.length === 0) {
    return (
      <p className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
        Agrega productos con el buscador de arriba.
      </p>
    )
  }
  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4">Producto</TableHead>
            <TableHead className="w-24">Cantidad</TableHead>
            <TableHead className="w-32">Costo unit.</TableHead>
            <TableHead className="w-28 text-right">Subtotal</TableHead>
            <TableHead className="w-0" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {lineas.map((l) => (
            <TableRow key={l.varianteId}>
              <TableCell className="pl-4">
                <div className="text-sm font-medium">{l.nombre}</div>
                <div className="font-mono text-xs text-muted-foreground">
                  {l.sku}
                </div>
              </TableCell>
              <TableCell>
                <Input
                  inputMode="decimal"
                  value={String(l.cantidad)}
                  onChange={(e) => onCantidad(l.varianteId, e.target.value)}
                  className="h-9 w-20 tabular-nums"
                />
              </TableCell>
              <TableCell>
                <Input
                  inputMode="decimal"
                  value={l.costo}
                  onChange={(e) => onCosto(l.varianteId, e.target.value)}
                  placeholder="0.00"
                  className="h-9 w-28 tabular-nums"
                />
              </TableCell>
              <TableCell className="text-right text-sm font-medium tabular-nums">
                {sol(l.cantidad * (Number(l.costo) || 0))}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => onQuitar(l.varianteId)}
                >
                  <RiDeleteBinLine />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function useLineas() {
  const [lineas, setLineas] = React.useState<Linea[]>([])
  const agregar = (v: VarianteProducto) =>
    setLineas((prev) =>
      prev.some((l) => l.varianteId === v.id)
        ? prev
        : [
            ...prev,
            {
              varianteId: v.id,
              nombre: v.nombre,
              sku: v.sku,
              cantidad: 1,
              costo: v.cost ? String(v.cost) : "",
            },
          ]
    )
  const setCantidad = (id: string, val: string) => {
    const n = Number(val.replace(/[^\d.]/g, ""))
    setLineas((prev) =>
      prev.map((l) => (l.varianteId === id ? { ...l, cantidad: n || 0 } : l))
    )
  }
  const setCosto = (id: string, val: string) =>
    setLineas((prev) =>
      prev.map((l) =>
        l.varianteId === id
          ? { ...l, costo: val.replace(/[^\d.]/g, "") }
          : l
      )
    )
  const quitar = (id: string) =>
    setLineas((prev) => prev.filter((l) => l.varianteId !== id))
  const reset = () => setLineas([])
  const total = lineas.reduce(
    (acc, l) => acc + l.cantidad * (Number(l.costo) || 0),
    0
  )
  const valido =
    lineas.length > 0 &&
    lineas.every((l) => l.cantidad > 0 && Number(l.costo) > 0)
  return { lineas, agregar, setCantidad, setCosto, quitar, reset, total, valido }
}

/* ------------------------------------------------------------------ */
/* Recepción (ingreso de mercadería)                                  */
/* ------------------------------------------------------------------ */

function Recepcion({ sucursalId }: { sucursalId: string }) {
  const qc = useQueryClient()
  const proveedores = useQuery({
    queryKey: ["proveedores"],
    queryFn: () => listarProveedores(),
  })
  const almacenesQ = useQuery({
    queryKey: ["almacenes", sucursalId],
    queryFn: () => listarAlmacenes(sucursalId),
  })
  const almacenes = React.useMemo(
    () => (almacenesQ.data ?? []).filter((a: Almacen) => a.estado === "ACTIVO"),
    [almacenesQ.data]
  )
  const almacenPredet =
    almacenes.find((a) => a.esPredeterminado)?.id ?? almacenes[0]?.id ?? ""

  const [proveedorId, setProveedorId] = React.useState("")
  const [almacenSel, setAlmacenSel] = React.useState("")
  const [numero, setNumero] = React.useState(() => correlativo("REC"))
  const [aCredito, setACredito] = React.useState(false)
  const [dias, setDias] = React.useState("30")
  const [docNum, setDocNum] = React.useState("")
  const L = useLineas()
  const idemRef = React.useRef<string | null>(null)

  const almacenId = almacenSel || almacenPredet
  const proveedoresActivos = (proveedores.data ?? []).filter(
    (p) => p.estado === "ACTIVO"
  )

  const m = useMutation({
    mutationFn: () => {
      if (!idemRef.current) idemRef.current = crypto.randomUUID()
      return recepcionar({
        idempotencyKey: idemRef.current,
        almacenId,
        proveedorId,
        number: numero.trim(),
        moneda: "PEN",
        supplierNumber: docNum.trim() || undefined,
        aCredito,
        diasCredito: aCredito ? Number(dias) || 0 : undefined,
        items: L.lineas.map((l) => ({
          varianteId: l.varianteId,
          cantidad: l.cantidad,
          costoUnitario: (Number(l.costo) || 0).toFixed(2),
        })),
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventario"] })
      L.reset()
      idemRef.current = null
      setNumero(correlativo("REC"))
      setDocNum("")
    },
  })
  const err = errMsg(m.error)
  const bloqueado =
    !proveedorId || !almacenId || !numero.trim() || !L.valido || m.isPending

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2.5 rounded-xl border bg-muted/30 p-3.5 text-sm">
        <RiInformationLine className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-muted-foreground">
          Al recibir mercadería, el stock entra al almacén y el{" "}
          <span className="font-medium text-foreground">costo promedio</span> se
          recalcula solo. Si es a crédito, genera una cuenta por pagar.
        </p>
      </div>

      {m.data ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-600 dark:text-emerald-400">
          <RiCheckLine className="size-4 shrink-0" />
          Recepción {m.data.number} contabilizada · {sol(m.data.total)}. Stock
          actualizado.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Campo label="Proveedor">
          <Select
            value={proveedorId}
            onChange={setProveedorId}
            placeholder={proveedores.isLoading ? "Cargando…" : "Elige proveedor"}
            options={proveedoresActivos.map((p) => ({
              value: p.id,
              label: p.razonSocial,
              hint: p.codigo,
            }))}
          />
        </Campo>
        <Campo label="Almacén destino">
          <Select
            value={almacenId}
            onChange={setAlmacenSel}
            placeholder="Elige almacén"
            options={almacenes.map((a) => ({
              value: a.id,
              label: a.nombre,
              hint: a.esPredeterminado ? "predeterminado" : a.codigo,
            }))}
          />
        </Campo>
        <Campo label="N° recepción">
          <Input
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            className="h-10 font-mono"
          />
        </Campo>
      </div>

      <BuscadorLinea onAgregar={L.agregar} />
      <TablaLineas
        lineas={L.lineas}
        onCantidad={L.setCantidad}
        onCosto={L.setCosto}
        onQuitar={L.quitar}
      />

      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={aCredito}
              onChange={(e) => setACredito(e.target.checked)}
              className="size-4 accent-[var(--primary)]"
            />
            Compra a crédito
          </label>
          {aCredito ? (
            <Campo label="Días de crédito">
              <Input
                inputMode="numeric"
                value={dias}
                onChange={(e) => setDias(e.target.value.replace(/[^0-9]/g, ""))}
                className="h-9 w-24 tabular-nums"
              />
            </Campo>
          ) : null}
          <Campo label="N° factura proveedor (opcional)">
            <Input
              value={docNum}
              onChange={(e) => setDocNum(e.target.value)}
              placeholder="F001-123"
              className="h-9 w-40"
            />
          </Campo>
        </div>

        <div className="text-right">
          <p className="text-xs text-muted-foreground">Total recepción</p>
          <p className="text-2xl font-bold tabular-nums">{sol(L.total)}</p>
        </div>
      </div>

      {err ? <ErrorLinea msg={err} /> : null}

      <div className="flex justify-end">
        <Button
          type="button"
          size="lg"
          disabled={bloqueado}
          onClick={() => m.mutate()}
        >
          <RiInboxArchiveLine />
          {m.isPending ? "Contabilizando…" : "Recepcionar e ingresar stock"}
        </Button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Órdenes de compra                                                  */
/* ------------------------------------------------------------------ */

function Ordenes({ sucursalId }: { sucursalId: string }) {
  const [creando, setCreando] = React.useState(false)
  const ordenes = useQuery({
    queryKey: ["ordenes-compra"],
    queryFn: () => listarOrdenes(),
  })
  const proveedores = useQuery({
    queryKey: ["proveedores"],
    queryFn: () => listarProveedores(),
  })
  const nombreProv = React.useMemo(() => {
    const map = new Map(
      (proveedores.data ?? []).map((p) => [p.id, p.razonSocial])
    )
    return (id: string) => map.get(id) ?? "—"
  }, [proveedores.data])

  const data = ordenes.data ?? []

  if (creando) {
    return (
      <NuevaOrden
        sucursalId={sucursalId}
        proveedores={(proveedores.data ?? []).filter(
          (p) => p.estado === "ACTIVO"
        )}
        onListo={() => setCreando(false)}
        onCancelar={() => setCreando(false)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={() => setCreando(true)}>
          <RiAddLine />
          Nueva orden
        </Button>
      </div>

      <div className="rounded-xl border bg-card">
        {ordenes.isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <RiShoppingBag3Line className="size-5" />
            </span>
            <div>
              <p className="text-sm font-medium">Sin órdenes</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Las órdenes son opcionales; también puedes recibir mercadería
                directo.
              </p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Orden</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="pl-5 font-mono text-sm font-medium">
                    {o.number}
                  </TableCell>
                  <TableCell className="text-sm">
                    {o.supplier?.razonSocial ?? nombreProv(o.proveedorId)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {sol(o.total)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {ESTADO_ORDEN[o.estado] ?? o.estado}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}

function NuevaOrden({
  sucursalId,
  proveedores,
  onListo,
  onCancelar,
}: {
  sucursalId: string
  proveedores: { id: string; razonSocial: string; codigo: string }[]
  onListo: () => void
  onCancelar: () => void
}) {
  const qc = useQueryClient()
  const [proveedorId, setProveedorId] = React.useState("")
  const [numero, setNumero] = React.useState(() => correlativo("OC"))
  const L = useLineas()

  const m = useMutation({
    mutationFn: () =>
      crearOrden({
        sucursalId,
        proveedorId,
        number: numero.trim(),
        moneda: "PEN",
        items: L.lineas.map((l) => ({
          varianteId: l.varianteId,
          descripcion: l.nombre,
          cantidad: l.cantidad,
          costoUnitario: (Number(l.costo) || 0).toFixed(2),
        })),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ordenes-compra"] })
      onListo()
    },
  })
  const err = errMsg(m.error)
  const bloqueado = !proveedorId || !numero.trim() || !L.valido || m.isPending

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Proveedor">
          <Select
            value={proveedorId}
            onChange={setProveedorId}
            placeholder="Elige proveedor"
            options={proveedores.map((p) => ({
              value: p.id,
              label: p.razonSocial,
              hint: p.codigo,
            }))}
          />
        </Campo>
        <Campo label="N° orden">
          <Input
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            className="h-10 font-mono"
          />
        </Campo>
      </div>

      <BuscadorLinea onAgregar={L.agregar} />
      <TablaLineas
        lineas={L.lineas}
        onCantidad={L.setCantidad}
        onCosto={L.setCosto}
        onQuitar={L.quitar}
      />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Total orden</p>
          <p className="text-xl font-bold tabular-nums">{sol(L.total)}</p>
        </div>
      </div>

      {err ? <ErrorLinea msg={err} /> : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button type="button" disabled={bloqueado} onClick={() => m.mutate()}>
          <RiCheckLine />
          {m.isPending ? "Creando…" : "Crear orden"}
        </Button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Auxiliares                                                         */
/* ------------------------------------------------------------------ */

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

function ErrorLinea({ msg }: { msg: string }) {
  return (
    <p className="flex items-center gap-1.5 text-xs text-destructive">
      <RiErrorWarningLine className="size-4 shrink-0" />
      {msg}
    </p>
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
