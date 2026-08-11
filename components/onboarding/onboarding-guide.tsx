"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  RiArrowRightLine,
  RiCheckLine,
  RiCheckboxCircleFill,
  RiCloseLine,
  RiRocket2Line,
} from "@remixicon/react"

import { Button } from "@/components/ui/button"
import { useOnboardingProgress, type PasoActivo } from "@/hooks/use-onboarding-progress"
import { tituloDeFlujo } from "@/lib/onboarding/flows"
import { cn } from "@/lib/utils"

/**
 * Guarda la intención de guiado para que la vista destino muestre el
 * coach-mark (ContextualTour) aunque ya se haya visto en la sesión.
 */
export function marcarGuideIntent(flowKey: string, stepKey: string) {
  try {
    sessionStorage.setItem("guide-intent", `${flowKey}:${stepKey}`)
  } catch {
    /* sin storage: el tour caerá en su condición normal */
  }
}

type Celebracion =
  | { tipo: "paso"; tituloPaso: string }
  | { tipo: "final" }

/**
 * Guía flotante persistente de onboarding (patrón Intercom/Linear/Notion).
 * Vive en todas las vistas: botón flotante con anillo de progreso que se
 * expande a un panel con el paso activo. Detecta cuando un paso se completa
 * (poll + invalidación por ruta) y celebra proponiendo el siguiente paso.
 * Es un widget: nunca bloquea la interfaz.
 */
