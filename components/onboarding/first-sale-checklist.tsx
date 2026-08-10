"use client"

import * as React from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import {
  RiCheckboxCircleFill,
  RiCloseLine,
  RiLockLine,
  RiRocketLine,
} from "@remixicon/react"

import { Button } from "@/components/ui/button"
import { listarProductos } from "@/lib/api/catalogo"
import { sesionAbierta } from "@/lib/api/caja"
import { listarAlmacenes, listarSucursales } from "@/lib/api/organizacion"
import { listarVentas } from "@/lib/api/ventas"

const DONE_KEY = "gekko.onboarding.done"

type Step = {
  label: string
  description: string
  href: string
  action: string
  complete: boolean
}

export function FirstSaleChecklist() {
  const [descartado, setDescartado] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === "undefined") return
    if (localStorage.getItem(DONE_KEY) === "1") setDescartado(true)
  }, [])

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
  if (loading || descartado) return null

  const operacionLista =
    (sucursales.data?.length ?? 0) > 0 && (almacenes.data?.length ?? 0) > 0
  const steps: Step[] = [
    {
      label: "Tu operación está lista",
      description:
        "Creamos tu sucursal, almacén y caja principal para que empieces sin configurar lo básico.",
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
  // Índice del primer paso incompleto = paso "activo" que resaltamos.
  const activeIndex = steps.findIndex((step) => !step.complete)
  const todoListo = activeIndex === -1

  function descartar() {
    if (typeof window !== "undefined") localStorage.setItem(DONE_KEY, "1")
    setDescartado(true)
  }

  if (todoListo) {
    return (
      <section className="relative rounded-2xl border bg-card p-5 shadow-sm md:p-6">
        <button
          type="button"
          onClick={descartar}
          aria-label="Descartar guía"
          className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <RiCloseLine className="size-4" />
        </button>
        <div className="flex gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
            <RiCheckboxCircleFill className="size-5" />
          </span>
          <div>
            <h2 className="font-semibold">
              ¡Listo! Ya hiciste tu primera venta 🎉
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tu punto de venta está en marcha. Puedes cerrar esta guía.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={descartar}
        >
          Entendido
        </Button>
      </section>
    )
  }

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
              Sigue estos pasos en orden. Te guiaremos hasta tu primera venta.
            </p>
          </div>
        </div>
        <span className="shrink-0 text-sm font-medium text-muted-foreground">
          {completed} de {steps.length}
        </span>
      </div>

      <div
        className="mt-5 h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={steps.length}
        aria-valuenow={completed}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500"
          style={{ width: `${(completed / steps.length) * 100}%` }}
        />
      </div>

      <ol className="mt-5 flex flex-col gap-3">
        {steps.map((step, index) => {
          const activo = index === activeIndex
          const futuro = activeIndex !== -1 && index > activeIndex
          return (
            <li
              key={step.label}
              aria-current={activo ? "step" : undefined}
              className={
                activo
                  ? "flex items-start gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4 ring-1 ring-primary/30"
                  : futuro
                    ? "flex items-center gap-3 rounded-xl border bg-background p-3 opacity-60"
                    : "flex items-center gap-3 rounded-xl border bg-background p-3"
              }
            >
              <StepIcon
                index={index}
                complete={step.complete}
                activo={activo}
                futuro={futuro}
              />
              <div className="min-w-0 flex-1">
                <p
                  className={
                    step.complete
                      ? "text-sm font-medium text-muted-foreground"
                      : activo
                        ? "font-semibold"
                        : "text-sm font-medium"
                  }
                >
                  {step.label}
                </p>
                {activo ? (
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    {step.description}
                  </p>
                ) : null}
              </div>
              {activo ? (
                <Button
                  render={<Link href={step.href} />}
                  className="shrink-0"
                >
                  {step.action}
                </Button>
              ) : futuro ? (
                <RiLockLine
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
              ) : null}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function StepIcon({
  index,
  complete,
  activo,
  futuro,
}: {
  index: number
  complete: boolean
  activo: boolean
  futuro: boolean
}) {
  if (complete) {
    return (
      <RiCheckboxCircleFill className="size-6 shrink-0 text-emerald-500" />
    )
  }
  return (
    <span
      className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
        activo
          ? "bg-primary text-primary-foreground"
          : futuro
            ? "bg-muted text-muted-foreground"
            : "bg-muted text-muted-foreground"
      }`}
    >
      {index + 1}
    </span>
  )
}
