"use client"

import * as React from "react"
import {
  RiArrowRightUpLine,
  RiBarChartBoxLine,
  RiCheckboxCircleFill,
  RiShoppingBag3Line,
  RiStore2Line,
} from "@remixicon/react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

const transactions = [
  { name: "Venta #1842", detail: "3 productos", amount: "S/ 286.50" },
  { name: "Venta #1841", detail: "1 producto", amount: "S/ 74.90" },
  { name: "Venta #1840", detail: "5 productos", amount: "S/ 412.00" },
]

export function MotionIntro() {
  const sectionRef = React.useRef<HTMLElement>(null)
  const eyebrowRef = React.useRef<HTMLParagraphElement>(null)
  const titleRef = React.useRef<HTMLHeadingElement>(null)
  const copyRef = React.useRef<HTMLParagraphElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)

  React.useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const context = gsap.context(() => {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      if (reducedMotion) return

      gsap.fromTo(
        section,
        { y: "14vh", borderTopLeftRadius: 38, borderTopRightRadius: 38 },
        {
          y: 0,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "top 18%",
            scrub: 0.8,
          },
        }
      )

      gsap.from([eyebrowRef.current, titleRef.current, copyRef.current], {
        y: 54,
        autoAlpha: 0,
        stagger: 0.12,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section,
          start: "top 55%",
          toggleActions: "play none none reverse",
        },
      })

      gsap.fromTo(
        panelRef.current,
        { y: 130, scale: 0.94, rotateX: 7 },
        {
          y: 0,
          scale: 1,
          rotateX: 0,
          ease: "none",
          transformOrigin: "top center",
          scrollTrigger: {
            trigger: panelRef.current,
            start: "top 92%",
            end: "top 48%",
            scrub: 0.9,
          },
        }
      )
    }, section)

    return () => context.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="funciones"
      className="relative z-20 -mt-px min-h-[115svh] overflow-hidden bg-[#090909] px-4 pb-20 pt-24 text-white will-change-transform sm:px-8 sm:pt-28 lg:px-12 lg:pt-32"
    >
      <div className="mx-auto max-w-[1320px]">
        <p ref={eyebrowRef} className="flex items-center justify-center gap-3 font-mono text-[10px] font-semibold uppercase tracking-[0.13em] text-white">
          <span className="size-1.5 rounded-full bg-[#19D3C5]" />
          El control cambia el negocio
        </p>

        <h2
          ref={titleRef}
          className="mx-auto mt-14 max-w-[950px] text-center text-[clamp(2.3rem,4.45vw,4.8rem)] font-normal leading-[0.98] tracking-[-0.055em] text-white/55"
        >
          Una plataforma para vender con
          <span className="text-white"> velocidad</span>, controlar con
          <span className="text-white"> precisión</span> y crecer con
          <span className="text-white"> claridad.</span>
        </h2>

        <p ref={copyRef} className="mx-auto mt-8 max-w-[690px] text-center text-[15px] leading-relaxed text-white/55 sm:text-[17px]">
          Cada venta actualiza tu caja, inventario y reportes al instante. Menos tareas repetidas, más tiempo para atender y decidir mejor.
        </p>

        <div
          ref={panelRef}
          className="relative mx-auto mt-20 max-w-[1180px] overflow-hidden rounded-[28px] bg-[#f4f3ef] p-3 text-[#111] shadow-[0_50px_120px_rgba(0,0,0,0.65)] sm:p-5 lg:mt-24 lg:rounded-[36px] lg:p-7"
          style={{ perspective: "1200px" }}
        >
          <div className="overflow-hidden rounded-[20px] border border-black/10 bg-[#e9e8e3] lg:rounded-[26px]">
            <div className="flex h-12 items-center justify-between border-b border-black/10 bg-white/80 px-4 sm:px-6">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-[#ff6f4f]" />
                <span className="size-2.5 rounded-full bg-[#fff200]" />
                <span className="size-2.5 rounded-full bg-[#19D3C5]" />
              </div>
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-black/45">Gek / Centro de operaciones</span>
              <RiArrowRightUpLine className="size-4 text-black/45" />
            </div>

            <div className="grid min-h-[500px] grid-cols-1 lg:grid-cols-[210px_1fr]">
              <aside className="hidden border-r border-black/10 bg-[#111] p-5 text-white lg:block">
                <div className="flex items-center gap-2 text-lg font-medium">
                  <span className="flex size-7 items-center justify-center rounded-full bg-[#19D3C5] text-black">g</span>
                  gek
                </div>
                <nav className="mt-10 space-y-2 text-[13px]">
                  <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 font-medium text-black"><RiBarChartBoxLine className="size-4" /> Resumen</div>
                  <div className="flex items-center gap-3 px-3 py-2.5 text-white/55"><RiShoppingBag3Line className="size-4" /> Ventas</div>
                  <div className="flex items-center gap-3 px-3 py-2.5 text-white/55"><RiStore2Line className="size-4" /> Inventario</div>
                </nav>
              </aside>

              <div className="p-4 sm:p-7 lg:p-9">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.13em] text-black/45">Hoy, 28 de julio</p>
                    <h3 className="mt-2 text-3xl font-medium tracking-[-0.04em] sm:text-4xl">Todo bajo control.</h3>
                  </div>
                  <span className="inline-flex items-center gap-2 text-xs font-medium text-black/55"><RiCheckboxCircleFill className="size-4 text-[#12a897]" /> Sincronizado ahora</span>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {[
                    ["Ventas del día", "S/ 8,420", "+18.2%"],
                    ["Transacciones", "146", "+24"],
                    ["Ticket promedio", "S/ 57.67", "+6.4%"],
                  ].map(([label, value, change]) => (
                    <div key={label} className="rounded-2xl border border-black/10 bg-white p-5">
                      <p className="text-xs text-black/45">{label}</p>
                      <p className="mt-5 text-2xl font-semibold tracking-[-0.04em]">{value}</p>
                      <p className="mt-1 text-[11px] font-medium text-[#11897d]">{change} vs. ayer</p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 grid gap-3 xl:grid-cols-[1.15fr_.85fr]">
                  <div className="rounded-2xl border border-black/10 bg-white p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">Ritmo de ventas</p>
                      <p className="font-mono text-[9px] uppercase text-black/35">09:00 — 18:00</p>
                    </div>
                    <div className="mt-8 flex h-32 items-end gap-2">
                      {[28, 45, 37, 62, 49, 76, 58, 88, 70, 94, 82, 100].map((height, index) => (
                        <span key={index} className="flex-1 rounded-t-sm bg-[#19D3C5]" style={{ height: `${height}%`, opacity: 0.35 + index * 0.045 }} />
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[#111] p-5 text-white">
                    <p className="text-sm font-semibold">Últimos movimientos</p>
                    <div className="mt-5 divide-y divide-white/10">
                      {transactions.map((transaction) => (
                        <div key={transaction.name} className="flex items-center justify-between py-3">
                          <div><p className="text-xs font-medium">{transaction.name}</p><p className="mt-1 text-[10px] text-white/40">{transaction.detail}</p></div>
                          <p className="text-xs font-semibold">{transaction.amount}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
