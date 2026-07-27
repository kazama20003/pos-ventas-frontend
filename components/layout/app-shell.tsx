"use client"

import * as React from "react"
import { useTheme } from "next-themes"

import { AppSidebar } from "@/components/layout/app-sidebar"

export function AppShell({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const dark = mounted && resolvedTheme === "dark"
  const canvas = dark ? "#100e13" : "#f3f1ed"

  return (
    <div
      style={{
        display: "flex",
        height: "100svh",
        gap: 16,
        padding: 16,
        boxSizing: "border-box",
        background: canvas,
        transition: "background .3s",
        fontFamily: "var(--font-sora), sans-serif",
      }}
    >
      <AppSidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-3xl bg-background text-foreground shadow-[0_12px_40px_rgba(20,15,35,0.10)]">
        {children}
      </main>
    </div>
  )
}
