"use client"

import { cn } from "@/lib/utils"
import type { Workspace } from "@/lib/config/navigation"

const OPTIONS: { value: Workspace; label: string }[] = [
  { value: "operacion", label: "Operación" },
  { value: "administracion", label: "Admin" },
]

export function WorkspaceSwitcher({
  value,
  onValueChange,
}: {
  value: Workspace
  onValueChange: (value: Workspace) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="Espacio de trabajo"
      className="flex items-center gap-1 rounded-full bg-sidebar-accent p-1 group-data-[collapsible=icon]:hidden"
    >
      {OPTIONS.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onValueChange(opt.value)}
            className={cn(
              "flex-1 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
