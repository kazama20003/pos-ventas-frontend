"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  RiArrowLeftLine,
  RiCheckLine,
  RiDeleteBin6Line,
  RiErrorWarningLine,
  RiPriceTag3Line,
  RiStackLine,
} from "@remixicon/react"

import { ImageUpload } from "@/components/productos/image-upload"
import { ProveedoresManager } from "@/components/productos/proveedores-manager"
import { VariantesManager } from "@/components/productos/variantes-manager"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError } from "@/lib/api/client"
import {
  actualizarProducto,
  ajustarStock,
  archivarProducto,
  listarCategorias,
  listarMarcas,
  listarProductos,
  obtenerKardex,
  obtenerProducto,
  type ComponenteComboDto,
  type Producto,
  type TipoAjusteStock,
  type TipoProducto,
} from "@/lib/api/catalogo"
import { cn } from "@/lib/utils"

function money(v: string | number) {
  const n = typeof v === "string" ? parseFloat(v) : v
  return Number.isFinite(n) ? n.toFixed(2) : "0.00"
}

const TIPOS: { value: TipoProducto; titulo: string }[] = [
  { value: "ESTANDAR", titulo: "Producto" },
  { value: "SERVICIO", titulo: "Servicio" },
  { value: "PAQUETE", titulo: "Combo" },
]


