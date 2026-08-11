"use client"

import * as React from "react"
import { driver } from "driver.js"
import "driver.js/dist/driver.css"

import { useOnboardingProgress } from "@/hooks/use-onboarding-progress"

export type PasoTour = {
  selector: string
  titulo: string
  descripcion: string
}

/**
 * Coach-mark contextual (driver.js). Soporta un solo elemento (selector/
 * titulo/descripcion) o un mini-tour de varios pasos (`pasos`) que recorre
 * los campos de un formulario en orden. Se muestra únicamente si:
 * - el paso del flujo está PENDIENTE (según el backend),
 * - al menos un selector existe en el DOM,
 * - no se mostró ya en esta sesión (flag en sessionStorage),
 * O SIEMPRE si el usuario llegó desde la guía flotante
 * (sessionStorage["guide-intent"] === "flowKey:stepKey"), aunque ya se haya
 * visto: el intent se consume al mostrarse.
 * Nunca bloquea: overlay clickable, cerrable con Esc o los botones.
 */
export function ContextualTour({
  flowKey,
  stepKey,
  selector,
  titulo,
  descripcion,
  pasos,
}: {
  flowKey: string
  stepKey: string
  selector?: string
  titulo?: string
  descripcion?: string
  /** Mini-tour multi-paso; si viene, ignora selector/titulo/descripcion. */
  pasos?: PasoTour[]
}) {
  const { data } = useOnboardingProgress()

  const pendiente = React.useMemo(() => {
    const flujo = data?.flujos.find((f) => f.flowKey === flowKey)
    if (!flujo || flujo.descartado || flujo.completado) return false
    const paso = flujo.pasos.find((p) => p.stepKey === stepKey)
    return paso?.status === "PENDIENTE"
  }, [data, flowKey, stepKey])

  // Normaliza: single → lista de un paso.
  const lista = React.useMemo<PasoTour[]>(() => {
    if (pasos && pasos.length > 0) return pasos
    if (selector && titulo)
      return [{ selector, titulo, descripcion: descripcion ?? "" }]
    return []
  }, [pasos, selector, titulo, descripcion])

  React.useEffect(() => {
    if (!pendiente || lista.length === 0) return

    const flag = `tour:${flowKey}:${stepKey}`
    // Intent desde la guía flotante: fuerza el coach-mark aunque ya se haya
    // visto en esta sesión, y consume el flag al mostrarse.
    let forzado = false
    try {
      forzado = sessionStorage.getItem("guide-intent") === `${flowKey}:${stepKey}`
      if (!forzado && sessionStorage.getItem(flag)) return
    } catch {
      return
    }

    // Espera breve a que los elementos existan (render asíncrono de la vista).
    let intentos = 0
    let d: ReturnType<typeof driver> | null = null
    const timer = setInterval(() => {
      intentos += 1
      // Solo recorre los pasos cuyo selector realmente existe.
      const visibles = lista.filter((p) => document.querySelector(p.selector))
      if (visibles.length === 0) {
        if (intentos >= 10) clearInterval(timer)
        return
      }
      clearInterval(timer)
      try {
        sessionStorage.setItem(flag, "1")
        if (forzado) sessionStorage.removeItem("guide-intent")
      } catch {
        /* sin storage: igual mostramos una vez */
      }
      const ultimo = visibles.length - 1
      d = driver({
        allowClose: true,
        overlayClickBehavior: "close",
        overlayOpacity: 0.4,
        stagePadding: 4,
        showProgress: visibles.length > 1,
        progressText: "{{current}} de {{total}}",
        showButtons:
          visibles.length > 1 ? ["next", "previous", "close"] : ["next", "close"],
        nextBtnText: "Siguiente",
        prevBtnText: "Atrás",
        doneBtnText: "Entendido",
        onNextClick: () => {
          if (!d) return
          if (d.isLastStep()) d.destroy()
          else d.moveNext()
        },
        steps: visibles.map((p, i) => ({
          element: p.selector,
          popover: {
            title: p.titulo,
            description: p.descripcion,
            ...(i === ultimo && visibles.length > 1
              ? { nextBtnText: "Entendido" }
              : {}),
          },
        })),
      })
      d.drive()
    }, 300)

    return () => {
      clearInterval(timer)
      d?.destroy()
    }
  }, [pendiente, flowKey, stepKey, lista])

  return null
}
