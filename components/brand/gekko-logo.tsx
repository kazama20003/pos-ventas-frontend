"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { siteConfig } from "@/lib/config/site"

/**
 * Marca dibujada en Canvas. La espiral forma una "g" y los cuatro apoyos
 * mínimos sugieren el gekko sin convertirlo en una mascota ilustrada.
 */
export function GekkoMark({ className }: { className?: string }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  React.useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext("2d")
    if (!context) return

    const color = "#19D3C5"
    const scale = 2
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.save()
    context.scale(scale, scale)
    context.strokeStyle = color
    context.fillStyle = color
    context.lineCap = "round"
    context.lineJoin = "round"

    // Anillo abierto: la lectura principal es una "G" tecnológica.
    context.beginPath()
    context.arc(50, 50, 34, Math.PI * 0.04, Math.PI * 1.96)
    context.lineWidth = 12
    context.stroke()

    // Barra óptica de la G.
    context.beginPath()
    context.moveTo(58, 50)
    context.lineTo(83, 50)
    context.lineTo(83, 61)
    context.lineTo(67, 61)
    context.lineWidth = 10
    context.stroke()

    // Gekko abstracto: cabeza facetada y cuerpo curvo integrados al anillo.
    context.beginPath()
    context.moveTo(31, 68)
    context.bezierCurveTo(27, 56, 30, 44, 38, 36)
    context.lineTo(45, 29)
    context.bezierCurveTo(48, 26, 52, 24, 56, 25)
    context.lineTo(65, 27)
    context.bezierCurveTo(69, 28, 70, 31, 68, 35)
    context.lineTo(62, 43)
    context.bezierCurveTo(59, 47, 55, 48, 52, 51)
    context.bezierCurveTo(45, 58, 47, 67, 55, 71)
    context.bezierCurveTo(46, 73, 38, 71, 31, 68)
    context.closePath()
    context.fill()

    context.restore()
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={200}
      className={cn("size-6 text-[#19D3C5]", className)}
      aria-hidden="true"
    />
  )
}

/** Logo completo: badge con el gecko + wordmark opcional. */
export function GekkoLogo({
  className,
  showWord = true,
  showVersion = false,
}: {
  className?: string
  showWord?: boolean
  showVersion?: boolean
}) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <GekkoMark className="size-5" />
      </span>
      {showWord ? (
        <span className="flex items-baseline gap-1">
          <span className="text-base font-semibold tracking-tight">
            {siteConfig.name}
          </span>
          {showVersion ? (
            <span className="text-xs text-muted-foreground">
              {siteConfig.version}
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  )
}
