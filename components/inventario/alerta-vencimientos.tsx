"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { RiAlarmWarningLine, RiTimeLine } from "@remixicon/react"

import { Button } from "@/components/ui/button"
import { listarVencimientos } from "@/lib/api/inventario"

/**
 * Alerta de caducidad para el dashboard (farmacia/clínica/alimentos): resume
 * cuántos lotes están vencidos o por vencer. Se oculta si no hay ninguno.
 */
export function AlertaVencimientos({ dias = 30 }: { dias?: number }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["inventario-vencimientos", dias],
    queryFn: () => listarVencimientos({ dias }),
    refetchOnWindowFocus: true,
  })

  if (isLoading || isError || !data || data.total === 0) return null

  const critico = data.vencidos > 0

  return (
    <section
      className={`rounded-2xl border p-5 shadow-sm md:p-6 ${
        critico
          ? "border-destructive/30 bg-destructive/5"
          : "border-amber-500/30 bg-amber-500/5"
      }`}
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <span
            className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
              critico
                ? "bg-destructive/10 text-destructive"
                : "bg-amber-500/10 text-amber-600"
            }`}
          >
            {critico ? (
              <RiAlarmWarningLine className="size-5" />
            ) : (
              <RiTimeLine className="size-5" />
            )}
          </span>
          <div className="min-w-0">
            <h2 className="font-semibold">
              {critico
                ? `${data.vencidos} lote${data.vencidos === 1 ? "" : "s"} vencido${
                    data.vencidos === 1 ? "" : "s"
                  }`
                : "Lotes por vencer"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.vencidos > 0
                ? `${data.vencidos} vencido(s) y ${data.porVencer} por vencer en ${data.diasAviso} días.`
                : `${data.porVencer} lote(s) vencen en los próximos ${data.diasAviso} días.`}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          render={<Link href="/inventario?tab=vencimientos" />}
        >
          Revisar
        </Button>
      </div>
    </section>
  )
}
