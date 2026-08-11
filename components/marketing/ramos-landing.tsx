"use client"

import * as React from "react"
import Link from "next/link"
import { Poppins } from "next/font/google"

import { siteConfig } from "@/lib/config/site"
import { cn } from "@/lib/utils"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
})

/* Paleta del diseño "Ramos" (Claude Design). Colores propios de la landing,
   independientes del tema de la app: la página es siempre clara con nav y
   footer oscuros. */
const ACCENT = "#f43a1d"
const DARK = "#161616"
const YELLOW = "#ffc728"

/** Alturas de las barras del mini-dashboard del hero (del diseño original). */
const BARS = [45, 60, 95, 80, 55, 70, 100, 62, 78, 50, 88, 66, 92, 58]
const TABLET_BARS: Array<[string, number]> = [
  ["Lun", 55],
  ["Mar", 90],
  ["Mié", 48],
  ["Jue", 38],
  ["Vie", 60],
  ["Sáb", 50],
]

const NAV_LINKS = [
  { href: "#funciones", label: "Funciones" },
  { href: "#explorar", label: "Explorar", activo: true },
  { href: "#soluciones", label: "Soluciones" },
  { href: "#herramientas", label: "Herramientas" },
  { href: "#contacto", label: "Contacto" },
]

/** Logo circular doble anillo del diseño Ramos. */
function LogoAnillos({ size = 24, border = 3 }: { size?: number; border?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full"
      style={{ width: size, height: size, border: `${border}px solid currentColor` }}
    >
      <span
        className="rounded-full"
        style={{
          width: size / 3,
          height: size / 3,
          border: `${border}px solid currentColor`,
        }}
      />
    </span>
  )
}

/**
 * Landing principal del POS con el diseño "Ramos Landing" (Claude Design):
 * loader de intro, nav pill oscura, hero tipográfico con palabras animadas y
 * tarjeta de dashboard flotante, marquee amarillo, grid de funciones, sección
 * de insights y footer oscuro con marca gigante. Adaptado a Gekko: textos en
 * español, métricas de POS y CTAs a /register y /login.
 */
