"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  actualizarPasoFlujo,
  obtenerFlujos,
  type FlujoOnboarding,
  type PasoFlujo,
} from "@/lib/api/onboarding"
import { configDePaso, type ConfigPaso } from "@/lib/onboarding/flows"

export type PasoActivo = PasoFlujo & {
  flowKey: string
  config: ConfigPaso | null
}

const QUERY_KEY = ["onboarding-flujos"] as const

/**
 * Estado de los flujos de onboarding contextual: flujo/paso activo con su
 * config de presentación, y acciones para omitir un paso o descartar un flujo.
 */
export function useOnboardingProgress() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: obtenerFlujos,
    refetchOnWindowFocus: true,
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

  const flujoActivo: FlujoOnboarding | null =
    query.data?.flujos.find((f) => !f.completado && !f.descartado) ?? null

  let pasoActivo: PasoActivo | null = null
  if (flujoActivo?.pasoActivo) {
    const paso = flujoActivo.pasos.find(
      (p) => p.stepKey === flujoActivo.pasoActivo,
    )
    if (paso) {
      pasoActivo = {
        ...paso,
        flowKey: flujoActivo.flowKey,
        config: configDePaso(flujoActivo.flowKey, paso.stepKey),
      }
    }
  }

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    flujoActivo,
    pasoActivo,
    mutando: mutacion.isPending,
    omitirPaso: (flowKey: string, stepKey: string) =>
      mutacion.mutate({ flowKey, stepKey, status: "OMITIDO" }),
    descartarFlujo: (flowKey: string) =>
      mutacion.mutate({ flowKey, stepKey: "_flow", status: "DESCARTADO" }),
    invalidar: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  }
}
