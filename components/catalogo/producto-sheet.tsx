"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { RiErrorWarningLine } from "@remixicon/react"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ApiError } from "@/lib/api/client"
import {
  crearProducto,
  crearUnidad,
  listarImpuestos,
  listarUnidades,
} from "@/lib/api/catalogo"

const selectCls =
  "h-9 w-full rounded-xl border bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"

export function ProductoSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const qc = useQueryClient()
  const unidades = useQuery({ queryKey: ["unidades"], queryFn: listarUnidades })
  const impuestos = useQuery({ queryKey: ["impuestos"], queryFn: listarImpuestos })

  const [form, setForm] = React.useState({
    codigo: "",
    nombre: "",
    descripcion: "",
    kind: "ESTANDAR" as "ESTANDAR" | "SERVICIO" | "PAQUETE",
    sku: "",
    varianteNombre: "",
    cost: "",
    unidadMedidaId: "",
    impuestoId: "",
  })
  const set = (k: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }))

  const sinUnidades = !unidades.isLoading && (unidades.data?.length ?? 0) === 0
  const [nuevaUnidad, setNuevaUnidad] = React.useState(false)
  const [uForm, setUForm] = React.useState({ codigo: "", nombre: "", symbol: "", sunatCode: "NIU" })
  const setU = (k: keyof typeof uForm) => (v: string) => setUForm((f) => ({ ...f, [k]: v }))

  const mUnidad = useMutation({
    mutationFn: crearUnidad,
    onSuccess: (u) => {
      qc.invalidateQueries({ queryKey: ["unidades"] })
      setForm((f) => ({ ...f, unidadMedidaId: u.id }))
      setNuevaUnidad(false)
      setUForm({ codigo: "", nombre: "", symbol: "", sunatCode: "NIU" })
    },
  })

  const mProducto = useMutation({
    mutationFn: crearProducto,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["productos"] })
      onOpenChange(false)
      setForm({
        codigo: "", nombre: "", descripcion: "", kind: "ESTANDAR",
        sku: "", varianteNombre: "", cost: "", unidadMedidaId: "", impuestoId: "",
      })
    },
  })

  const valido =
    form.codigo.trim() &&
    form.nombre.trim() &&
    form.sku.trim() &&
    form.varianteNombre.trim() &&
    form.unidadMedidaId

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!valido) return
    mProducto.mutate({
      codigo: form.codigo.trim(),
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || undefined,
      kind: form.kind,
      variantes: [
        {
          unidadMedidaId: form.unidadMedidaId,
          sku: form.sku.trim(),
          nombre: form.varianteNombre.trim(),
          cost: form.cost ? parseFloat(form.cost) : undefined,
          impuestoIds: form.impuestoId ? [form.impuestoId] : [],
        },
      ],
    })
  }

  const error = mProducto.error as ApiError | null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Nuevo producto</SheetTitle>
          <SheetDescription>Crea un producto con su variante principal.</SheetDescription>
        </SheetHeader>

        <form onSubmit={enviar} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-auto px-4 py-2">
            {error ? (
              <div className="mb-3 flex items-start gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <RiErrorWarningLine className="mt-0.5 size-4 shrink-0" />
                <span>{error.message}</span>
              </div>
            ) : null}

            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="codigo">Código</Label>
                  <Input id="codigo" value={form.codigo} onChange={(e) => set("codigo")(e.target.value)} placeholder="P-001" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="kind">Tipo</Label>
                  <select id="kind" className={selectCls} value={form.kind} onChange={(e) => set("kind")(e.target.value)}>
                    <option value="ESTANDAR">Estándar</option>
                    <option value="SERVICIO">Servicio</option>
                    <option value="PAQUETE">Paquete</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" value={form.nombre} onChange={(e) => set("nombre")(e.target.value)} placeholder="Café americano" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="descripcion">Descripción <span className="text-muted-foreground">(opcional)</span></Label>
                <Input id="descripcion" value={form.descripcion} onChange={(e) => set("descripcion")(e.target.value)} />
              </div>

              <div className="rounded-xl border p-3">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Variante principal</p>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="sku">SKU</Label>
                      <Input id="sku" value={form.sku} onChange={(e) => set("sku")(e.target.value)} placeholder="CAF-AM" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="cost">Costo <span className="text-muted-foreground">(opc.)</span></Label>
                      <Input id="cost" inputMode="decimal" value={form.cost} onChange={(e) => set("cost")(e.target.value.replace(/[^\d.]/g, ""))} placeholder="0.00" />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="varianteNombre">Nombre de la variante</Label>
                    <Input id="varianteNombre" value={form.varianteNombre} onChange={(e) => set("varianteNombre")(e.target.value)} placeholder="Café americano 12oz" />
                  </div>

                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="unidad">Unidad de medida</Label>
                      <button type="button" className="text-xs text-primary hover:underline" onClick={() => setNuevaUnidad((v) => !v)}>
                        + Nueva unidad
                      </button>
                    </div>
                    <select id="unidad" className={selectCls} value={form.unidadMedidaId} onChange={(e) => set("unidadMedidaId")(e.target.value)}>
                      <option value="">Selecciona…</option>
                      {unidades.data?.map((u) => (
                        <option key={u.id} value={u.id}>{u.nombre} ({u.symbol})</option>
                      ))}
                    </select>
                    {sinUnidades && !nuevaUnidad ? (
                      <p className="text-xs text-muted-foreground">No hay unidades. Crea una con &quot;+ Nueva unidad&quot;.</p>
                    ) : null}
                  </div>

                  {nuevaUnidad ? (
                    <div className="grid gap-3 rounded-xl bg-muted/40 p-3">
                      {mUnidad.error ? (
                        <p className="text-xs text-destructive">{(mUnidad.error as ApiError).message}</p>
                      ) : null}
                      <div className="grid grid-cols-2 gap-3">
                        <Input placeholder="Código (UND)" value={uForm.codigo} onChange={(e) => setU("codigo")(e.target.value)} />
                        <Input placeholder="Símbolo (u)" value={uForm.symbol} onChange={(e) => setU("symbol")(e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Input placeholder="Nombre (Unidad)" value={uForm.nombre} onChange={(e) => setU("nombre")(e.target.value)} />
                        <Input placeholder="SUNAT (NIU)" maxLength={3} value={uForm.sunatCode} onChange={(e) => setU("sunatCode")(e.target.value.toUpperCase())} />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={!uForm.codigo || !uForm.nombre || !uForm.symbol || uForm.sunatCode.length !== 3 || mUnidad.isPending}
                        onClick={() => mUnidad.mutate({ codigo: uForm.codigo.trim(), nombre: uForm.nombre.trim(), symbol: uForm.symbol.trim(), sunatCode: uForm.sunatCode })}
                      >
                        {mUnidad.isPending ? "Creando…" : "Crear unidad"}
                      </Button>
                    </div>
                  ) : null}

                  <div className="grid gap-2">
                    <Label htmlFor="impuesto">Impuesto <span className="text-muted-foreground">(opcional)</span></Label>
                    <select id="impuesto" className={selectCls} value={form.impuestoId} onChange={(e) => set("impuestoId")(e.target.value)}>
                      <option value="">Sin impuesto</option>
                      {impuestos.data?.map((t) => (
                        <option key={t.id} value={t.id}>{t.nombre} ({t.codigo})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <SheetFooter className="flex-row justify-end gap-2 border-t">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={!valido || mProducto.isPending}>
              {mProducto.isPending ? "Guardando…" : "Guardar producto"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
