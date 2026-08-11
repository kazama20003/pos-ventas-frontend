"use client"

import * as React from "react"
import { driver } from "driver.js"
import "driver.js/dist/driver.css"

import { useOnboardingProgress } from "@/hooks/use-onboarding-progress"

/**
 * Coach-mark contextual de UN solo paso (driver.js). Se muestra únicamente si:
 * - el paso del flujo está PENDIENTE (según el backend),
 * - el selector existe en el DOM,
 * - no se mostró ya en esta sesión (flag en sessionStorage),
 * O SIEMPRE si el usuario llegó desde la guía flotante
 * (sessionStorage["guide-intent"] === "flowKey:stepKey"), aunque ya se haya
 * visto: el intent se consume al mostrarse.
 * Nunca bloquea: overlay clickable, cerrable con Esc o "Entendido".
 */
export function ContextualTour({
  flowKey,
  stepKey,
  selector,
  titulo,
  descripcion,
}: {
  flowKey: string
  stepKey: string
  selector: string
  titulo: string
  descripcion: string
}) {
  const { data } = useOnboardingProgress()

  const pendiente = React.useMemo(() => {
    const flujo = data?.flujos.find((f) => f.flowKey === flowKey)
    if (!flujo || flujo.descartado || flujo.completado) return false
    const paso = flujo.pasos.find((p) => p.stepKey === stepKey)
    return paso?.status === "PENDIENTE"
  }, [data, flowKey, stepKey])

  React.useEffect(() => {
    if (!pendiente) return

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

    // Espera breve a que el elemento exista (render asíncrono de la vista).
    let intentos = 0
    let d: ReturnType<typeof driver> | null = null
    const timer = setInterval(() => {
      intentos += 1
      const el = document.querySelector(selector)
      if (!el) {
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
      d = driver({
        allowClose: true,
        overlayClickBehavior: "close",
        overlayOpacity: 0.4,
        stagePadding: 4,
        showButtons: ["next", "close"],
        nextBtnText: "Entendido",
        onNextClick: () => d?.destroy(),
        steps: [
          {
            element: selector,
            popover: { title: titulo, description: descripcion },
          },
        ],
      })
      d.drive()
    }, 300)

    return () => {
      clearInterval(timer)
      d?.destroy()
    }
  }, [pendiente, flowKey, stepKey, selector, titulo, descripcion])

  return null
}
