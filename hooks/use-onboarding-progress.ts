"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  actualizarPasoFlujo,
  obtenerFlujos,
  type FlujoOnboarding,
  type PasoFlujo,
  type RespuestaFlujos,
} from "@/lib/api/onboarding"
import { configDePaso, type ConfigPaso } from "@/lib/onboarding/flows"

export type PasoActivo = PasoFlujo & {
  flowKey: string
  config: ConfigPaso | null
}

const QUERY_KEY = ["onboarding-flujos"] as const

/** Flujos que el usuario todavía ve (ni completados ni descartados). */
function flujosPendientes(data: RespuestaFlujos | undefined): FlujoOnboarding[] {
  return data?.flujos.filter((f) => !f.completado && !f.descartado) ?? []
}

function pasoConConfig(
  flujo: FlujoOnboarding,
  stepKey: string | null,
): PasoActivo | null {
  if (!stepKey) return null
  const paso = flujo.pasos.find((p) => p.stepKey === stepKey)
  if (!paso) return null
  return {
    ...paso,
    flowKey: flujo.flowKey,
    config: configDePaso(flujo.flowKey, paso.stepKey),
  }
}

/**
 * Estado de los flujos de onboarding contextual: flujo/paso activo con su
 * config de presentación, progreso global, siguiente paso y acciones para
 * omitir un paso o descartar flujos.
 */
export function useOnboardingProgress() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: obtenerFlujos,
    refetchOnWindowFocus: true,
    // Poll suave SOLO mientras hay un paso pendiente por completar, para
    // detectar en vivo que el usuario terminó la acción en otra vista.
    refetchInterval: (q) =>
      flujosPendientes(q.state.data).some((f) => f.pasoActivo) ? 7000 : false,
  })

  const mutacion = useMutation({
    mutationFn: ({
      flowKey,
      stepKey,
      status,
    }: {
      flowKey: string
      stepKey: string
      status: "PENDIENTE" | "OMITIDO" | "DESCARTADO"
    }) => actualizarPasoFlujo(flowKey, stepKey, status),
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEY, data)
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })

  const todosLosFlujos: FlujoOnboarding[] = query.data?.flujos ?? []
  const pendientes = flujosPendientes(query.data)
  const flujoActivo: FlujoOnboarding | null = pendientes[0] ?? null

  const pasoActivo: PasoActivo | null = flujoActivo
    ? pasoConConfig(flujoActivo, flujoActivo.pasoActivo)
    : null

  // Siguiente paso después del activo: dentro del mismo flujo o, si el
  // activo es el último, el primer paso pendiente del siguiente flujo.
  let siguientePaso: PasoActivo | null = null
  if (flujoActivo && pasoActivo) {
    const idx = flujoActivo.pasos.findIndex(
      (p) => p.stepKey === pasoActivo.stepKey,
    )
    const dentro = flujoActivo.pasos
      .slice(idx + 1)
      .find((p) => p.status === "PENDIENTE")
    if (dentro) {
      siguientePaso = pasoConConfig(flujoActivo, dentro.stepKey)
    } else {
      const siguienteFlujo = pendientes.find(
        (f) => f.flowKey !== flujoActivo.flowKey && f.pasoActivo,
      )
      if (siguienteFlujo) {
        siguientePaso = pasoConConfig(siguienteFlujo, siguienteFlujo.pasoActivo)
      }
    }
  }

  // Progreso global sobre los flujos no descartados.
  const flujosVisibles = todosLosFlujos.filter((f) => !f.descartado)
  const pasosGlobal = flujosVisibles.flatMap((f) =>
    f.pasos.filter((p) => p.status !== "DESCARTADO"),
  )
  const progresoTotal = {
    completados: pasosGlobal.filter(
      (p) => p.status === "COMPLETADO" || p.status === "OMITIDO",
    ).length,
    total: pasosGlobal.length,
  }

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    todosLosFlujos,
    flujoActivo,
    pasoActivo,
    siguientePaso,
    progresoTotal,
    /** true si ya no queda nada que guiar (todo completado o descartado). */
    todoTerminado: !query.isLoading && !query.isError && pendientes.length === 0,
    mutando: mutacion.isPending,
    omitirPaso: (flowKey: string, stepKey: string) =>
      mutacion.mutate({ flowKey, stepKey, status: "OMITIDO" }),
    descartarFlujo: (flowKey: string) =>
      mutacion.mutate({ flowKey, stepKey: "_flow", status: "DESCARTADO" }),
    invalidar: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  }
}
