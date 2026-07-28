"use client"

import * as React from "react"
import Link from "next/link"
import {
  RiArrowDownSLine,
  RiArchiveLine,
  RiBarChart2Line,
  RiCashLine,
  RiFileTextLine,
  RiHomeFill,
  RiMenuLine,
  RiPriceTag3Line,
  RiSearchLine,
  RiShoppingCart2Line,
  RiStore2Line,
  RiTeamLine,
  RiUser3Line,
} from "@remixicon/react"
import { gsap } from "gsap"
import { TextPlugin } from "gsap/TextPlugin"

import { GekkoMark } from "@/components/brand/gekko-logo"

gsap.registerPlugin(TextPlugin)

const menuContent = {
  soluciones: [
    { title: "Punto de venta", description: "Vende rápido desde cualquier terminal", href: "/ventas", icon: RiShoppingCart2Line, tone: "bg-[#ffe600]" },
    { title: "Inventario", description: "Stock actualizado por cada sucursal", href: "/inventario", icon: RiArchiveLine, tone: "bg-[#cfff32]" },
    { title: "Control de caja", description: "Turnos, cierres y arqueos precisos", href: "/caja", icon: RiCashLine, tone: "bg-[#ff6f4f]" },
    { title: "Facturación SUNAT", description: "Boletas y facturas electrónicas", href: "/ventas", icon: RiFileTextLine, tone: "bg-[#958fff]" },
    { title: "Clientes", description: "Historial y datos siempre disponibles", href: "/clientes", icon: RiUser3Line, tone: "bg-[#38e6f2]" },
    { title: "Reportes", description: "Decisiones claras con datos en vivo", href: "/reportes", icon: RiBarChart2Line, tone: "bg-[#ff79c6]" },
  ],
  funciones: [
    { title: "Productos", description: "Catálogo, precios y códigos de barras", href: "/productos", icon: RiPriceTag3Line, tone: "bg-[#ffe600]" },
    { title: "Multi-sucursal", description: "Toda tu operación desde un lugar", href: "/sucursales", icon: RiStore2Line, tone: "bg-[#cfff32]" },
    { title: "Equipo", description: "Roles y permisos para cada usuario", href: "/configuracion", icon: RiTeamLine, tone: "bg-[#ff6f4f]" },
    { title: "Ventas en vivo", description: "Consulta cada movimiento al instante", href: "/ventas", icon: RiShoppingCart2Line, tone: "bg-[#958fff]" },
    { title: "Caja segura", description: "Trazabilidad completa por turno", href: "/caja", icon: RiCashLine, tone: "bg-[#38e6f2]" },
    { title: "Analítica", description: "Márgenes y productos más vendidos", href: "/dashboard", icon: RiBarChart2Line, tone: "bg-[#ff79c6]" },
  ],
} as const

type MenuName = keyof typeof menuContent

