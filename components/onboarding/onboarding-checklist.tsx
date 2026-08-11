"use client"

import Link from "next/link"
import { RiCloseLine, RiFlagLine } from "@remixicon/react"

import { Button } from "@/components/ui/button"
import { useOnboardingProgress } from "@/hooks/use-onboarding-progress"
import { tituloDeFlujo } from "@/lib/onboarding/flows"

/**
 * Tarjeta compacta de onboarding para el dashboard: muestra SOLO el paso
 * activo del flujo en curso, con barra de progreso segmentada. Omitible y
 * descartable; desaparece sola cuando todo está completado o descartado.
 */
export function OnboardingChecklist() {
  const {
    flujoActivo,
    pasoActivo,
    omitirPaso,
    descartarFlujo,
    mutando,
    isLoading,
    isError,
  } = useOnboardingProgress()

  if (isLoading || isError) return null
  if (!flujoActivo || !pasoActivo) return null

  const visibles = flujoActivo.pasos.filter((p) => p.status !== "DESCARTADO")
  const activeIndex = Math.max(
    0,
    visibles.findIndex((p) => p.stepKey === pasoActivo.stepKey),
  )

  const cfg = pasoActivo.config
  const Icono = cfg?.icono ?? RiFlagLine
  const titulo = cfg?.titulo ?? pasoActivo.stepKey
  const descripcion = cfg?.descripcion ?? ""
  const href = cfg?.vista ?? pasoActivo.vista
  const cta = cfg?.cta ?? "Continuar"
  const tituloFlujo = tituloDeFlujo(flujoActivo.flowKey) ?? flujoActivo.titulo

  return (
    <section className="relative rounded-2xl border border-primary/30 bg-card p-5 shadow-sm ring-1 ring-primary/10 md:p-6">
      <button
        type="button"
        aria-label={`Descartar la guía "${tituloFlujo}"`}
        onClick={() => descartarFlujo(flujoActivo.flowKey)}
        disabled={mutando}
        className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
      >
        <RiCloseLine className="size-4" />
      </button>

      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {tituloFlujo}
      </p>

      <div className="mt-3 flex items-start gap-4 rounded-xl p-1 pr-10 ring-2 ring-primary/20">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Icono className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold sm:text-lg">{titulo}</h2>
          {descripcion ? (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {descripcion}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button render={<Link href={href} />}>{cta}</Button>
        <button
          type="button"
          onClick={() => omitirPaso(flujoActivo.flowKey, pasoActivo.stepKey)}
          disabled={mutando}
          className="text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline disabled:opacity-50"
        >
          Omitir este paso
        </button>
      </div>

      <div className="mt-5">
        <div
          className="flex gap-1.5"
          role="progressbar"
          aria-label={`Paso ${activeIndex + 1} de ${visibles.length}`}
          aria-valuemin={1}
          aria-valuemax={visibles.length}
          aria-valuenow={activeIndex + 1}
        >
          {visibles.map((paso, index) => (
            <span
              key={paso.stepKey}
              className={
                paso.status === "COMPLETADO" || paso.status === "OMITIDO"
                  ? "h-1.5 flex-1 rounded-full bg-primary"
                  : index === activeIndex
                    ? "h-1.5 flex-1 rounded-full bg-primary/60 ring-2 ring-primary/40"
                    : "h-1.5 flex-1 rounded-full bg-muted"
              }
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Paso {activeIndex + 1} de {visibles.length}
        </p>
      </div>
    </section>
  )
}
