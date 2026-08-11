"use client"

import Link from "next/link"
import type { RemixiconComponentType } from "@remixicon/react"

import { Button } from "@/components/ui/button"

/**
 * Empty state reutilizable orientado a acción: icono grande, título,
 * una línea de contexto y un CTA primario (link o handler).
 */
export function EmptyStateAction({
  icono: Icono,
  titulo,
  descripcion,
  cta,
  href,
  onClick,
}: {
  icono: RemixiconComponentType
  titulo: string
  descripcion: string
  cta: string
  href?: string
  onClick?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icono className="size-7" />
      </span>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{titulo}</h2>
        <p className="max-w-sm text-sm text-muted-foreground">{descripcion}</p>
      </div>
      {href ? (
        <Button render={<Link href={href} />}>{cta}</Button>
      ) : (
        <Button type="button" onClick={onClick}>
          {cta}
        </Button>
      )}
    </div>
  )
}
