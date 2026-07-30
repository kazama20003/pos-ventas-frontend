"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import Lenis from "lenis"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "@/components/auth/auth-provider"

gsap.registerPlugin(ScrollTrigger)

function SmoothScroll({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const lenis = new Lenis({
      duration: 0.9,
      smoothWheel: true,
      wheelMultiplier: 1.1,
      touchMultiplier: 1.8,
    })
    const update = (time: number) => lenis.raf(time * 1000)

    lenis.on("scroll", ScrollTrigger.update)
    gsap.ticker.add(update)
    gsap.ticker.lagSmoothing(0)

    return () => {
      lenis.off("scroll", ScrollTrigger.update)
      gsap.ticker.remove(update)
      lenis.destroy()
    }
  }, [])

  return children
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
        },
      })
  )

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delay={200}>
          <AuthProvider>
            <SmoothScroll>{children}</SmoothScroll>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </NextThemesProvider>
  )
}
