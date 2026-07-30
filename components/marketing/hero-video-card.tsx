"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { RiPlayFill } from "@remixicon/react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

export function HeroVideoCard() {
  const cardRef = React.useRef<HTMLAnchorElement>(null)
  const imageRef = React.useRef<HTMLDivElement>(null)
  const progressRef = React.useRef<HTMLSpanElement>(null)
  const glowRef = React.useRef<HTMLSpanElement>(null)

  React.useLayoutEffect(() => {
    const card = cardRef.current
    if (!card) return

    const context = gsap.context(() => {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      if (reducedMotion) return

      gsap.fromTo(
        card,
        { autoAlpha: 0, y: 42, scale: 0.92, rotateX: 9, rotateY: -8 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          rotateX: 0,
          rotateY: 0,
          duration: 1,
          delay: 0.35,
          ease: "power3.out",
        }
      )

      gsap.to(card, {
        y: -34,
        rotateX: -5,
        rotateY: 4,
        scale: 1.045,
        ease: "none",
        scrollTrigger: {
          trigger: card,
          start: "top 82px",
          end: "bottom top",
          scrub: 0.8,
        },
      })

      gsap.to(imageRef.current, {
        scale: 1.12,
        ease: "none",
        scrollTrigger: {
          trigger: card,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      })

      gsap.fromTo(
        progressRef.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 2.8,
          repeat: -1,
          ease: "power1.inOut",
          transformOrigin: "left center",
        }
      )

      gsap.to(glowRef.current, {
        autoAlpha: 0.85,
        scale: 1.08,
        duration: 1.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      })
    }, card)

    return () => context.revert()
  }, [])

  return (
    <div className="absolute bottom-12 right-12 hidden w-[306px] [perspective:900px] xl:block">
      <Link
        ref={cardRef}
        href="/#funciones"
        aria-label="Reproducir video de presentacion de Gek"
        className="group relative block overflow-hidden rounded-[18px] border border-[#19D3C5]/80 bg-[#050505]/82 p-2 text-white opacity-0 shadow-[0_24px_70px_rgba(0,0,0,0.46),0_0_42px_rgba(25,211,197,0.14)] outline-none backdrop-blur-md transition-transform duration-300 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-[#19D3C5]"
      >
        <span
          ref={glowRef}
          aria-hidden
          className="pointer-events-none absolute -inset-12 rounded-full bg-[#19D3C5]/30 blur-3xl opacity-40"
        />
        <span aria-hidden className="absolute inset-0 rounded-[18px] bg-[linear-gradient(135deg,rgba(25,211,197,0.34),rgba(255,242,0,0.12)_42%,transparent_68%)]" />
        <span aria-hidden className="absolute inset-px rounded-[17px] border border-white/12" />

        <span className="relative block overflow-hidden rounded-[12px] bg-black">
          <span ref={imageRef} className="block h-[172px]">
            <Image
              src="/gekko-hero.jpg"
              alt=""
              fill
              sizes="306px"
              className="object-cover object-[70%_55%] opacity-90 saturate-[1.08] transition-transform duration-700 group-hover:scale-105"
            />
          </span>
          <span className="absolute inset-0 bg-[radial-gradient(circle_at_68%_42%,rgba(25,211,197,0.12),rgba(0,0,0,0.32)_42%,rgba(0,0,0,0.74))]" />
          <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/45 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.12em] backdrop-blur">
            <span className="size-1.5 rounded-full bg-[#19D3C5]" />
            Demo POS
          </span>
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-13 items-center justify-center rounded-full border border-white/50 bg-black/35 text-white shadow-[0_0_34px_rgba(25,211,197,0.35)] backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
              <RiPlayFill className="ml-0.5 size-6" />
            </span>
          </span>
          <span className="absolute inset-x-3 bottom-3">
            <span className="mb-2 flex items-end justify-between">
              <span className="font-mono text-[9px] uppercase tracking-[0.14em]">Gek en accion</span>
              <span className="font-mono text-[9px] text-white/70">00:42</span>
            </span>
            <span className="block h-1 overflow-hidden rounded-full bg-white/20">
              <span ref={progressRef} className="block h-full origin-left rounded-full bg-[#19D3C5]" />
            </span>
          </span>
        </span>
      </Link>

      <p className="mt-3 text-right font-mono text-[11px] uppercase tracking-[0.15em] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]">
        Momentos simples, negocios fuertes
      </p>
    </div>
  )
}
