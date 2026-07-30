"use client"

import * as React from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { RiAddLine, RiPriceTag3Line, RiSearchLine } from "@remixicon/react"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { listarProductos, type TipoProducto } from "@/lib/api/catalogo"

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
  const [q, setQ] = React.useState("")
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["productos"],
    queryFn: listarProductos,
  })

  const filtrados = React.useMemo(() => {
    if (!data) return []
    const t = q.trim().toLowerCase()
    if (!t) return data
    return data.filter(
      (p) =>
        p.nombre.toLowerCase().includes(t) ||
        p.codigo.toLowerCase().includes(t) ||
        p.variants.some((v) => v.sku?.toLowerCase().includes(t))
    )
  }, [data, q])

  return (
    <>
      <PageHeader
        title="Productos"
        description="Todo lo que vendes, en un solo lugar"
        actions={
          <Button size="sm" render={<Link href="/productos/nuevo" />}>
            <RiAddLine />
            Nuevo producto
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-4">
          {/* Buscador */}
          <div className="relative">
            <RiSearchLine className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre o código…"
              className="h-11 pl-9"
            />
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
          ) : !data || data.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed py-16 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <RiPriceTag3Line className="size-7" />
              </span>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">Aún no tienes productos</h2>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Agrega tu primer producto para empezar a vender. Solo toma un minuto.
                </p>
              </div>
              <Button render={<Link href="/productos/nuevo" />}>
                <RiAddLine />
                Agregar mi primer producto
              </Button>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="rounded-2xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
              Ningún producto coincide con “{q}”.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtrados.map((p) => {
                const v = p.variants[0]
                const cat = p.categories?.[0]?.category?.nombre
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-sm ring-1 ring-foreground/5 transition-colors hover:bg-muted/30"
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <RiPriceTag3Line className="size-5" />
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
                        {v?.taxes && v.taxes.length > 0 ? (
                          <span>· {v.taxes.map((t) => t.tax.codigo).join(", ")}</span>
                        ) : null}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Costo
                      </p>
                      <p className="tabular-nums font-medium">
                        {v ? `S/ ${money(v.cost)}` : "—"}
                      </p>
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
