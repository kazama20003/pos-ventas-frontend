"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  RiAddLine,
  RiBarcodeLine,
  RiDeleteBin6Line,
  RiPriceTag3Line,
} from "@remixicon/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { ApiError } from "@/lib/api/client"
import {
  actualizarVariante,
  agregarBarcode,
  agregarVariante,
  archivarVariante,
  generarBarcodeInterno,
  listarImpuestos,
  listarUnidades,
  quitarBarcode,
  type Producto,
  type TipoCodigoBarras,
  type VarianteProducto,
} from "@/lib/api/catalogo"
import { cn } from "@/lib/utils"


const CB_TIPOS: TipoCodigoBarras[] = [
  "INTERNO",
  "EAN13",
  "EAN8",
  "UPC_A",
  "CODIGO128",
  "QR",
  "PLU",
]

export function VariantesManager({ producto }: { producto: Producto }) {
  const id = producto.id
  const qc = useQueryClient()
  const unidades = useQuery({ queryKey: ["unidades"], queryFn: listarUnidades })
  const impuestos = useQuery({ queryKey: ["impuestos"], queryFn: listarImpuestos })

  const invalidar = () => {
    qc.invalidateQueries({ queryKey: ["producto", id] })
    qc.invalidateQueries({ queryKey: ["productos"] })
  }

  const [agregando, setAgregando] = React.useState(false)

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm ring-1 ring-foreground/5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <RiPriceTag3Line className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold leading-tight">
              Variantes ({producto.variants.length})
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Presentaciones del producto (talla, color, tamaño…).
            </p>
          </div>
        </div>
        {!agregando ? (
          <Button type="button" variant="outline" size="sm" onClick={() => setAgregando(true)}>
            <RiAddLine />
            Agregar
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        {producto.variants.map((v) => (
          <VarianteCard
            key={v.id}
            productoId={id}
            variante={v}
            puedeArchivar={producto.variants.length > 1}
            unidades={unidades.data ?? []}
            impuestos={impuestos.data ?? []}
            onCambio={invalidar}
          />
        ))}

        {agregando ? (
          <NuevaVariante
            productoId={id}
            unidades={unidades.data ?? []}
            onHecho={() => {
              setAgregando(false)
              invalidar()
            }}
            onCancelar={() => setAgregando(false)}
          />
        ) : null}
      </div>
    </section>
  )
}

function VarianteCard({
  productoId,
  variante,
  puedeArchivar,
  unidades,
  impuestos,
  onCambio,
}: {
  productoId: string
  variante: VarianteProducto
  puedeArchivar: boolean
  unidades: { id: string; nombre: string; symbol: string }[]
  impuestos: { id: string; nombre: string; codigo: string }[]
  onCambio: () => void
}) {
  const precioActual = variante.prices?.find((p) => Number(p.minQuantity) === 1)?.monto
  const [nombre, setNombre] = React.useState(variante.nombre)
  const [precio, setPrecio] = React.useState(
    precioActual !== undefined ? String(precioActual) : ""
  )
  const [costo, setCosto] = React.useState(String(variante.cost ?? ""))
  const [unidadId, setUnidadId] = React.useState(variante.unidadMedidaId)
  const [impuestoId, setImpuestoId] = React.useState(
    variante.taxes?.[0]?.tax?.id ?? ""
  )

  const guardar = useMutation({
    mutationFn: () =>
      actualizarVariante(productoId, variante.id, {
        nombre: nombre.trim(),
        precio: precio ? parseFloat(precio) : undefined,
        cost: costo ? parseFloat(costo) : undefined,
        unidadMedidaId: unidadId || undefined,
        impuestoIds: impuestoId ? [impuestoId] : [],
      }),
    onSuccess: onCambio,
  })

  const archivar = useMutation({
    mutationFn: () => archivarVariante(productoId, variante.id),
    onSuccess: onCambio,
  })

  const error = (guardar.error ?? archivar.error) as ApiError | Error | null

  return (
    <div className="rounded-xl border p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="grid gap-1.5">
          <Label className="text-xs text-muted-foreground">Nombre</Label>
          <Input value={nombre} onChange={(e) => setNombre(e.target.value)} className="h-9" />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs text-muted-foreground">Precio</Label>
          <Input
            inputMode="decimal"
            value={precio}
            onChange={(e) => setPrecio(e.target.value.replace(/[^\d.]/g, ""))}
            placeholder="0.00"
            className="h-9 tabular-nums"
          />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs text-muted-foreground">Costo</Label>
          <Input
            inputMode="decimal"
            value={costo}
            onChange={(e) => setCosto(e.target.value.replace(/[^\d.]/g, ""))}
            placeholder="0.00"
            className="h-9 tabular-nums"
          />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs text-muted-foreground">Unidad</Label>
          <Select
            value={unidadId}
            onChange={setUnidadId}
            options={unidades.map((u) => ({
              value: u.id,
              label: `${u.nombre} (${u.symbol})`,
            }))}
          />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs text-muted-foreground">Impuesto</Label>
          <Select
            value={impuestoId}
            onChange={setImpuestoId}
            placeholder="Sin impuesto"
            options={[
              { value: "", label: "Sin impuesto" },
              ...impuestos.map((t) => ({ value: t.id, label: `${t.nombre} (${t.codigo})` })),
            ]}
          />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs text-muted-foreground">SKU</Label>
          <Input value={variante.sku} disabled className="h-9 font-mono opacity-70" />
        </div>
      </div>

      <BarcodesVariante varianteId={variante.id} barcodes={variante.barcodigos ?? []} onCambio={onCambio} />

      {error ? <p className="mt-2 text-xs text-destructive">{error.message}</p> : null}

      <div className="mt-3 flex items-center justify-between gap-2">
        {puedeArchivar ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive"
            disabled={archivar.isPending}
            onClick={() => archivar.mutate()}
          >
            <RiDeleteBin6Line />
            Archivar
          </Button>
        ) : (
          <span />
        )}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={guardar.isPending}
          onClick={() => guardar.mutate()}
        >
          {guardar.isPending ? "Guardando…" : "Guardar variante"}
        </Button>
      </div>
    </div>
  )
}

