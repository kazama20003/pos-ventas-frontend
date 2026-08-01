"use client"

import { RiArrowDownSLine, RiCheckLine, RiStore2Line } from "@remixicon/react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSucursalActiva } from "@/hooks/use-sucursal-activa"

/**
 * Selector de sucursal activa para la barra lateral. Fija el contexto operativo
 * global (POS/Caja lo reutilizan). Si el usuario solo tiene una sucursal, se
 * muestra estática; si no tiene ninguna, no se renderiza.
 */
export function SucursalSwitcher({ compacto }: { compacto?: boolean }) {
  const { sucursales, sucursalId, sucursal, setSucursal, isLoading } =
    useSucursalActiva()

  if (isLoading || sucursales.length === 0) return null

  const etiqueta = sucursal?.nombre ?? "Elegir sucursal"

  // Una sola sucursal: sin dropdown (no hay nada que elegir).
  if (sucursales.length === 1) {
    return (
      <div
        className="flex items-center gap-2.5 rounded-xl border bg-muted/30 px-3 py-2"
        title={etiqueta}
      >
        <RiStore2Line className="size-4 shrink-0 text-primary" />
        {!compacto ? (
          <span className="min-w-0 truncate text-sm font-medium">
            {etiqueta}
          </span>
        ) : null}
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-xl border bg-card px-3 py-2 text-left transition-colors hover:bg-muted/40"
            title={etiqueta}
          />
        }
      >
        <RiStore2Line className="size-4 shrink-0 text-primary" />
        {!compacto ? (
          <>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {etiqueta}
            </span>
            <RiArrowDownSLine className="size-4 shrink-0 text-muted-foreground" />
          </>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Sucursal activa</DropdownMenuLabel>
        {sucursales.map((s) => (
          <DropdownMenuItem
            key={s.id}
            onClick={() => setSucursal(s.id)}
            className="justify-between"
          >
            <span className="min-w-0 truncate">
              {s.nombre}
              <span className="ml-1 font-mono text-xs text-muted-foreground">
                {s.codigo}
              </span>
            </span>
            {s.id === sucursalId ? (
              <RiCheckLine className="size-4 shrink-0 text-primary" />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