export function SiteHeader() {
  const [activeMenu, setActiveMenu] = React.useState<MenuName | null>(null)
  const [isHeaderCompact, setIsHeaderCompact] = React.useState(false)
  const greetingRef = React.useRef<HTMLSpanElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const menuShellRef = React.useRef<HTMLDivElement>(null)
  const lastScrollRef = React.useRef(0)
  const scrollIdleRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const manualExpandRef = React.useRef(false)

  React.useEffect(() => {
    const animation = gsap.to(greetingRef.current, {
      duration: 2.2,
      text: "HOLA MUNDO, BIENVENIDO A GEK!",
      ease: "none",
      delay: 0.35,
    })
    return () => {
      animation.kill()
    }
  }, [])

  React.useEffect(() => {
    if (!activeMenu || !panelRef.current || !menuShellRef.current) return

    const context = gsap.context(() => {
      gsap.fromTo(
        menuShellRef.current,
        { scale: 0.985 },
        { scale: 1, duration: 0.32, ease: "power3.out", transformOrigin: "top center" }
      )
      gsap.fromTo(
        panelRef.current,
        { autoAlpha: 0, y: -8 },
        { autoAlpha: 1, y: 0, duration: 0.26, ease: "power3.out" }
      )
    }, menuShellRef)

    return () => context.revert()
  }, [activeMenu])

  React.useEffect(() => {
    const shell = menuShellRef.current
    if (!shell) return

    const restoreWidth = () => {
      setIsHeaderCompact(false)
      gsap.to(shell, {
        width: 773,
        duration: 0.48,
        ease: "power3.out",
        overwrite: true,
      })
    }

    if (activeMenu) {
      restoreWidth()
      return
    }

    lastScrollRef.current = window.scrollY

    const onScroll = () => {
      const currentScroll = window.scrollY
      const scrollingDown = currentScroll > lastScrollRef.current + 0.5
      lastScrollRef.current = currentScroll

      if (scrollingDown && !manualExpandRef.current && window.matchMedia("(min-width: 1024px)").matches) {
        setIsHeaderCompact(true)
        gsap.to(shell, {
          width: 370,
          duration: 0.42,
          ease: "power3.out",
          overwrite: true,
        })
      }

      if (scrollIdleRef.current) clearTimeout(scrollIdleRef.current)
      scrollIdleRef.current = setTimeout(() => {
        manualExpandRef.current = false
      }, 220)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      if (scrollIdleRef.current) clearTimeout(scrollIdleRef.current)
      restoreWidth()
    }
  }, [activeMenu])

  const expandCompactHeader = () => {
    const shell = menuShellRef.current
    if (!shell) return

    manualExpandRef.current = true
    setIsHeaderCompact(false)
    gsap.to(shell, {
      width: 773,
      duration: 0.48,
      ease: "power3.out",
      overwrite: true,
    })
  }

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-[92px] text-white">
      <div className="relative mx-auto h-full max-w-[1920px] px-4 sm:px-8 lg:px-12">
        <Link
          href="/"
          aria-label="Gek, inicio"
          className="absolute left-4 top-[26px] flex items-start gap-3 sm:left-8 lg:left-12"
        >
          <span className="flex items-center gap-1 text-[21px] font-medium leading-none tracking-[-0.05em]">
            <GekkoMark className="size-7 text-[#19D3C5]" />
            gek
          </span>
          <span className="hidden -translate-y-1 sm:block">
            <span className="block font-mono text-[9px] leading-3 text-white/90">0x5662F6</span>
            <span className="flex gap-px">
              <i className="size-[10px] border border-white/70 bg-[#ffea00]" />
              <i className="size-[10px] border border-white/70 bg-[#00d84a]" />
              <i className="size-[10px] border border-white/70 bg-[#00dbff]" />
              <i className="size-[10px] border border-white/70 bg-[#5662f6]" />
              <i className="size-[10px] border border-white/70 bg-[#ff00b8]" />
            </span>
          </span>
        </Link>

        <div
          ref={menuShellRef}
          className={`absolute left-1/2 top-2 hidden w-[773px] -translate-x-1/2 flex-col rounded-[12px] p-2 text-[#111] transition-[background-color,box-shadow] duration-200 lg:flex ${
            activeMenu
              ? "bg-[#f5f5f3] shadow-[0_20px_60px_rgba(0,0,0,0.28)]"
              : "bg-transparent shadow-none"
          }`}
          onMouseLeave={() => setActiveMenu(null)}
        >
          <div className="flex h-12 w-full items-stretch">
            <nav className="flex flex-1 overflow-hidden rounded-[7px] bg-[#efefec]/95 text-[#111] shadow-[0_2px_12px_rgba(0,0,0,0.08)] backdrop-blur-sm">
              <Link
                href="/"
                className="flex flex-1 flex-col justify-center overflow-hidden rounded-l-[7px] px-4 leading-none transition-[width,opacity,padding] duration-300 hover:bg-white/45"
              >
                <span className="flex items-center gap-1 text-[13px] font-semibold">
                  <RiHomeFill className="size-3.5" />
                  Home
                </span>
                <span className="mt-1 flex font-mono text-[10px] tracking-[0.08em]" aria-label="Hola mundo, bienvenido a Gek">
                  <span ref={greetingRef} />
                  <span className="ml-px inline-block w-[5px] animate-pulse bg-black/80" aria-hidden />
                </span>
              </Link>
              {(["soluciones", "funciones"] as const).map((menu) => (
                <button
                  key={menu}
                  type="button"
                  onMouseEnter={() => setActiveMenu(menu)}
                  onFocus={() => setActiveMenu(menu)}
                  aria-expanded={activeMenu === menu}
                  tabIndex={isHeaderCompact ? -1 : undefined}
                  className={`flex items-center justify-center gap-1 overflow-hidden text-[13px] capitalize transition-[width,min-width,opacity,padding,background-color] duration-300 hover:bg-[#fff200]/70 ${
                    isHeaderCompact ? "pointer-events-none w-0 min-w-0 px-0 opacity-0" : "min-w-[108px] px-3 opacity-100"
                  } ${activeMenu === menu ? "bg-[#fff200] underline underline-offset-4" : ""}`}
                >
                  {menu}
                  <RiArrowDownSLine className={`size-3.5 transition-transform ${activeMenu === menu ? "rotate-180" : ""}`} />
                </button>
              ))}
              <Link
                href="/#precios"
                aria-hidden={isHeaderCompact}
                tabIndex={isHeaderCompact ? -1 : undefined}
                className={`flex items-center justify-center overflow-hidden text-[13px] transition-[width,min-width,opacity,padding] duration-300 hover:bg-white/50 ${
                  isHeaderCompact ? "pointer-events-none w-0 min-w-0 px-0 opacity-0" : "min-w-[82px] px-3 opacity-100"
                }`}
              >
                Precios
              </Link>
              <button
                type="button"
                aria-label="Mostrar navegación completa"
                onClick={expandCompactHeader}
                tabIndex={isHeaderCompact ? 0 : -1}
                className={`flex shrink-0 items-center justify-center overflow-hidden transition-[width,opacity] duration-300 hover:bg-white/55 ${
                  isHeaderCompact ? "w-12 opacity-100" : "pointer-events-none w-0 opacity-0"
                }`}
              >
                <RiMenuLine className="size-5" />
              </button>
            </nav>
            <Link
              href="/register"
              aria-hidden={isHeaderCompact}
              tabIndex={isHeaderCompact ? -1 : undefined}
              className={`flex items-center justify-center gap-2 overflow-hidden rounded-[7px] border-white/15 bg-black text-[12px] font-bold text-white transition-[width,min-width,margin,opacity,padding,border-width] duration-300 hover:bg-[#202020] ${
                isHeaderCompact ? "pointer-events-none ml-0 w-0 min-w-0 border-0 px-0 opacity-0" : "ml-2 min-w-[151px] border px-4 opacity-100"
              }`}
            >
              EMPEZAR AHORA
              <span className="size-2 bg-[#19d3c5]" />
            </Link>
          </div>

          {activeMenu ? (
            <div
              ref={panelRef}
              className="mt-8 w-full px-0 pb-0 text-[#111]"
            >
              <div className="grid grid-cols-2 gap-x-5 px-2 pt-1">
                {menuContent[activeMenu].map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="group flex items-center gap-4 border-b border-black/15 py-2.5"
                  >
                    <span className={`flex h-[50px] w-[86px] shrink-0 items-center justify-center overflow-hidden rounded-[7px] ${item.tone}`}>
                      <item.icon className="size-7 transition-transform duration-300 group-hover:scale-110" />
                    </span>
                    <span>
                      <span className="block text-[14px] font-medium group-hover:underline">{item.title}</span>
                      <span className="mt-0.5 block text-[11px] text-black/55">{item.description}</span>
                    </span>
                  </Link>
                ))}
              </div>
              <div className="mt-8 grid grid-cols-[1fr_1.35fr] gap-6 p-2">
                <div className="px-1 py-1">
                  <p className="font-mono text-[10px] uppercase tracking-[0.08em]">Accesos rápidos</p>
                  <div className="mt-4 space-y-1 text-[13px]">
                    <Link href="/dashboard" className="block hover:underline">Panel de control</Link>
                    <Link href="/productos" className="block hover:underline">Administrar productos</Link>
                    <Link href="/reportes" className="block hover:underline">Consultar reportes</Link>
                  </div>
                </div>
                <div className="rounded-[9px] bg-[#fff200] p-5">
                  <p className="max-w-sm text-[12px] leading-relaxed">Todo lo que necesitas para vender, controlar y hacer crecer tu negocio desde un solo lugar.</p>
                  <Link href="/register" className="mt-4 inline-block text-[14px] font-bold underline underline-offset-4">PROBAR GEK GRATIS</Link>
                  <div className="mt-6 flex gap-5 font-mono text-[10px] uppercase underline">
                    <Link href="/#funciones">Funciones</Link>
                    <Link href="/#precios">Precios</Link>
                    <Link href="/login">Ingresar</Link>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="absolute right-4 top-[27px] flex items-center gap-8 sm:right-8 lg:right-12">
          <Link href="/#funciones" aria-label="Buscar" className="hidden text-white transition-opacity hover:opacity-60 sm:block">
            <RiSearchLine className="size-[22px]" />
          </Link>
          <Link href="/login" className="hidden text-[12px] font-semibold underline underline-offset-2 sm:block">ES</Link>
          <Link href="/register" aria-label="Empezar ahora" className="flex size-9 items-center justify-center rounded-[3px] bg-black/80 lg:hidden">
            <RiMenuLine className="size-5" />
          </Link>
        </div>
      </div>
    </header>
  )
}