export function RamosLanding() {
  const [loader, setLoader] = React.useState<"visible" | "saliendo" | "oculto">(
    "visible",
  )

  React.useEffect(() => {
    const t1 = setTimeout(() => setLoader("saliendo"), 1400)
    const t2 = setTimeout(() => setLoader("oculto"), 1950)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  return (
    <div className={cn(poppins.className, "min-h-svh bg-white text-[#161616]")}>
      <style>{`
        @keyframes rz-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.12); } }
        @keyframes rz-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes rz-word-in { from { transform: rotate(160deg) translateY(70px); opacity: 0; } to { transform: rotate(0deg) translateY(0); opacity: 1; } }
        @keyframes rz-card-in { from { transform: rotate(-2deg) translateY(60px); opacity: 0; } to { transform: rotate(-2deg) translateY(0); opacity: 1; } }
        @keyframes rz-loadbar { from { width: 30px; } to { width: min(280px, 40vw); } }
        @keyframes rz-fade-up { from { opacity: 0; transform: translateY(80px); } to { opacity: 1; transform: translateY(0); } }
        .rz-word { display: inline-block; animation: rz-word-in 1s cubic-bezier(0.16, 0.8, 0.3, 1) both; }
        @supports (animation-timeline: view()) {
          .rz-reveal { animation: rz-fade-up linear both; animation-timeline: view(); animation-range: entry 0% entry 55%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .rz-word, .rz-reveal { animation: none !important; }
        }
      `}</style>

      {/* Loader de intro */}
      {loader !== "oculto" ? (
        <div
          aria-hidden
          className="fixed inset-0 z-[1000] flex flex-col justify-between px-8 pb-10 pt-12 transition-opacity duration-500 sm:px-16 sm:pt-14"
          style={{ background: ACCENT, opacity: loader === "saliendo" ? 0 : 1 }}
        >
          <div className="text-lg tracking-wide text-white sm:text-xl">
            Punto de venta
          </div>
          <div>
            <div
              className="h-[5px] rounded-[3px] bg-white"
              style={{ animation: "rz-loadbar 1.2s ease-out both" }}
            />
            <div className="text-[clamp(80px,16vw,240px)] font-medium leading-[1.1] tracking-[-0.04em] text-white">
              {siteConfig.name}
              <span className="align-super text-[0.25em]">®</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Nav pill oscura: banda más ancha que el contenido (1600px vs 1440px)
          y con más altura/tipografía para darle mayor presencia. */}
      <div className="mx-auto w-full max-w-[1600px] px-4 pt-4 sm:px-6">
        <nav
          className="flex items-center justify-between rounded-[30px] py-4 pl-8 pr-4"
          style={{ background: DARK }}
        >
          <Link href="/" className="flex items-center gap-3 text-white">
            <LogoAnillos size={30} />
            <span className="text-[26px] font-semibold tracking-[-0.5px]">
              {siteConfig.name.toLowerCase()}
            </span>
          </Link>
          <div className="hidden items-center gap-0.5 rounded-[20px] bg-[#1f1f1f] p-1.5 lg:flex">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={cn(
                  "relative rounded-2xl px-6 py-3.5 text-base transition-colors",
                  l.activo
                    ? "bg-[#2a2a2a] text-white"
                    : "text-[#e8e8e8] hover:bg-[#2a2a2a] hover:text-white",
                )}
              >
                {l.label}
                {l.activo ? (
                  <span
                    className="absolute bottom-1 left-1/2 size-2 -translate-x-1/2 rounded-full"
                    style={{ background: ACCENT }}
                  />
                ) : null}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-[22px] px-6 py-[18px] text-base font-medium text-[#e8e8e8] transition-colors hover:text-white sm:block"
            >
              Ingresar
            </Link>
            <Link
              href="/register"
              className="rounded-[22px] bg-white px-7 py-[18px] text-base font-medium text-[#111111] transition-colors hover:bg-[#f43a1d] hover:text-white sm:px-9"
            >
              Crear cuenta
            </Link>
          </div>
        </nav>
      </div>

      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6">
        {/* Hero */}
        <div id="explorar" className="relative mt-14 lg:mt-[72px] lg:min-h-[560px]">
          {/* Tarjeta dashboard flotante */}
          <div
            className="relative z-[2] mx-auto mt-10 w-full max-w-[470px] lg:absolute lg:right-0 lg:top-0 lg:mt-0 lg:w-[440px]"
            style={{
              animation: "rz-card-in 1s cubic-bezier(0.16, 0.8, 0.3, 1) 2.5s both",
            }}
          >
            <div
              className="absolute -left-6 -top-6 z-[3] grid size-[58px] place-items-center rounded-full"
              style={{ background: ACCENT, boxShadow: "0 8px 24px rgba(244,58,29,0.35)" }}
            >
              <div className="flex gap-1">
                <div className="h-[17px] w-1 rounded-[2px] bg-white" />
                <div className="h-[17px] w-1 rounded-[2px] bg-white" />
              </div>
            </div>
            <div className="overflow-hidden rounded-xl bg-[#f6f5f3] shadow-[0_30px_60px_rgba(0,0,0,0.16)]">
              <div
                className="flex items-center justify-between px-3.5 py-[9px]"
                style={{ background: DARK }}
              >
                <div className="h-[7px] w-[130px] rounded bg-[#3a3a3a]" />
                <div className="flex items-center gap-1.5">
                  <div className="h-[7px] w-[34px] rounded bg-[#3a3a3a]" />
                  <div className="size-[15px] rounded-full" style={{ background: ACCENT }} />
                </div>
              </div>
              <div className="px-4 pb-0.5 pt-[13px]">
                <div className="text-[10px] text-[#8a8a8a]">Ventas del mes</div>
                <div className="flex items-baseline gap-2">
                  <div className="text-[26px] font-semibold">S/ 138,267</div>
                  <div className="rounded-lg bg-[#e8f6ee] px-[7px] py-px text-[10px] text-[#22a55a]">
                    +12%
                  </div>
                </div>
              </div>
              <div className="flex gap-3 px-4 pb-3.5 pt-2">
                <div className="min-w-0 flex-1">
                  <div className="flex h-[82px] items-end gap-[3px]">
                    {BARS.map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-[3px]"
                        style={{
                          height: `${h}%`,
                          background: i % 3 === 0 ? ACCENT : "#e6e4e0",
                        }}
                      />
                    ))}
                  </div>
                  <div className="mt-2.5 flex items-center justify-between border-t border-[#e4e2de] pt-2">
                    <div className="text-xs font-semibold">Reporte diario</div>
                    <div className="flex gap-[5px] text-[9px]">
                      <div className="rounded-[9px] px-2 py-[3px] text-white" style={{ background: DARK }}>
                        Dashboard
                      </div>
                      <div className="rounded-[9px] bg-[#ecebe8] px-2 py-[3px] text-[#8a8a8a]">
                        Reportes
                      </div>
                      <div className="rounded-[9px] bg-[#ecebe8] px-2 py-[3px] text-[#8a8a8a]">
                        Historial
                      </div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="mb-[5px] text-[11px] font-medium">Estadística de ventas</div>
                    <div className="flex gap-1.5">
                      {[
                        ["Utilidad", "S/ 26.4K", ACCENT],
                        ["Ingresos", "S/ 13.2K", YELLOW],
                        ["Ticket prom.", "S/ 109", "#22a55a"],
                      ].map(([label, valor, color]) => (
                        <div
                          key={label}
                          className="flex flex-1 items-center gap-1.5 rounded-lg bg-white px-2 py-1.5"
                        >
                          <div className="size-[18px] shrink-0 rounded-full" style={{ background: color }} />
                          <div>
                            <div className="text-[7px] text-[#8a8a8a]">{label}</div>
                            <div className="text-[10px] font-semibold">{valor}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="hidden w-[118px] shrink-0 flex-col gap-1.5 sm:flex">
                  <div className="rounded-lg bg-white px-2.5 py-2">
                    <div className="text-[9px] text-[#8a8a8a]">KPI de ventas</div>
                    <div className="mt-1 text-[6px] text-[#b5b5b5]">Venta promedio</div>
                    <div className="text-[11px] font-semibold">S/ 589,68</div>
                    <div className="mt-1 text-[6px] text-[#b5b5b5]">Compra promedio</div>
                    <div className="text-[11px] font-semibold">S/ 372,40</div>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-2">
                    <div className="size-5 shrink-0 rounded-full bg-[#d8d5d0]" />
                    <div>
                      <div className="text-[8px] font-semibold">Carla Huamán</div>
                      <div className="text-[6px] text-[#8a8a8a]">Cajera principal</div>
                    </div>
                  </div>
                  <div className="rounded-lg bg-white px-2.5 py-2">
                    <div className="text-[9px] font-medium">Visitas por día</div>
                    <svg width="100%" height="22" viewBox="0 0 90 22" fill="none" className="mt-1">
                      <polyline
                        points="2,18 18,12 34,15 50,7 66,9 84,3"
                        stroke={YELLOW}
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Titular gigante */}
          <h1 className="text-[clamp(44px,8.2vw,118px)] font-medium leading-none tracking-[-0.035em]">
            <span className="flex items-center gap-[0.15em] lg:pl-24">
              <span className="flex shrink-0" aria-hidden>
                <span className="grid size-[0.82em] place-items-center rounded-full bg-[#f1f0ee]">
                  <svg width="38%" height="38%" viewBox="0 0 24 24" fill="none">
                    <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" fill={ACCENT} />
                  </svg>
                </span>
                <span
                  className="ml-[-0.22em] grid size-[0.82em] place-items-center rounded-full"
                  style={{ background: ACCENT, animation: "rz-pulse 3s ease-in-out infinite" }}
                >
                  <svg width="42%" height="42%" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 15l5-5 4 3 7-8"
                      stroke="#fff"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="4" cy="15" r="2.2" fill="#fff" />
                    <circle cx="9" cy="10" r="2.2" fill="#fff" />
                    <circle cx="13" cy="13" r="2.2" fill="#fff" />
                    <circle cx="20" cy="5" r="2.2" fill="#fff" />
                  </svg>
                </span>
              </span>
              <span className="rz-word" style={{ animationDelay: "1.75s" }}>
                Ventas
              </span>
            </span>
            <span className="mt-4 flex gap-[0.24em] lg:mt-8 lg:pl-6 lg:pr-[440px]">
              <span className="rz-word" style={{ animationDelay: "1.9s" }}>
                que
              </span>
              <span className="rz-word text-[#c9c7c4]" style={{ animationDelay: "2.05s" }}>
                impulsan
              </span>
              <span className="rz-word" style={{ animationDelay: "2.2s" }}>
                tu
              </span>
            </span>
            <span className="mt-4 flex items-center gap-[0.2em] lg:mt-11 lg:justify-end">
              <span className="rz-word" style={{ animationDelay: "2.35s" }}>
                negocio
              </span>
              <span
                className="grid size-[0.88em] shrink-0 place-items-center rounded-full"
                style={{ background: YELLOW }}
                aria-hidden
              >
                <span className="flex items-center gap-[0.05em]">
                  <span className="h-[0.15em] w-[0.05em] rounded-full bg-[#161616]" />
                  <span className="h-[0.28em] w-[0.05em] rounded-full bg-[#161616]" />
                  <span className="h-[0.1em] w-[0.05em] rounded-full bg-[#161616]" />
                </span>
              </span>
              <span className="rz-word" style={{ animationDelay: "2.5s" }}>
                al futuro
              </span>
            </span>
          </h1>
        </div>

        {/* Herramientas: titular + marquee */}
        <section id="herramientas" className="rz-reveal mt-32 lg:mt-[190px]">
          <h2 className="text-[clamp(36px,6.6vw,96px)] font-medium leading-[1.08] tracking-[-0.03em]">
            <span className="block">
              Máxima <span className="text-[#c9c7c4]">eficiencia</span>
            </span>
            <span className="block">con un POS intuitivo</span>
          </h2>
          <div className="mt-12 flex flex-col items-center gap-6 lg:flex-row">
            <div className="flex shrink-0">
              <div className="grid size-[110px] place-items-center rounded-full bg-[#f1f0ee] lg:size-[130px]">
                <div className="grid size-11 place-items-center rounded-xl" style={{ background: ACCENT }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M2 12h4l3-7 4 14 3-7h6"
                      stroke="#fff"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
              <div
                className="-ml-[18px] grid size-[110px] place-items-center rounded-full text-center lg:size-[130px]"
                style={{ background: YELLOW }}
              >
                <div>
                  <div className="text-[22px] font-semibold">+30%</div>
                  <div className="text-[10px] leading-[1.4] text-[#4c4c4c]">
                    Acelera tu
                    <br />
                    operación diaria
                  </div>
                </div>
              </div>
            </div>
            <div
              className="w-full min-w-0 flex-1 overflow-hidden rounded-[90px] py-4"
              style={{ background: YELLOW }}
            >
              <div
                className="flex w-max whitespace-nowrap"
                style={{ animation: "rz-marquee 14s linear infinite" }}
              >
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="pr-[60px] text-[clamp(40px,6vw,92px)] font-medium tracking-[-0.03em]"
                  >
                    punto de venta&nbsp;&nbsp;·&nbsp;&nbsp;punto de venta&nbsp;&nbsp;·&nbsp;&nbsp;
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-16 flex flex-col justify-between gap-8 border-t border-[#ececea] pt-11 lg:flex-row lg:items-center lg:gap-[60px]">
            <p className="max-w-[620px] text-[17px] leading-[1.6]">
              Controla ventas, inventario, caja y facturación electrónica SUNAT desde un
              solo lugar para{" "}
              <span className="text-[#b5b3b0]">entender a fondo tu negocio</span>. Con
              nosotros tu empresa no solo se adapta: evoluciona.
            </p>
            <div className="flex shrink-0 gap-3">
              <Link
                href="/login"
                className="rounded-[18px] bg-[#f1f0ee] px-9 py-5 text-[15px] font-medium transition-colors hover:bg-[#e4e2df]"
              >
                Ya tengo cuenta
              </Link>
              <Link
                href="/register"
                className="rounded-[18px] px-9 py-5 text-[15px] font-medium text-white transition-colors hover:bg-[#d92c10]"
                style={{ background: ACCENT }}
              >
                Empezar gratis
              </Link>
            </div>
          </div>
        </section>

        {/* Funciones */}
        <section id="funciones" className="mt-36 lg:mt-[210px]">
          <h2 className="rz-reveal text-[clamp(36px,6.6vw,96px)] font-medium leading-[1.08] tracking-[-0.03em]">
            Resultados <span className="text-[#c9c7c4]">reales</span>
            <br />
            con datos de tu POS
          </h2>
          <div className="rz-reveal mt-14 flex flex-col gap-5 lg:mt-[72px] lg:flex-row">
            <div className="flex flex-[1.15] flex-col gap-9 rounded-[22px] border border-[#efeeec] bg-[#faf9f7] p-8 lg:flex-row lg:p-11">
              <div className="flex flex-1 flex-col">
                <div
                  className="self-start rounded-[10px] px-[18px] py-2.5 text-[15px] font-medium"
                  style={{ background: YELLOW, boxShadow: "0 6px 16px rgba(255,199,40,0.4)" }}
                >
                  Reportes al instante
                </div>
                <div className="mt-10 text-[27px] font-medium leading-[1.3] lg:mt-[90px]">
                  Tu operación clara, sin hojas de cálculo
                </div>
                <p className="mt-4 text-sm leading-[1.7] text-[#a3a19e]">
                  Una sola plataforma con todo lo que necesitas: el primer paso para
                  digitalizar tu negocio, de la bodega a la cadena multi-sucursal.
                </p>
              </div>
              <div className="w-full shrink-0 rounded-2xl bg-white p-[22px] shadow-[0_20px_44px_rgba(0,0,0,0.07)] lg:w-[300px]">
                <div className="text-[17px] font-medium">Estadística de ventas</div>
                <div className="mt-4 flex gap-3">
                  <div className="flex flex-1 items-center gap-2.5">
                    <div
                      className="grid size-11 shrink-0 place-items-center rounded-full"
                      style={{ background: ACCENT }}
                    >
                      <div className="size-4 rounded border-[2.5px] border-white" />
                    </div>
                    <div>
                      <div className="text-[11px] text-[#a3a19e]">Utilidad total</div>
                      <div className="text-xl font-semibold">S/ 26.4K</div>
                    </div>
                  </div>
                  <div className="w-[108px] shrink-0 rounded-xl bg-[#f6f5f3] px-3 py-2.5">
                    <div className="text-[11px] text-[#6d6b68]">Clientes</div>
                    <div className="my-1.5 h-[3px] w-[70%] rounded bg-[#22a55a]" />
                    <div className="flex items-center gap-[5px]">
                      <span className="text-lg font-semibold">5.6K</span>
                      <span className="rounded-lg bg-[#22a55a] px-[5px] py-px text-[8px] text-white">
                        +14%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="relative mt-4 rounded-xl border border-[#efeeec] p-3.5">
                  <div className="text-xs">Ventas por mes</div>
                  <svg width="100%" height="70" viewBox="0 0 240 70" fill="none" className="mt-2">
                    <polyline
                      points="8,58 40,44 72,48 104,26 136,34 168,28 200,30 232,12"
                      stroke={YELLOW}
                      strokeWidth="2.5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {[
                      [8, 58],
                      [72, 48],
                      [104, 26],
                      [168, 28],
                      [232, 12],
                    ].map(([cx, cy]) => (
                      <circle key={cx} cx={cx} cy={cy} r="3" fill={YELLOW} />
                    ))}
                  </svg>
                  <div className="flex justify-between px-1 pt-1 text-[8px] text-[#b5b3b0]">
                    <span>Ene</span>
                    <span>Feb</span>
                    <span>Mar</span>
                    <span>Abr</span>
                    <span>May</span>
                  </div>
                  <div
                    className="absolute -right-3.5 bottom-[18px] rounded-xl px-4 py-3"
                    style={{ background: ACCENT, boxShadow: "0 14px 30px rgba(244,58,29,0.35)" }}
                  >
                    <div className="flex items-center justify-between gap-[18px]">
                      <span className="text-[11px] text-white/80">Crecimiento</span>
                      <div className="size-3 rounded-full border-[1.5px] border-white/70" />
                    </div>
                    <div className="mt-0.5 text-xl font-semibold text-white">+ 58%</div>
                  </div>
                </div>
              </div>
            </div>
            <div
              className="flex flex-1 flex-col items-center rounded-[22px] p-8 lg:p-11"
              style={{ background: DARK }}
            >
              <div className="flex w-full gap-3.5">
                <div className="flex flex-1 flex-col items-center gap-[22px] rounded-[18px] border border-[#2c2c2c] bg-[#212121] p-6">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                    <path d="M12 3 3 8l9 5 9-5-9-5z" fill={YELLOW} />
                    <path d="M3 12.5l9 5 9-5" stroke={YELLOW} strokeWidth="1.6" />
                    <path d="M3 16.5l9 5 9-5" stroke={YELLOW} strokeWidth="1.6" opacity="0.5" />
                  </svg>
                  <div className="flex">
                    <div className="size-10 rounded-full border-2 border-[#212121] bg-[#cbb9a5]" />
                    <div className="-ml-3 size-10 rounded-full border-2 border-[#212121] bg-[#8f9aa8]" />
                  </div>
                </div>
                <div className="flex-1 rounded-[18px] border border-[#2c2c2c] bg-[#212121] p-6">
                  <div className="text-sm text-[#d6d4d1]">Transacciones</div>
                  <div className="mt-3.5 flex items-center gap-1.5">
                    <div className="grid size-4 place-items-center rounded-full bg-[#22a55a]">
                      <svg width="8" height="8" viewBox="0 0 8 8">
                        <path
                          d="M4 7V1M1.5 3.5 4 1l2.5 2.5"
                          stroke="#fff"
                          strokeWidth="1.4"
                          fill="none"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <span className="text-[10px] text-[#22a55a]">+14%</span>
                  </div>
                  <div className="mt-1.5 text-[44px] font-medium text-white">43K</div>
                </div>
              </div>
              <div className="mt-8 text-[27px] font-medium text-white lg:mt-11">
                Todo bajo control
              </div>
              <p className="mt-3.5 max-w-[330px] text-center text-sm leading-[1.7] text-[#8b8987]">
                Caja, inventario, compras y comprobantes electrónicos: una vista completa
                de los aspectos clave de tu operación.
              </p>
            </div>
          </div>

          <div className="rz-reveal mt-5 flex flex-col gap-5 lg:flex-row">
            <div className="flex-1 rounded-[22px] border border-[#efeeec] bg-[#faf9f7] p-8 text-center lg:p-12">
              <div className="text-[25px] font-medium">Atiende mejor a tus clientes</div>
              <p className="mx-auto mt-4 max-w-[420px] text-sm leading-[1.7] text-[#a3a19e]">
                Historial de compras, cuentas por cobrar y promociones que se aplican
                solas en caja: menos fricción, clientes más satisfechos.
              </p>
            </div>
            <div className="hidden w-[120px] shrink-0 place-items-center lg:grid">
              <div
                className="grid size-24 place-items-center rounded-[26px] text-white"
                style={{ background: ACCENT, boxShadow: "0 18px 40px rgba(244,58,29,0.35)" }}
              >
                <LogoAnillos size={34} border={4} />
              </div>
            </div>
            <div className="flex-1 rounded-[22px] border border-[#efeeec] bg-[#faf9f7] p-8 text-center lg:p-12">
              <div className="text-[25px] font-medium">Indicadores siempre a la vista</div>
              <p className="mx-auto mt-4 max-w-[420px] text-sm leading-[1.7] text-[#a3a19e]">
                Ventas por sucursal, top de productos y cierre de caja del día: los KPI
                que miden el éxito de tu negocio, sin esperar al contador.
              </p>
            </div>
          </div>
        </section>

        {/* Soluciones */}
        <section
          id="soluciones"
          className="rz-reveal mt-36 flex flex-col items-start gap-10 lg:mt-[220px] lg:flex-row"
        >
          <h2 className="flex-1 pt-2 text-[clamp(36px,6vw,88px)] font-medium leading-[1.1] tracking-[-0.03em] lg:pt-10">
            De tus datos
            <br />
            <span className="text-[#c9c7c4]">a decisiones</span>
          </h2>
          <div
            className="w-full shrink-0 rounded-[26px] p-3.5 shadow-[0_40px_80px_rgba(0,0,0,0.2)] lg:w-[640px]"
            style={{ background: DARK }}
          >
            <div className="overflow-hidden rounded-2xl bg-white">
              <div
                className="flex items-center justify-between rounded-t-2xl px-[18px] py-3"
                style={{ background: DARK }}
              >
                <div className="flex items-center gap-[7px] text-white">
                  <LogoAnillos size={15} border={2} />
                  <span className="text-[13px] font-semibold">
                    {siteConfig.name.toLowerCase()}
                  </span>
                </div>
                <div className="flex w-[220px] items-center gap-[7px] rounded-xl bg-[#2a2a2a] px-3.5 py-[7px]">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                    <circle cx="10" cy="10" r="7" stroke="#8a8a8a" strokeWidth="2" />
                    <path d="m15.5 15.5 4 4" stroke="#8a8a8a" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span className="text-[10px] text-[#8a8a8a]">Buscar producto</span>
                </div>
                <div className="size-[22px] rounded-full bg-[#d8d5d0]" />
              </div>
              <div className="px-6 pb-[26px] pt-5">
                <div className="text-[11px] text-[#8a8a8a]">Ventas de la semana</div>
                <div className="flex items-baseline gap-2.5">
                  <div className="text-4xl font-semibold">S/ 134,256</div>
                  <div className="rounded-lg bg-[#e8f6ee] px-[7px] py-0.5 text-[10px] text-[#22a55a]">
                    +21%
                  </div>
                </div>
                <div className="mt-[22px] flex h-[150px] items-end gap-2">
                  {TABLET_BARS.map(([label, h], i) => (
                    <div key={label} className="flex h-full flex-1 flex-col justify-end">
                      <div className="mb-1.5 text-center text-[10px] text-[#8a8a8a]">{label}</div>
                      <div
                        className="rounded-t-md"
                        style={{
                          height: `${h}%`,
                          background: i === 1 || i === 4 ? ACCENT : "#f1f0ee",
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Marca gigante */}
        <div className="rz-reveal mt-36 pb-20 lg:mt-[210px]">
          <div
            className="relative text-center text-[clamp(90px,24vw,350px)] font-medium leading-[0.9] tracking-[-0.04em]"
            style={{ color: ACCENT }}
          >
            {siteConfig.name}
            <span className="absolute ml-1.5 mt-[0.06em] text-[0.2em]">®</span>
          </div>
        </div>
      </div>

      {/* Footer oscuro */}
      <footer id="contacto" className="rounded-t-[40px] px-4 pb-16 pt-16 sm:px-6 lg:pb-[70px] lg:pt-[90px]" style={{ background: DARK }}>
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="flex flex-col justify-between gap-10 lg:flex-row lg:items-start lg:gap-[60px]">
            <div className="flex flex-wrap gap-6 pt-2 lg:gap-10 lg:pt-6">
              {NAV_LINKS.filter((l) => l.href !== "#contacto").map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="text-lg text-[#b5b3b0] transition-colors hover:text-white lg:text-[19px]"
                >
                  {l.label}
                </a>
              ))}
            </div>
            <a
              href="mailto:hola@gekko.pe"
              className="break-all text-[clamp(28px,5vw,76px)] font-normal tracking-[-0.02em] text-white transition-colors hover:text-[#f43a1d]"
            >
              hola@gekko.pe
            </a>
          </div>
          <div className="mt-14 flex flex-col gap-10 border-t border-[#2c2c2c] pt-12 sm:flex-row lg:gap-[120px]">
            <div>
              <div className="text-xl font-medium text-white">Lima</div>
              <div className="mt-3 text-[15px] leading-[1.7] text-[#8b8987]">
                Av. Javier Prado Este 492
                <br />
                San Isidro, Lima
                <br />
                +51 1 555 0134
              </div>
            </div>
            <div>
              <div className="text-xl font-medium text-white">Arequipa</div>
              <div className="mt-3 text-[15px] leading-[1.7] text-[#8b8987]">
                Calle Mercaderes 220
                <br />
                Cercado, Arequipa
                <br />
                +51 54 555 072
              </div>
            </div>
          </div>
          <div className="mt-16 flex flex-col justify-between gap-10 sm:flex-row sm:items-end lg:mt-[90px]">
            <div className="relative text-[clamp(64px,12vw,150px)] font-medium leading-[0.9] tracking-[-0.04em] text-white">
              {siteConfig.name}
              <span className="absolute ml-1 mt-[0.07em] text-[0.21em]">®</span>
            </div>
            <div className="flex items-center gap-7">
              <span className="text-[15px] text-[#6d6b68]">
                {siteConfig.description.split(":")[0]}
              </span>
              <div
                className="grid size-[92px] shrink-0 place-items-center rounded-3xl text-white"
                style={{ background: ACCENT }}
              >
                <LogoAnillos size={32} border={4} />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