export function OnboardingGuide() {
  const router = useRouter()
  const pathname = usePathname()
  const {
    data,
    isLoading,
    isError,
    flujoActivo,
    pasoActivo,
    progresoTotal,
    todoTerminado,
    todosLosFlujos,
    omitirPaso,
    descartarFlujo,
    mutando,
    invalidar,
  } = useOnboardingProgress()

  const [abierto, setAbierto] = React.useState(false)
  const [celebracion, setCelebracion] = React.useState<Celebracion | null>(null)
  // Confirmaciones de omitir: que saltarse un paso (o toda la guía) sea una
  // decisión explícita, no un click accidental.
  const [confirmar, setConfirmar] = React.useState<"paso" | "todo" | null>(null)

  // Al cambiar de ruta, revalida el estado (el usuario pudo completar algo).
  React.useEffect(() => {
    invalidar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Bienvenida: la primera vez que el usuario aterriza en el dashboard con
  // pasos pendientes (recién registrado), la guía se presenta sola en vez de
  // quedar como un botón flotante que pasa desapercibido. Solo una vez.
  const [bienvenida, setBienvenida] = React.useState(false)
  React.useEffect(() => {
    if (
      pathname === "/dashboard" &&
      pasoActivo &&
      typeof window !== "undefined" &&
      !sessionStorage.getItem("gekko.guide.welcomed")
    ) {
      sessionStorage.setItem("gekko.guide.welcomed", "1")
      setBienvenida(true)
      setAbierto(true)
    }
  }, [pathname, pasoActivo])

  // Continuidad: detecta que el paso que estaba activo pasó a COMPLETADO.
  const prevRef = React.useRef<{ key: string; titulo: string } | null>(null)
  React.useEffect(() => {
    if (!data) return
    const prev = prevRef.current
    if (prev) {
      const [pFlow, pStep] = prev.key.split(":")
      const flujo = data.flujos.find((f) => f.flowKey === pFlow)
      const paso = flujo?.pasos.find((p) => p.stepKey === pStep)
      const cambioDeActivo =
        !pasoActivo || `${pasoActivo.flowKey}:${pasoActivo.stepKey}` !== prev.key
      if (paso?.status === "COMPLETADO" && cambioDeActivo) {
        const quedanPasos = data.flujos.some(
          (f) => !f.completado && !f.descartado && f.pasoActivo,
        )
        setCelebracion(
          quedanPasos ? { tipo: "paso", tituloPaso: prev.titulo } : { tipo: "final" },
        )
        setAbierto(true)
      }
    }
    prevRef.current = pasoActivo
      ? {
          key: `${pasoActivo.flowKey}:${pasoActivo.stepKey}`,
          titulo: pasoActivo.config?.titulo ?? pasoActivo.stepKey,
        }
      : null
  }, [data, pasoActivo])

  if (isLoading || isError) return null
  // Sin nada que guiar y sin celebración pendiente: no renderiza nada.
  if (todoTerminado && !celebracion) return null

  const irAlPaso = (paso: PasoActivo) => {
    marcarGuideIntent(paso.flowKey, paso.stepKey)
    setCelebracion(null)
    setConfirmar(null)
    setAbierto(false)
    // La vista del backend manda: es dinámica según el tipo de negocio
    // (p. ej. "vender" lleva al salón si el tenant es restaurante).
    router.push(paso.vista ?? paso.config?.vista ?? "/dashboard")
  }

  const terminar = () => {
    for (const f of todosLosFlujos) {
      if (!f.completado && !f.descartado) descartarFlujo(f.flowKey)
    }
    setCelebracion(null)
    setConfirmar(null)
    setAbierto(false)
  }

  const pct =
    progresoTotal.total > 0
      ? progresoTotal.completados / progresoTotal.total
      : 0

  /* ------------------------------ colapsado ------------------------------ */
  if (!abierto) {
    const R = 22
    const C = 2 * Math.PI * R
    return (
      <button
        type="button"
        aria-label={`Abrir guía de configuración (${progresoTotal.completados} de ${progresoTotal.total} pasos completados)`}
        onClick={() => setAbierto(true)}
        className="fixed bottom-5 right-5 z-50 flex size-14 items-center justify-center rounded-full bg-card shadow-xl ring-1 ring-border transition-transform hover:scale-105"
      >
        {pasoActivo ? (
          <span
            aria-hidden
            className="absolute inset-0 -z-10 animate-pulse rounded-full bg-primary/25"
          />
        ) : null}
        <svg
          aria-hidden
          viewBox="0 0 52 52"
          className="absolute inset-0 size-full -rotate-90"
        >
          <circle
            cx="26"
            cy="26"
            r={R}
            fill="none"
            strokeWidth="4"
            className="stroke-muted"
          />
          <circle
            cx="26"
            cy="26"
            r={R}
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct)}
            className="stroke-primary transition-[stroke-dashoffset] duration-500"
          />
        </svg>
        <RiRocket2Line className="size-6 text-primary" />
      </button>
    )
  }

  /* ------------------------------ expandido ------------------------------ */
  const tituloFlujo = flujoActivo
    ? (tituloDeFlujo(flujoActivo.flowKey) ?? flujoActivo.titulo)
    : "Guía"
  const visibles =
    flujoActivo?.pasos.filter((p) => p.status !== "DESCARTADO") ?? []
  const completadosFlujo = visibles.filter(
    (p) => p.status === "COMPLETADO" || p.status === "OMITIDO",
  ).length

  return (
    <div
      role="dialog"
      aria-label="Guía de configuración"
      className="fixed bottom-5 right-5 z-50 w-80 rounded-2xl border bg-card text-card-foreground shadow-xl sm:w-96"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b p-4 pb-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {celebracion?.tipo === "final"
              ? "¡Tu negocio está en marcha! 🚀"
              : tituloFlujo}
          </p>
          {celebracion?.tipo !== "final" && flujoActivo ? (
            <p className="text-xs text-muted-foreground">
              {completadosFlujo} de {visibles.length} pasos
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {flujoActivo ? (
            <button
              type="button"
              onClick={() => descartarFlujo(flujoActivo.flowKey)}
              disabled={mutando}
              className="rounded-md px-1.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              No mostrar más
            </button>
          ) : null}
          <button
            type="button"
            aria-label="Cerrar guía"
            onClick={() => {
              setCelebracion(null)
              setAbierto(false)
            }}
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <RiCloseLine className="size-4" />
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* Celebración final */}
        {celebracion?.tipo === "final" ? (
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <RiCheckLine className="size-8" />
            </span>
            <p className="text-sm text-muted-foreground">
              Completaste toda la configuración inicial. ¡A vender!
            </p>
            <Button onClick={terminar} disabled={mutando}>
              Terminar
            </Button>
          </div>
        ) : (
          <>
            {/* Bienvenida: primera llegada al dashboard tras registrarse */}
            {bienvenida && !celebracion ? (
              <div className="mb-3 rounded-xl bg-primary/10 p-3">
                <p className="text-sm font-semibold text-primary">
                  ¡Tu espacio está listo! 🎉
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Te guiamos paso a paso hasta tu primera venta. Empieza aquí:
                </p>
              </div>
            ) : null}

            {/* Celebración de paso completado */}
            {celebracion?.tipo === "paso" ? (
              <div className="mb-3 flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
                <RiCheckboxCircleFill className="size-6 shrink-0" />
                <p className="text-sm font-medium">
                  ¡{celebracion.tituloPaso} listo! 🎉
                </p>
              </div>
            ) : null}

            {/* Tarjeta del paso activo */}
            {pasoActivo ? (
              <div className="rounded-xl border bg-background p-3">
                <div className="flex items-start gap-3">
                  {pasoActivo.config?.icono ? (
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <pasoActivo.config.icono className="size-5" />
                    </span>
                  ) : null}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {pasoActivo.config?.titulo ?? pasoActivo.stepKey}
                    </p>
                    {pasoActivo.config?.descripcion ? (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {pasoActivo.config.descripcion}
                      </p>
                    ) : null}
                  </div>
                </div>
                {confirmar === "paso" ? (
                  // Omitir con confirmación: que sea una decisión, no un
                  // click accidental a mitad de formulario.
                  <div className="mt-3 rounded-lg bg-muted/60 p-2.5">
                    <p className="text-xs text-muted-foreground">
                      ¿Saltar este paso sin hacerlo? Podrás retomarlo cuando
                      quieras desde esta guía.
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={mutando}
                        onClick={() => {
                          omitirPaso(pasoActivo.flowKey, pasoActivo.stepKey)
                          setConfirmar(null)
                        }}
                      >
                        Sí, omitir
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirmar(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-3">
                    <Button size="sm" onClick={() => irAlPaso(pasoActivo)}>
                      {celebracion ? "Continuar" : "Hacerlo ahora"}
                      <RiArrowRightLine data-icon="inline-end" />
                    </Button>
                    <button
                      type="button"
                      onClick={() => setConfirmar("paso")}
                      disabled={mutando}
                      className="text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline disabled:opacity-50"
                    >
                      Omitir
                    </button>
                  </div>
                )}
              </div>
            ) : null}

            {/* Mini-mapa de pasos del flujo activo */}
            {visibles.length > 0 ? (
              <div
                className="mt-3 flex items-center justify-center gap-2"
                aria-label={`Progreso: ${completadosFlujo} de ${visibles.length} pasos completados`}
              >
                {visibles.map((p) => {
                  const done = p.status === "COMPLETADO" || p.status === "OMITIDO"
                  const activo = p.stepKey === pasoActivo?.stepKey
                  return (
                    <span
                      key={p.stepKey}
                      title={p.stepKey}
                      className={cn(
                        "flex items-center justify-center rounded-full",
                        done
                          ? "size-4 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : activo
                            ? "size-2.5 bg-primary"
                            : "size-2 bg-muted-foreground/30",
                      )}
                    >
                      {done ? <RiCheckLine className="size-3" /> : null}
                    </span>
                  )
                })}
              </div>
            ) : null}

            {/* Salida para quien ya conoce el sistema */}
            {confirmar === "todo" ? (
              <div className="mt-3 rounded-lg bg-muted/60 p-2.5">
                <p className="text-xs text-muted-foreground">
                  Se ocultará toda la guía. Podrás operar libremente; los
                  pasos igual se marcan solos al hacerlos.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={mutando}
                    onClick={terminar}
                  >
                    Omitir toda la guía
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmar(null)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmar("todo")}
                className="mt-3 w-full text-center text-[11px] text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
              >
                Ya sé cómo funciona · omitir toda la guía
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
