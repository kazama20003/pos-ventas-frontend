"use client"

import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  RiPriceTag3Line,
  RiSafe2Line,
  RiShoppingCart2Line,
  RiTruckLine,
  type RemixiconComponentType,
} from "@remixicon/react"

import { Button } from "@/components/ui/button"
import {
  descartarOnboarding,
  obtenerEstadoOnboarding,
} from "@/lib/api/onboarding"
import type { PasoOnboarding } from "@/lib/api/types"

type FocoPaso = Exclude<PasoOnboarding, "completado">

type Foco = {
  icon: RemixiconComponentType
  titulo: string
  sub: string
  cta: string
  href: string
}

const FOCOS: Record<FocoPaso, Foco> = {
  producto: {
    icon: RiPriceTag3Line,
    titulo: "Crea tu primer producto",
    sub: "Un producto o un servicio para empezar a vender.",
    cta: "Crear producto",
    href: "/productos/nuevo",
  },
  stock: {
    icon: RiTruckLine,
    titulo: "Dale stock a tu producto",
    sub: "Registra a tu proveedor y una compra para tener inventario.",
    cta: "Registrar compra",
    href: "/compras",
  },
  caja: {
    icon: RiSafe2Line,
    titulo: "Abre tu caja",
    sub: "Inicia el turno con tu fondo para poder cobrar.",
    cta: "Abrir caja",
    href: "/caja",
  },
  venta: {
    icon: RiShoppingCart2Line,
    titulo: "Haz tu primera venta",
    sub: "Elige productos, cobra y listo.",
    cta: "Ir a vender",
    href: "/ventas",
  },
}

const ORDEN_BASE: FocoPaso[] = ["producto", "stock", "caja", "venta"]

export function FirstSaleChecklist() {
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ["onboarding-estado"],
    queryFn: obtenerEstadoOnboarding,
    refetchOnWindowFocus: true,
  })

  const descartar = useMutation({
    mutationFn: descartarOnboarding,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["onboarding-estado"] }),
  })

  if (isLoading || isError || !data) return null
  if (data.descartado) return null

  const completado =
    data.pasoActual === "completado" || data.completadoEn !== null

  // Estado de felicitación: primera venta lograda.
  if (completado) {
    return (
      <section className="rounded-2xl border border-primary/30 bg-primary/5 p-5 shadow-sm md:p-6">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <RiShoppingCart2Line className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold sm:text-xl">
              ¡Listo! Hiciste tu primera venta 🎉
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tu punto de venta está en marcha.
            </p>
            <Button
              size="lg"
              className="mt-4"
              disabled={descartar.isPending}
              onClick={() => descartar.mutate()}
            >
              Entendido
            </Button>
          </div>
        </div>
      </section>
    )
  }

  // Orden de segmentos: excluye "stock" cuando no se necesita (servicios).
  const orden = data.pasos.necesitaStock
    ? ORDEN_BASE
    : ORDEN_BASE.filter((p) => p !== "stock")

  const pasoActual = data.pasoActual as FocoPaso
  const foco = FOCOS[pasoActual]
  const activeIndex = Math.max(0, orden.indexOf(pasoActual))
  const Icono = foco.icon

  return (
    <section className="relative rounded-2xl border border-primary/30 bg-primary/5 p-5 shadow-sm ring-1 ring-primary/10 md:p-6">
      <button
        type="button"
        onClick={() => descartar.mutate()}
        disabled={descartar.isPending}
        className="absolute right-4 top-4 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
      >
        Ahora no
      </button>

      <div className="flex items-start gap-4 pr-16">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground sm:size-14">
          <Icono className="size-6 sm:size-7" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold sm:text-xl">{foco.titulo}</h2>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {foco.sub}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <Button
          size="lg"
          className="w-full sm:w-auto"
          render={<Link href={foco.href} />}
        >
          {foco.cta}
        </Button>
      </div>

      <div className="mt-5">
        <div
          className="flex gap-1.5"
          role="progressbar"
          aria-label={`Paso ${activeIndex + 1} de ${orden.length}`}
          aria-valuemin={1}
          aria-valuemax={orden.length}
          aria-valuenow={activeIndex + 1}
        >
          {orden.map((paso, index) => (
            <span
              key={paso}
              className={
                index < activeIndex
                  ? "h-1.5 flex-1 rounded-full bg-primary"
                  : index === activeIndex
                    ? "h-1.5 flex-1 rounded-full bg-primary/60 ring-2 ring-primary/40"
                    : "h-1.5 flex-1 rounded-full bg-muted"
              }
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Paso {activeIndex + 1} de {orden.length}
        </p>
      </div>
    </section>
  )
}