function Seccion({
  titulo,
  ayuda,
  children,
}: {
  titulo: string
  ayuda?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-3xl border bg-card p-5 shadow-sm ring-1 ring-foreground/5">
      <div className="mb-4">
        <h2 className="text-base font-semibold leading-tight">{titulo}</h2>
        {ayuda ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{ayuda}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

export default function ProductoDetallePage() {
  const params = useParams<{ id: string }>()
  const id = params.id

  const producto = useQuery({
    queryKey: ["producto", id],
    queryFn: () => obtenerProducto(id),
    enabled: Boolean(id),
  })

  if (producto.isLoading || !producto.data) {
    return (
      <>
        <PageHeader
          title="Producto"
          actions={
            <Button variant="ghost" size="sm" render={<Link href="/productos" />}>
              <RiArrowLeftLine />
              Volver
            </Button>
          }
        />
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
            {producto.isError ? (
              <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                No se pudo cargar el producto: {(producto.error as Error).message}
              </div>
            ) : (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full rounded-3xl" />
              ))
            )}
          </div>
        </div>
      </>
    )
  }

  // Editor keyed por id: al montar inicializa su estado desde el producto,
  // sin efectos que sincronicen (evita renders en cascada).
  return <EditorProducto key={id} producto={producto.data} />
}

function EditorProducto({ producto: p }: { producto: Producto }) {
  const id = p.id
  const router = useRouter()
  const qc = useQueryClient()

  const categorias = useQuery({ queryKey: ["categorias"], queryFn: listarCategorias })
  const marcas = useQuery({ queryKey: ["marcas"], queryFn: listarMarcas })
  const productos = useQuery({
    queryKey: ["productos", "combo"],
    queryFn: () => listarProductos({ pageSize: 100 }),
  })

  const variante = p.variants[0]

  const [nombre, setNombre] = React.useState(p.nombre)
  const [codigo, setCodigo] = React.useState(p.codigo)
  const [descripcion, setDescripcion] = React.useState(p.descripcion ?? "")
  const [tipo, setTipo] = React.useState<TipoProducto>(p.kind)
  const [categoriaId, setCategoriaId] = React.useState(
    p.categories?.[0]?.category?.id ?? ""
  )
  const [marcaId, setMarcaId] = React.useState(p.marcaId ?? "")
  const [imagenUrl, setImagenUrl] = React.useState(p.imagenUrl ?? "")

  // Combo: mapa varianteId → cantidad, inicializado desde los componentes.
  const [combo, setCombo] = React.useState<Record<string, number>>(() =>
    Object.fromEntries(
      (p.bundleItems ?? []).map((b) => [b.componentVariantId, Number(b.cantidad)])
    )
  )

  const componentes: ComponenteComboDto[] = Object.entries(combo)
    .filter(([, c]) => c > 0)
    .map(([varianteId, cantidad]) => ({ varianteId, cantidad }))

  const guardar = useMutation({
    mutationFn: () =>
      actualizarProducto(id, {
        codigo: codigo.trim(),
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        kind: tipo,
        marcaId: marcaId,
        imagenUrl: imagenUrl.trim(),
        categoriaIds: categoriaId ? [categoriaId] : [],
        componentes: tipo === "PAQUETE" ? componentes : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["productos"] })
      qc.invalidateQueries({ queryKey: ["producto", id] })
      router.push("/productos")
    },
  })

  const [confirmar, setConfirmar] = React.useState(false)
  const archivar = useMutation({
    mutationFn: () => archivarProducto(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["productos"] })
      router.push("/productos")
    },
  })

  // --- Ajuste de stock ---
  const saldos = variante?.saldosInventario ?? []
  const [ajusteAlmacen, setAjusteAlmacen] = React.useState(
    saldos[0]?.almacenId ?? ""
  )
  const [ajusteTipo, setAjusteTipo] = React.useState<TipoAjusteStock>("ENTRADA")
  const [ajusteCantidad, setAjusteCantidad] = React.useState("")
  const [ajusteMotivo, setAjusteMotivo] = React.useState("")
  const ajuste = useMutation({
    mutationFn: () =>
      ajustarStock({
        almacenId: ajusteAlmacen,
        varianteId: variante!.id,
        tipo: ajusteTipo,
        cantidad: parseFloat(ajusteCantidad),
        motivo: ajusteMotivo.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["producto", id] })
      qc.invalidateQueries({ queryKey: ["productos"] })
      qc.invalidateQueries({ queryKey: ["kardex", variante?.id] })
      setAjusteCantidad("")
      setAjusteMotivo("")
    },
  })

  // --- Kardex (perezoso) ---
  const [verKardex, setVerKardex] = React.useState(false)
  const kardex = useQuery({
    queryKey: ["kardex", variante?.id],
    queryFn: () => obtenerKardex(variante!.id),
    enabled: verKardex && Boolean(variante?.id),
  })

  const valido = nombre.trim().length > 0 && codigo.trim().length > 0
  const error = (guardar.error ?? archivar.error ?? ajuste.error) as
    | ApiError
    | Error
    | null

  return (
    <>
      <PageHeader
        title={p.nombre}
        description="Edita la información del producto o archívalo."
        actions={
          <Button variant="ghost" size="sm" render={<Link href="/productos" />}>
            <RiArrowLeftLine />
            Volver
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-4 md:p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (valido) guardar.mutate()
          }}
          className="w-full pb-24"
        >
          {error ? (
            <div className="mb-4 flex items-start gap-2 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <RiErrorWarningLine className="mt-0.5 size-4 shrink-0" />
              <span>{error.message}</span>
            </div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex min-w-0 flex-col gap-4">

          <Seccion titulo="Información básica">
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="h-11 text-base"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="codigo">Código</Label>
                  <Input
                    id="codigo"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    className="h-11 font-mono"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="descripcion">Descripción (opcional)</Label>
                <textarea
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={3}
                  className="min-h-20 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
                />
              </div>
            </div>
          </Seccion>

          <Seccion titulo="Tipo">
            <div className="flex flex-wrap gap-2">
              {TIPOS.map((t) => {
                const activo = tipo === t.value
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTipo(t.value)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-colors",
                      activo
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:bg-muted/50"
                    )}
                  >
                    {activo ? <RiCheckLine className="size-4" /> : null}
                    {t.titulo}
                  </button>
                )
              })}
            </div>
          </Seccion>

          <VariantesManager producto={p} />

          {tipo !== "SERVICIO" ? <ProveedoresManager producto={p} /> : null}

          {tipo !== "SERVICIO" && variante ? (
            <Seccion
              titulo="Existencias"
              ayuda="Stock disponible por almacén. Ajusta entradas, salidas o mermas."
            >
              {!saldos.length ? (
                <p className="mb-4 text-sm text-muted-foreground">
                  Sin stock registrado todavía.
                </p>
              ) : (
                <div className="mb-4 flex flex-col gap-2">
                  {saldos.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between gap-3 rounded-xl border p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {s.warehouse?.nombre ?? "Almacén"}
                        </p>
                        {s.warehouse?.codigo ? (
                          <p className="font-mono text-xs text-muted-foreground">
                            {s.warehouse.codigo}
                          </p>
                        ) : null}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold tabular-nums">
                          {money(s.available)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          disponible
                          {Number(s.reserved) > 0
                            ? ` · ${money(s.reserved)} reservado`
                            : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulario de ajuste (requiere al menos un almacén con saldo). */}
              {saldos.length ? (
                <div className="rounded-2xl bg-muted/40 p-3">
                  <p className="mb-3 text-sm font-medium">Ajustar stock</p>
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="grid gap-1">
                      <Label className="text-xs">Almacén</Label>
                      <Select
                        className="min-w-40"
                        value={ajusteAlmacen}
                        onChange={setAjusteAlmacen}
                        options={saldos.map((s) => ({
                          value: s.almacenId,
                          label: s.warehouse?.nombre ?? s.almacenId,
                        }))}
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-xs">Tipo</Label>
                      <Select
                        className="min-w-44"
                        value={ajusteTipo}
                        onChange={(v) => setAjusteTipo(v as TipoAjusteStock)}
                        options={[
                          { value: "ENTRADA", label: "Entrada (+)" },
                          { value: "SALIDA", label: "Salida / merma (−)" },
                        ]}
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label htmlFor="ajCant" className="text-xs">
                        Cantidad
                      </Label>
                      <Input
                        id="ajCant"
                        inputMode="decimal"
                        value={ajusteCantidad}
                        onChange={(e) =>
                          setAjusteCantidad(e.target.value.replace(/[^\d.]/g, ""))
                        }
                        placeholder="0"
                        className="h-9 w-24 tabular-nums"
                      />
                    </div>
                    <div className="grid flex-1 gap-1">
                      <Label htmlFor="ajMot" className="text-xs">
                        Motivo (opcional)
                      </Label>
                      <Input
                        id="ajMot"
                        value={ajusteMotivo}
                        onChange={(e) => setAjusteMotivo(e.target.value)}
                        placeholder="Conteo, merma, recepción…"
                        className="h-9"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={
                        !ajusteAlmacen ||
                        !ajusteCantidad ||
                        parseFloat(ajusteCantidad) <= 0 ||
                        ajuste.isPending
                      }
                      onClick={() => ajuste.mutate()}
                    >
                      {ajuste.isPending ? "Aplicando…" : "Aplicar"}
                    </Button>
                  </div>
                </div>
              ) : null}

              {/* Kardex */}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setVerKardex((v) => !v)}
                  className="text-sm font-medium text-primary underline-offset-2 hover:underline"
                >
                  {verKardex ? "Ocultar movimientos" : "Ver movimientos (kardex)"}
                </button>
                {verKardex ? (
                  kardex.isLoading ? (
                    <p className="mt-2 text-sm text-muted-foreground">Cargando…</p>
                  ) : !kardex.data?.length ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Sin movimientos registrados.
                    </p>
                  ) : (
                    <div className="mt-2 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                            <th className="py-2 pr-3">Fecha</th>
                            <th className="py-2 pr-3">Tipo</th>
                            <th className="py-2 pr-3 text-right">Cantidad</th>
                            <th className="py-2">Motivo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {kardex.data.map((m) => {
                            const entra = m.movementType.includes("ENTRADA") ||
                              m.movementType === "APERTURA" ||
                              m.movementType === "RECEPCION_COMPRA" ||
                              m.movementType === "DEVOLUCION_VENTA"
                            return (
                              <tr key={m.id} className="border-b last:border-0">
                                <td className="py-2 pr-3 text-muted-foreground">
                                  {new Date(m.occurredAt).toLocaleDateString()}
                                </td>
                                <td className="py-2 pr-3">{m.movementType}</td>
                                <td
                                  className={cn(
                                    "py-2 pr-3 text-right tabular-nums font-medium",
                                    entra ? "text-emerald-600" : "text-destructive"
                                  )}
                                >
                                  {entra ? "+" : "−"}
                                  {money(m.cantidad)}
                                </td>
                                <td className="py-2 text-muted-foreground">
                                  {m.notas ?? "—"}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : null}
              </div>
            </Seccion>
          ) : null}

          <Seccion titulo="Clasificación">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Grupo</Label>
                <Select
                  value={categoriaId}
                  onChange={setCategoriaId}
                  placeholder="Sin grupo"
                  options={[
                    { value: "", label: "Sin grupo" },
                    ...(categorias.data ?? []).map((c) => ({ value: c.id, label: c.nombre })),
                  ]}
                />
              </div>
              <div className="grid gap-2">
                <Label>Marca</Label>
                <Select
                  value={marcaId}
                  onChange={setMarcaId}
                  placeholder="Sin marca"
                  options={[
                    { value: "", label: "Sin marca" },
                    ...(marcas.data ?? []).map((m) => ({ value: m.id, label: m.nombre })),
                  ]}
                />
              </div>
            </div>
          </Seccion>

          {tipo === "PAQUETE" ? (
            <Seccion
              titulo="Contenido del combo"
              ayuda="Elige los productos que incluye y su cantidad."
            >
              {(() => {
                const disponibles = (productos.data?.items ?? [])
                  .filter((prod) => prod.id !== id)
                  .flatMap((prod) =>
                    prod.variants.map((v) => ({
                      id: v.id,
                      etiqueta: `${prod.nombre}${
                        v.nombre && v.nombre !== prod.nombre ? ` · ${v.nombre}` : ""
                      }`,
                      sku: v.sku,
                    }))
                  )
                if (!disponibles.length)
                  return (
                    <p className="text-sm text-muted-foreground">
                      No hay otros productos para armar el combo.
                    </p>
                  )
                return (
                  <div className="flex flex-col gap-2">
                    {disponibles.map((v) => {
                      const cant = combo[v.id] ?? 0
                      return (
                        <div
                          key={v.id}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border p-2.5 transition-colors",
                            cant > 0 ? "border-primary bg-primary/5" : ""
                          )}
                        >
                          <RiStackLine className="size-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {v.etiqueta}
                            </p>
                            <p className="font-mono text-xs text-muted-foreground">
                              {v.sku}
                            </p>
                          </div>
                          <Input
                            inputMode="decimal"
                            value={cant ? String(cant) : ""}
                            onChange={(e) => {
                              const n = parseFloat(
                                e.target.value.replace(/[^\d.]/g, "")
                              )
                              setCombo((prev) => ({
                                ...prev,
                                [v.id]: Number.isFinite(n) ? n : 0,
                              }))
                            }}
                            placeholder="0"
                            className="h-9 w-20 tabular-nums"
                          />
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </Seccion>
          ) : null}

          </div>
          {/* ===== Panel lateral ===== */}
          <div className="flex flex-col gap-4">

          <Seccion
            titulo="Foto"
            ayuda="Ayuda a reconocerlo rápido en caja."
          >
            <ImageUpload value={imagenUrl} onChange={setImagenUrl} />
          </Seccion>

          {/* Zona de archivado */}
          <Seccion
            titulo="Archivar producto"
            ayuda="Deja de aparecer en el catálogo. No se borra: su historial de ventas se conserva."
          >
            {confirmar ? (
              <div className="flex flex-col gap-3 rounded-2xl bg-destructive/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-destructive">
                  ¿Seguro? El producto ya no se podrá vender.
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setConfirmar(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={archivar.isPending}
                    onClick={() => archivar.mutate()}
                  >
                    {archivar.isPending ? "Archivando…" : "Sí, archivar"}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="text-destructive"
                onClick={() => setConfirmar(true)}
              >
                <RiDeleteBin6Line />
                Archivar producto
              </Button>
            )}
          </Seccion>

          </div>
          </div>
        </form>
      </div>

      {/* Barra de acción fija */}
      <div className="sticky bottom-0 z-10 flex items-center justify-end gap-2 border-t bg-background/80 px-4 py-3 backdrop-blur-md md:px-6">
        <Button variant="ghost" render={<Link href="/productos" />}>
          Cancelar
        </Button>
        <Button
          onClick={() => valido && guardar.mutate()}
          disabled={!valido || guardar.isPending}
        >
          <RiPriceTag3Line />
          {guardar.isPending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </>
  )
}
