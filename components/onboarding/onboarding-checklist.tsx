"use client"

import { useRouter } from "next/navigation"
import { RiCloseLine, RiFlagLine } from "@remixicon/react"

import { Button } from "@/components/ui/button"
import { marcarGuideIntent } from "@/components/onboarding/onboarding-guide"
import { useOnboardingProgress } from "@/hooks/use-onboarding-progress"
import { tituloDeFlujo } from "@/lib/onboarding/flows"

/**
 * Banda slim de bienvenida en el dashboard: una sola línea con el paso
 * activo y su CTA. La guía detallada vive en el widget flotante
 * (OnboardingGuide); esta banda solo reengancha al entrar al dashboard y
 * usa el MISMO mecanismo guide-intent para señalar el botón en destino.
 */
export function OnboardingChecklist() {
  const router = useRouter()
  const {
    flujoActivo,
    pasoActivo,
    progresoTotal,
    descartarFlujo,
    mutando,
    isLoading,
    isError,
  } = useOnboardingProgress()

  if (isLoading || isError) return null
  if (!flujoActivo || !pasoActivo) return null

  const cfg = pasoActivo.config
  const Icono = cfg?.icono ?? RiFlagLine
  const tituloFlujo = tituloDeFlujo(flujoActivo.flowKey) ?? flujoActivo.titulo

  const irAlPaso = () => {
    marcarGuideIntent(pasoActivo.flowKey, pasoActivo.stepKey)
    // La vista del backend manda (dinámica según tipo de negocio).
    router.push(pasoActivo.vista ?? cfg?.vista ?? "/dashboard")
  }

  return (
    <section className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-card px-4 py-3 shadow-sm">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icono className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {cfg?.titulo ?? pasoActivo.stepKey}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {tituloFlujo} · {progresoTotal.completados} de {progresoTotal.total}{" "}
          pasos completados
        </p>
      </div>
      <Button size="sm" onClick={irAlPaso}>
        {cfg?.cta ?? "Continuar"}
      </Button>
      <button
        type="button"
        aria-label={`Descartar la guía "${tituloFlujo}"`}
        onClick={() => descartarFlujo(flujoActivo.flowKey)}
        disabled={mutando}
        className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
      >
        <RiCloseLine className="size-4" />
      </button>
    </section>
  )
}