function BarcodesVariante({
  varianteId,
  barcodes,
  onCambio,
}: {
  varianteId: string
  barcodes: { id: string; codigo: string; tipo: TipoCodigoBarras; isPrimary: boolean }[]
  onCambio: () => void
}) {
  const [codigo, setCodigo] = React.useState("")
  const [tipo, setTipo] = React.useState<TipoCodigoBarras>("INTERNO")

  const agregar = useMutation({
    mutationFn: () => agregarBarcode(varianteId, { codigo: codigo.trim(), tipo }),
    onSuccess: () => {
      setCodigo("")
      onCambio()
    },
  })
  const quitar = useMutation({
    mutationFn: (barcodeId: string) => quitarBarcode(varianteId, barcodeId),
    onSuccess: onCambio,
  })
  const generar = useMutation({
    mutationFn: generarBarcodeInterno,
    onSuccess: (r) => {
      setCodigo(r.codigo)
      setTipo(r.tipo)
    },
  })

  const error = (agregar.error ?? quitar.error) as ApiError | Error | null

  return (
    <div className="mt-3 rounded-xl bg-muted/40 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <RiBarcodeLine className="size-4" />
        Códigos de barras
      </div>

      {barcodes.length ? (
        <div className="mb-2 flex flex-wrap gap-2">
          {barcodes.map((b) => (
            <span
              key={b.id}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border bg-background py-1 pl-3 pr-1 text-xs",
                b.isPrimary ? "border-primary" : ""
              )}
            >
              <span className="font-mono">{b.codigo}</span>
              <span className="text-muted-foreground">· {b.tipo}</span>
              {b.isPrimary ? (
                <span className="rounded-full bg-primary/10 px-1.5 text-[10px] text-primary">
                  principal
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => quitar.mutate(b.id)}
                className="flex size-5 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label="Quitar"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="mb-2 text-xs text-muted-foreground">Sin códigos.</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-40 flex-1">
          <Input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Código…"
            className="h-9 font-mono"
          />
        </div>
        <Select
          className="w-32"
          value={tipo}
          onChange={(v) => setTipo(v as TipoCodigoBarras)}
          options={CB_TIPOS.map((t) => ({ value: t, label: t }))}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={generar.isPending}
          onClick={() => generar.mutate()}
        >
          {generar.isPending ? "…" : "Generar"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!codigo.trim() || agregar.isPending}
          onClick={() => agregar.mutate()}
        >
          <RiAddLine />
          Añadir
        </Button>
      </div>
      {error ? <p className="mt-1.5 text-xs text-destructive">{error.message}</p> : null}
    </div>
  )
}

function NuevaVariante({
  productoId,
  unidades,
  onHecho,
  onCancelar,
}: {
  productoId: string
  unidades: { id: string; nombre: string; symbol: string }[]
  onHecho: () => void
  onCancelar: () => void
}) {
  const [nombre, setNombre] = React.useState("")
  const [precio, setPrecio] = React.useState("")
  const [costo, setCosto] = React.useState("")
  const [unidadId, setUnidadId] = React.useState("")
  const unidadSel = unidadId || unidades[0]?.id || ""

  const crear = useMutation({
    mutationFn: () =>
      agregarVariante(productoId, {
        unidadMedidaId: unidadSel,
        nombre: nombre.trim(),
        precio: precio ? parseFloat(precio) : undefined,
        cost: costo ? parseFloat(costo) : undefined,
      }),
    onSuccess: onHecho,
  })
  const error = crear.error as ApiError | Error | null

  return (
    <div className="rounded-xl border border-dashed p-4">
      <p className="mb-3 text-sm font-medium">Nueva variante</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="grid gap-1.5">
          <Label className="text-xs text-muted-foreground">Nombre</Label>
          <Input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Talla M"
            className="h-9"
          />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs text-muted-foreground">Precio</Label>
          <Input
            inputMode="decimal"
            value={precio}
            onChange={(e) => setPrecio(e.target.value.replace(/[^\d.]/g, ""))}
            placeholder="0.00"
            className="h-9 tabular-nums"
          />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs text-muted-foreground">Costo</Label>
          <Input
            inputMode="decimal"
            value={costo}
            onChange={(e) => setCosto(e.target.value.replace(/[^\d.]/g, ""))}
            placeholder="0.00"
            className="h-9 tabular-nums"
          />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs text-muted-foreground">Unidad</Label>
          <Select
            value={unidadSel}
            onChange={setUnidadId}
            options={unidades.map((u) => ({
              value: u.id,
              label: `${u.nombre} (${u.symbol})`,
            }))}
          />
        </div>
      </div>
      {error ? <p className="mt-2 text-xs text-destructive">{error.message}</p> : null}
      <div className="mt-3 flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!nombre.trim() || !unidadSel || crear.isPending}
          onClick={() => crear.mutate()}
        >
          {crear.isPending ? "Creando…" : "Crear variante"}
        </Button>
      </div>
    </div>
  )
}
