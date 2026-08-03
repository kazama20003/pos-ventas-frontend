"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  RiAddLine,
  RiDeleteBin6Line,
  RiStarFill,
  RiStarLine,
  RiTruckLine,
} from "@remixicon/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ApiError } from "@/lib/api/client"
import { usePermisos } from "@/hooks/use-permisos"
import type { Producto } from "@/lib/api/catalogo"
import {
  actualizarProductoProveedor,
  desvincularProductoProveedor,
  listarProveedores,
  proveedoresDeVariante,
  vincularProductoProveedor,
} from "@/lib/api/proveedores"

function num(v: string) {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

export function ProveedoresManager({ producto }: { producto: Producto }) {
  const { can } = usePermisos()
  const puedeEditar = can("proveedores.actualizar")
  const qc = useQueryClient()

  const variantes = producto.variants ?? []
  const [varianteId, setVarianteId] = React.useState(variantes[0]?.id ?? "")

  // Proveedores que ya surten esta variante.
  const surten = useQuery({
    queryKey: ["variante-proveedores", varianteId],
    queryFn: () => proveedoresDeVariante(varianteId),
    enabled: Boolean(varianteId),
  })

  // Catálogo de proveedores para el desplegable de "añadir".
  const proveedores = useQuery({
    queryKey: ["proveedores"],
    queryFn: () => listarProveedores(),
  })

  const invalidar = () =>
    qc.invalidateQueries({ queryKey: ["variante-proveedores", varianteId] })

  // --- Formulario de vínculo nuevo ---
  const [proveedorId, setProveedorId] = React.useState("")
  const [costo, setCosto] = React.useState("")
  const [supplierSku, setSupplierSku] = React.useState("")
  const [leadTimeDays, setLeadTimeDays] = React.useState("")
  const [minOrderQty, setMinOrderQty] = React.useState("")
  const [preferido, setPreferido] = React.useState(false)

  const yaVinculados = new Set((surten.data ?? []).map((s) => s.proveedorId))
  const disponibles = (proveedores.data ?? []).filter(
    (p) => p.estado === "ACTIVO" && !yaVinculados.has(p.id)
  )

  const limpiar = () => {
    setProveedorId("")
    setCosto("")
    setSupplierSku("")
    setLeadTimeDays("")
    setMinOrderQty("")
    setPreferido(false)
  }

  const vincular = useMutation({
    mutationFn: () =>
      vincularProductoProveedor(proveedorId, {
        varianteId,
        costo: num(costo),
        supplierSku: supplierSku.trim() || undefined,
        leadTimeDays: leadTimeDays ? parseInt(leadTimeDays, 10) : undefined,
        minOrderQty: minOrderQty ? num(minOrderQty) : undefined,
        isPreferred: preferido,
      }),
    onSuccess: () => {
      invalidar()
      limpiar()
    },
  })

  const marcarPreferido = useMutation({
    mutationFn: (pid: string) =>
      actualizarProductoProveedor(pid, varianteId, { isPreferred: true }),
    onSuccess: invalidar,
  })

  const quitar = useMutation({
    mutationFn: (pid: string) => desvincularProductoProveedor(pid, varianteId),
    onSuccess: invalidar,
  })

  const error = (vincular.error ??
    marcarPreferido.error ??
    quitar.error) as ApiError | Error | null

  const puedeVincular =
    Boolean(varianteId) && Boolean(proveedorId) && num(costo) > 0

  if (!variantes.length) return null

  return (
    <section className="rounded-3xl border bg-card p-5 shadow-sm ring-1 ring-foreground/5">
      <div className="mb-4 flex items-start gap-2">
        <RiTruckLine className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        <div>
          <h2 className="text-base font-semibold leading-tight">Proveedores</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            De dónde llega este producto: costo de compra, SKU del proveedor y
            tiempo de entrega. No afecta el precio de venta.
          </p>
        </div>
      </div>

      {/* Selector de variante (solo si hay más de una). */}
      {variantes.length > 1 ? (
        <div className="mb-4 grid gap-2">
          <Label className="text-xs">Variante</Label>
          <Select
            value={varianteId}
            onChange={setVarianteId}
            options={variantes.map((v) => ({
              value: v.id,
              label: `${v.nombre}${v.sku ? ` · ${v.sku}` : ""}`,
            }))}
          />
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error.message}
        </div>
      ) : null}

      {/* Lista de proveedores que surten la variante. */}
      {surten.isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : !surten.data?.length ? (
        <p className="mb-4 text-sm text-muted-foreground">
          Ningún proveedor asignado todavía.
        </p>
      ) : (
        <div className="mb-4 flex flex-col gap-2">
          {surten.data.map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">
                    {s.proveedorRazonSocial}
                  </p>
                  {s.isPreferred ? (
                    <Badge className="gap-1 bg-amber-500/15 text-amber-600 hover:bg-amber-500/15">
                      <RiStarFill className="size-3" />
                      Preferido
                    </Badge>
                  ) : null}
                </div>
                <p className="font-mono text-xs text-muted-foreground">
                  {s.proveedorCodigo}
                  {s.supplierSku ? ` · SKU ${s.supplierSku}` : ""}
                  {s.leadTimeDays > 0 ? ` · ${s.leadTimeDays} días` : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="text-base font-semibold tabular-nums">
                  {s.moneda} {num(s.costo).toFixed(2)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  costo · mín {num(s.minOrderQty).toFixed(0)}
                </p>
              </div>
              {puedeEditar ? (
                <div className="flex items-center gap-1">
                  {!s.isPreferred ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="Marcar como preferido"
                      disabled={marcarPreferido.isPending}
                      onClick={() => marcarPreferido.mutate(s.proveedorId)}
                    >
                      <RiStarLine className="size-4" />
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    title="Quitar proveedor"
                    className="text-destructive"
                    disabled={quitar.isPending}
                    onClick={() => quitar.mutate(s.proveedorId)}
                  >
                    <RiDeleteBin6Line className="size-4" />
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {/* Formulario para asignar un proveedor. */}
      {puedeEditar ? (
        disponibles.length || proveedores.isLoading ? (
          <div className="rounded-2xl bg-muted/40 p-3">
            <p className="mb-3 text-sm font-medium">Asignar proveedor</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-1">
                <Label className="text-xs">Proveedor</Label>
                <Select
                  value={proveedorId}
                  onChange={setProveedorId}
                  placeholder="Elige un proveedor"
                  options={disponibles.map((p) => ({
                    value: p.id,
                    label: p.razonSocial,
                    hint: p.codigo,
                  }))}
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">Costo de compra</Label>
                <Input
                  inputMode="decimal"
                  value={costo}
                  onChange={(e) =>
                    setCosto(e.target.value.replace(/[^\d.]/g, ""))
                  }
                  placeholder="0.00"
                  className="h-9 tabular-nums"
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">SKU del proveedor (opcional)</Label>
                <Input
                  value={supplierSku}
                  onChange={(e) => setSupplierSku(e.target.value)}
                  placeholder="Código en el proveedor"
                  className="h-9"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-1">
                  <Label className="text-xs">Entrega (días)</Label>
                  <Input
                    inputMode="numeric"
                    value={leadTimeDays}
                    onChange={(e) =>
                      setLeadTimeDays(e.target.value.replace(/[^\d]/g, ""))
                    }
                    placeholder="0"
                    className="h-9 tabular-nums"
                  />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">Pedido mínimo</Label>
                  <Input
                    inputMode="decimal"
                    value={minOrderQty}
                    onChange={(e) =>
                      setMinOrderQty(e.target.value.replace(/[^\d.]/g, ""))
                    }
                    placeholder="1"
                    className="h-9 tabular-nums"
                  />
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={preferido}
                  onChange={(e) => setPreferido(e.target.checked)}
                  className="size-4 accent-[var(--primary)]"
                />
                Proveedor preferido
              </label>
              <Button
                type="button"
                disabled={!puedeVincular || vincular.isPending}
                onClick={() => vincular.mutate()}
              >
                <RiAddLine />
                {vincular.isPending ? "Asignando…" : "Asignar"}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Todos los proveedores activos ya están asignados.{" "}
            <a href="/proveedores" className="text-primary hover:underline">
              Crear proveedor
            </a>
          </p>
        )
      ) : null}
    </section>
  )
}
