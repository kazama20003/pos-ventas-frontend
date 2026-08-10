"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import {
  RiCheckboxCircleLine,
  RiCircleLine,
  RiRocketLine,
  RiStore2Line,
} from "@remixicon/react"

import { Button } from "@/components/ui/button"
import { listarProductos } from "@/lib/api/catalogo"
import { sesionAbierta } from "@/lib/api/caja"
import { listarAlmacenes, listarSucursales } from "@/lib/api/organizacion"
import { listarVentas } from "@/lib/api/ventas"

type Step = {
  label: string
  description: string
  href: string
  action: string
  complete: boolean
}

export function FirstSaleChecklist() {
  const sucursales = useQuery({
    queryKey: ["onboarding-sucursales"],
    queryFn: listarSucursales,
  })
  const sucursalId = sucursales.data?.[0]?.id
  const almacenes = useQuery({
    queryKey: ["onboarding-almacenes", sucursalId],
    queryFn: () => listarAlmacenes(sucursalId),
    enabled: !!sucursalId,
  })
  const productos = useQuery({
    queryKey: ["onboarding-productos"],
    queryFn: () => listarProductos({ pageSize: 1 }),
  })
  const caja = useQuery({
    queryKey: ["onboarding-caja", sucursalId],
    queryFn: () => sesionAbierta(sucursalId!),
    enabled: !!sucursalId,
  })
  const ventas = useQuery({
    queryKey: ["onboarding-ventas", sucursalId],
    queryFn: () => listarVentas({ sucursalId: sucursalId!, pageSize: 1 }),
    enabled: !!sucursalId,
  })

  const loading = sucursales.isLoading || productos.isLoading
  if (loading) return null

  const operacionLista =
    (sucursales.data?.length ?? 0) > 0 && (almacenes.data?.length ?? 0) > 0
  const steps: Step[] = [
    {
      label: "Tu operación está lista",
      description: "Creamos una sucursal y un almacén principal para que empieces sin configurar lo básico.",
      href: "/sucursales",
      action: "Ver operación",
      complete: operacionLista,
    },
    {
      label: "Agrega tu primer producto",
      description: "Registra el producto, su precio de venta y el stock inicial.",
      href: "/productos/nuevo",
      action: "Agregar producto",
      complete: (productos.data?.total ?? 0) > 0,
    },
    {
      label: "Abre tu caja",
      description: "Inicia el turno con el fondo de caja antes de cobrar.",
      href: "/caja",
      action: "Abrir caja",
      complete: !!caja.data,
    },
    {
      label: "Realiza tu primera venta",
      description: "Busca un producto, elige el pago y confirma el cobro.",
      href: "/ventas",
      action: "Ir a ventas",
      complete: (ventas.data?.total ?? 0) > 0,
    },
  ]
  const completed = steps.filter((step) => step.complete).length

  if (completed === steps.length) return null

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <RiRocketLine className="size-5" />
          </span>
          <div>
            <h2 className="font-semibold">Empieza a vender</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Completa estos pasos. Te guiaremos hasta registrar tu primera venta.
            </p>
          </div>
        </div>
        <span className="shrink-0 text-sm font-medium text-muted-foreground">
          {completed} de {steps.length} completados
        </span>
      </div>

      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500"
          style={{ width: `${(completed / steps.length) * 100}%` }}
        />
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {steps.map((step) => (
          <div
            key={step.label}
            className="flex items-center gap-3 rounded-xl border bg-background p-3.5"
          >
            {step.complete ? (
              <RiCheckboxCircleLine className="size-5 shrink-0 text-emerald-500" />
            ) : (
              <RiCircleLine className="size-5 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{step.label}</p>
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                {step.description}
              </p>
            </div>
            {!step.complete ? (
              <Button
                render={<Link href={step.href} />}
                size="sm"
                variant="outline"
                className="shrink-0"
              >
                {step.action}
              </Button>
            ) : null}
          </div>
        ))}
      </div>

      {!operacionLista ? (
        <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <RiStore2Line className="size-4" />
          Aún falta una sucursal o almacén. Puedes configurarlos desde Operación.
        </p>
      ) : null}
    </section>
  )
}
