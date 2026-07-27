import { cn } from "@/lib/utils"
import { siteConfig } from "@/lib/config/site"

/**
 * Marca de Gekko: silueta estilizada de gecko (vista superior) con la cola
 * enroscada. Usa `currentColor`, por lo que hereda el color del contenedor.
 */
export function GekkoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("size-6", className)}
    >
      {/* Cuerpo + cabeza + cola enroscada */}
      <path
        d="M24 5.5c-3 0-5.2 2.2-5.2 5.1 0 1.9 1 3.4 2.4 4.6-2.7 1.3-4.6 3.8-4.6 7 0 2.6 1.3 4.6 3.1 6-2.4 1-4.1 3-4.1 5.8 0 3.4 2.6 6 6 6 2.1 0 3.8-1 4.9-2.6 1.1 1.6 2.8 2.6 4.9 2.6 3.4 0 6-2.6 6-6 0-3.6-2.9-5.9-6-5.9-1 0-1.9.2-2.7.6.5-1 .8-2.1.8-3.3 0-2.6-1.3-4.6-3.1-6 1.8-1.4 3.1-3.4 3.1-6 0-1.2-.3-2.3-.8-3.3.8.4 1.7.6 2.7.6 1.4 0 2.5-1.1 2.5-2.5S32.3 7.5 30.9 7.5c-1.2 0-2.2.8-2.4 1.9C27.6 7 26 5.5 24 5.5Z"
        fill="currentColor"
      />
      {/* Patas */}
      <g stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <path d="M18.5 15.5 13 12" />
        <path d="M29.5 15.5 35 12" />
        <path d="M17 28 11 26.5" />
        <path d="M31 28 37 26.5" />
      </g>
      {/* Ojos */}
      <circle cx="21.8" cy="10.4" r="1.05" className="fill-background" />
      <circle cx="26.2" cy="10.4" r="1.05" className="fill-background" />
    </svg>
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
