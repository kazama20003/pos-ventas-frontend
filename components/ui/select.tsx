"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { RiArrowDownSLine, RiCheckLine } from "@remixicon/react"

import { cn } from "@/lib/utils"

export type SelectOption = { value: string; label: string; hint?: string }

type Coords = { top: number; left: number; width: number; arriba: boolean }

/**
 * Select estilizado (sin dependencias). El panel flotante se renderiza en un
 * portal con posición fija calculada desde el botón, para que NUNCA lo recorte
 * un contenedor con overflow (tablas, tarjetas, paneles con scroll). Accesible
 * con teclado (flechas, Enter, Escape) y cierre al hacer clic fuera.
 */
export function Select({
  value,
  onChange,
  options,
  placeholder = "Selecciona…",
  disabled,
  className,
  id,
}: {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
}) {
  const [abierto, setAbierto] = React.useState(false)
  const [activo, setActivo] = React.useState(0)
  const [coords, setCoords] = React.useState<Coords | null>(null)
  const ref = React.useRef<HTMLDivElement>(null)
  const btnRef = React.useRef<HTMLButtonElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)

  const seleccionada = options.find((o) => o.value === value)

  const calcular = React.useCallback(() => {
    const el = btnRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const alto = Math.min(256, options.length * 40 + 8)
    const espacioAbajo = window.innerHeight - r.bottom
    const arriba = espacioAbajo < alto + 12 && r.top > espacioAbajo
    setCoords({
      top: arriba ? r.top : r.bottom,
      left: r.left,
      width: r.width,
      arriba,
    })
  }, [options.length])

  // Recalcular posición al abrir y ante scroll/resize mientras está abierto.
  React.useEffect(() => {
    if (!abierto) return
    calcular()
    const onScroll = () => calcular()
    window.addEventListener("scroll", onScroll, true)
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll, true)
      window.removeEventListener("resize", onScroll)
    }
  }, [abierto, calcular])

  // Cierre al hacer clic fuera (contempla el panel en portal).
  React.useEffect(() => {
    if (!abierto) return
    function onDoc(e: MouseEvent) {
      const t = e.target as Node
      if (ref.current?.contains(t) || panelRef.current?.contains(t)) return
      setAbierto(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [abierto])

  function abrir() {
    const i = options.findIndex((o) => o.value === value)
    setActivo(i >= 0 ? i : 0)
    setAbierto(true)
  }

  function elegir(v: string) {
    onChange(v)
    setAbierto(false)
  }

  function onKey(e: React.KeyboardEvent) {
    if (disabled) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      if (!abierto) return abrir()
      setActivo((a) => Math.min(options.length - 1, a + 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActivo((a) => Math.max(0, a - 1))
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      if (!abierto) abrir()
      else if (options[activo]) elegir(options[activo].value)
    } else if (e.key === "Escape") {
      setAbierto(false)
    }
  }

  const panel =
    abierto && coords ? (
      <div
        ref={panelRef}
        role="listbox"
        style={{
          position: "fixed",
          top: coords.top,
          left: coords.left,
          width: coords.width,
          transform: coords.arriba ? "translateY(-100%)" : undefined,
          marginTop: coords.arriba ? -6 : 6,
        }}
        className="z-[9999] max-h-64 overflow-auto rounded-xl border bg-card p-1 shadow-lg ring-1 ring-foreground/5"
      >
        {options.length === 0 ? (
          <p className="px-3 py-2 text-sm text-muted-foreground">Sin opciones</p>
        ) : (
          options.map((o, i) => {
            const sel = o.value === value
            return (
              <button
                key={o.value || `__${i}`}
                type="button"
                role="option"
                aria-selected={sel}
                onMouseEnter={() => setActivo(i)}
                onClick={() => elegir(o.value)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  i === activo ? "bg-muted" : "",
                  sel ? "font-medium" : ""
                )}
              >
                <span className="min-w-0 truncate">
                  {o.label}
                  {o.hint ? (
                    <span className="ml-1 text-xs text-muted-foreground">
                      {o.hint}
                    </span>
                  ) : null}
                </span>
                {sel ? (
                  <RiCheckLine className="size-4 shrink-0 text-primary" />
                ) : null}
              </button>
            )
          })
        )}
      </div>
    ) : null

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        ref={btnRef}
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => (abierto ? setAbierto(false) : abrir())}
        onKeyDown={onKey}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-xl border bg-background px-3 text-sm outline-none transition-colors",
          "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30",
          disabled ? "cursor-not-allowed opacity-60" : "hover:bg-muted/30",
          abierto ? "border-ring ring-[3px] ring-ring/30" : ""
        )}
      >
        <span className={cn("truncate", !seleccionada && "text-muted-foreground")}>
          {seleccionada?.label ?? placeholder}
        </span>
        <RiArrowDownSLine
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            abierto && "rotate-180"
          )}
        />
      </button>

      {typeof document !== "undefined" && panel
        ? createPortal(panel, document.body)
        : null}
    </div>
  )
}
