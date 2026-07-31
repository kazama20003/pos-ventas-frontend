"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import {
  RiAddLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiBarcodeLine,
  RiPriceTag3Line,
  RiSearchLine,
  RiUploadCloud2Line,
} from "@remixicon/react"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  buscarProductoPorBarcode,
  listarCategorias,
  listarMarcas,
  listarProductos,
  type TipoProducto,
} from "@/lib/api/catalogo"
import { cn } from "@/lib/utils"

function money(v: string | number) {
  const n = typeof v === "string" ? parseFloat(v) : v
  return Number.isFinite(n) ? n.toFixed(2) : "0.00"
}

const TIPO_LABEL: Record<TipoProducto, string> = {
  ESTANDAR: "Producto",
  SERVICIO: "Servicio",
  PAQUETE: "Combo",
}


export default function ProductosPage() {
  const router = useRouter()
  const [q, setQ] = React.useState("")
  const [qDebounced, setQDebounced] = React.useState("")
  const [categoriaId, setCategoriaId] = React.useState("")
  const [marcaId, setMarcaId] = React.useState("")
  const [conStock, setConStock] = React.useState(false)
  const [page, setPage] = React.useState(1)

  // Debounce del texto (300ms). setState en callback async: no dispara el
  // warning de "setState síncrono en efecto".
  React.useEffect(() => {
    const t = setTimeout(() => {
      setQDebounced(q)
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [q])

  const categorias = useQuery({ queryKey: ["categorias"], queryFn: listarCategorias })
  const marcas = useQuery({ queryKey: ["marcas"], queryFn: listarMarcas })

  const params = {
    q: qDebounced || undefined,
    categoriaId: categoriaId || undefined,
    marcaId: marcaId || undefined,
    conStock: conStock || undefined,
    page,
    pageSize: 30,
  }
  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["productos", params],
    queryFn: () => listarProductos(params),
    placeholderData: keepPreviousData,
  })

  // Escáner: Enter consulta el backend por código de barras y abre el producto.
  async function alEscanear(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return
    const t = q.trim()
    if (!t) return
    try {
      const prod = await buscarProductoPorBarcode(t)
      router.push(`/productos/${prod.id}`)
    } catch {
      // Sin match exacto por barcode: se queda con la búsqueda normal.
    }
  }

  const items = data?.items ?? []
  const hayFiltros = Boolean(qDebounced || categoriaId || marcaId || conStock)

  return (
    <>
      <PageHeader
        title="Productos"
        description="Todo lo que vendes, en un solo lugar"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" render={<Link href="/productos/importar" />}>
              <RiUploadCloud2Line />
              Importar
            </Button>
            <Button size="sm" render={<Link href="/productos/nuevo" />}>
              <RiAddLine />
              Nuevo producto
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
          {/* Buscador + escáner */}
          <div className="relative">
            <RiSearchLine className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={alEscanear}
              placeholder="Buscar o escanear: nombre, código o código de barras…"
              className="h-11 pl-9 pr-9"
            />
            <RiBarcodeLine className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-2">
            <Select
              className="w-48"
              value={categoriaId}
              onChange={(v) => {
                setCategoriaId(v)
                setPage(1)
              }}
              placeholder="Todas las categorías"
              options={[
                { value: "", label: "Todas las categorías" },
                ...(categorias.data ?? []).map((c) => ({ value: c.id, label: c.nombre })),
              ]}
            />
            <Select
              className="w-44"
              value={marcaId}
              onChange={(v) => {
                setMarcaId(v)
                setPage(1)
              }}
              placeholder="Todas las marcas"
              options={[
                { value: "", label: "Todas las marcas" },
                ...(marcas.data ?? []).map((m) => ({ value: m.id, label: m.nombre })),
              ]}
            />
            <button
              type="button"
              onClick={() => {
                setConStock((v) => !v)
                setPage(1)
              }}
              className={cn(
                "h-9 rounded-full border px-3.5 text-sm transition-colors",
                conStock
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:bg-muted/50"
              )}
            >
              Con stock
            </button>
            {hayFiltros ? (
              <button
                type="button"
                onClick={() => {
                  setQ("")
                  setCategoriaId("")
                  setMarcaId("")
                  setConStock(false)
                  setPage(1)
                }}
                className="text-xs text-muted-foreground underline-offset-2 hover:underline"
              >
                Limpiar
              </button>
            ) : null}
            {data ? (
              <span className="ml-auto text-xs text-muted-foreground">
                {data.total} producto(s)
              </span>
            ) : null}
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-2xl" />
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              No se pudieron cargar los productos: {(error as Error).message}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed py-16 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <RiPriceTag3Line className="size-7" />
              </span>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">
                  {hayFiltros ? "Sin resultados" : "Aún no tienes productos"}
                </h2>
                <p className="max-w-sm text-sm text-muted-foreground">
                  {hayFiltros
                    ? "Prueba con otros filtros o limpia la búsqueda."
                    : "Agrega tu primer producto para empezar a vender."}
                </p>
              </div>
              {!hayFiltros ? (
                <Button render={<Link href="/productos/nuevo" />}>
                  <RiAddLine />
                  Agregar mi primer producto
                </Button>
              ) : null}
            </div>
          ) : (
            <div
              className={cn(
                "flex flex-col gap-2 transition-opacity",
                isFetching ? "opacity-60" : ""
              )}
            >
              {items.map((p) => {
                const v = p.variants[0]
                const cat = p.categories?.[0]?.category?.nombre
                const precio = v?.prices?.find(
                  (pr) => Number(pr.minQuantity) === 1
                )?.monto
                const barcode = v?.barcodigos?.find((b) => b.isPrimary)?.codigo
                return (
                  <Link
                    key={p.id}
                    href={`/productos/${p.id}`}
                    className="group flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-sm ring-1 ring-foreground/5 transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 text-primary">
                      {p.imagenUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imagenUrl} alt="" className="size-full object-cover" />
                      ) : (
                        <RiPriceTag3Line className="size-5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{p.nombre}</span>
                        <Badge variant="secondary">{TIPO_LABEL[p.kind]}</Badge>
                        {cat ? <Badge variant="outline">{cat}</Badge> : null}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                        <span className="font-mono">{p.codigo}</span>
                        {v?.unitOfMeasure?.symbol ? (
                          <span>· por {v.unitOfMeasure.symbol}</span>
                        ) : null}
                        {barcode ? <span className="font-mono">· {barcode}</span> : null}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        {precio !== undefined ? "Precio" : "Costo"}
                      </p>
                      <p className="tabular-nums font-medium">
                        {precio !== undefined
                          ? `S/ ${money(precio)}`
                          : v
                            ? `S/ ${money(v.cost)}`
                            : "—"}
                      </p>
                    </div>
                    <RiArrowRightSLine className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                )
              })}
            </div>
          )}

          {/* Paginación */}
          {data && data.totalPages > 1 ? (
            <div className="flex items-center justify-center gap-3 py-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <RiArrowLeftSLine />
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {data.page} de {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
                <RiArrowRightSLine />
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}
