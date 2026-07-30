"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { siteConfig } from "@/lib/config/site"

export function GekkoMark({ className }: { className?: string }) {
  return (
    <img
      src="/brand/gekko-logo-professional.png"
      alt=""
      className={cn("size-6 object-contain", className)}
      aria-hidden="true"
    />
  )
}

/** Complete logo: badge with the gekko mark plus optional wordmark. */
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
