"use client"

import * as React from "react"

// Marca mostrada en el landing (independiente de siteConfig para no afectar el
// resto de la app).
const BRAND = "GekCompany"

// Landing portado del diseño "Sitio moderno" (Claude Design), rebrandeado al
// SaaS de ventas Gekko. Se conserva el header actual del sitio; aquí solo va el
// contenido de la página. Los colores salen de las variables de globals.css.
// Efecto clave: al bajar el scroll la tarjeta de medios se desplaza y hace zoom
// (más lento) hasta ocupar toda la pantalla y se queda fija al llegar.

const c = {
  ink: "var(--foreground)",
  paper: "var(--background)",
  brand: "var(--primary)",
  onBrand: "var(--primary-foreground)",
  muted: "var(--muted)",
  onMuted: "var(--muted-foreground)",
  secondary: "var(--secondary)",
  onSecondary: "var(--secondary-foreground)",
}

const t = {
  welcome: "Bienvenido al mundo de",
  explore: "EMPIEZA A EXPLORAR",
  weAre: `Somos ${BRAND}`,
  heroDesc:
    "El punto de venta en la nube para tiendas en movimiento. Vende, controla tu inventario y decide con datos claros. Porque tu negocio no puede detenerse.",
  slides: [
    { kicker: "Vende sin fricción", title: "Cobra en segundos, siempre listo.", cta: "Más información" },
    { kicker: "Inventario en vivo", title: "Tu stock, exacto en cada sucursal.", cta: "Ver funciones" },
    { kicker: "Decisiones con datos", title: "Reportes que cierran el círculo.", cta: "Descubre más" },
  ],
  manifesto:
    "Juntos hacemos crecer buenas tiendas. Ventas que cierran a tiempo. Fuertes en el mostrador. Confiables en la caja. Impulsados por los datos. Hechos para vender. Hechos para durar.",
  servicesTitle: "Lo que hacemos",
  servicesDesc:
    "Detrás de cada venta hay un sistema: caja, inventario, facturación y reportes trabajando juntos para que tu tienda cobre bien y crezca con claridad.",
  pills1: ["Punto de venta", "Inventario", "Control de caja", "Facturación SUNAT", "Multi-sucursal"],
  pills2: ["Reportes en vivo", "Código de barras", "Venta por peso", "Clientes", "Operación offline"],
  impactKicker: "NUESTRO IMPACTO",
  impactTitle:
    "¡Nos encanta trabajar con buena gente, negocios familiares y marcas que crecen!",
  touch: "Contáctanos",
  footerTitle: "Empieza a vender hoy.",
  footerDesc: "Rápidos en el mostrador. Confiables en la caja. ¿Listo para empezar?",
  footerCta: "¡Hablemos!",
  phoneLabel: "teléfono",
  addressLabel: "dirección",
  address: "Av. Principal 123, Lima, Perú",
  privacy: "Aviso de privacidad",
}

// Colores de pastilla rotando entre tokens del tema.
const PILL_COLORS = [
  { bg: c.brand, fg: c.onBrand },
  { bg: c.ink, fg: c.paper },
  { bg: c.secondary, fg: c.onSecondary },
  { bg: c.muted, fg: c.onMuted },
]

const MARQ_DUR = "30s"
const MARQ_DUR_LOGOS = "36s"

function mkPills(arr: string[]) {
  const tripled = [...arr, ...arr, ...arr]
  return tripled.map((label, i) => ({ label, ...PILL_COLORS[i % PILL_COLORS.length] }))
}

export function HagemLanding() {
  const [slide, setSlide] = React.useState(0)
  const slideCount = t.slides.length

  const heroRef = React.useRef<HTMLElement>(null)
  const cardRef = React.useRef<HTMLDivElement>(null)
  const textRef = React.useRef<HTMLDivElement>(null)
  const manifestoRef = React.useRef<HTMLParagraphElement>(null)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const smoothYRef = React.useRef(0)

  const go = React.useCallback(
    (i: number) => setSlide(((i % slideCount) + slideCount) % slideCount),
    [slideCount]
  )

  // Autoplay del carrusel
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null)
  const startAuto = React.useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => setSlide((s) => (s + 1) % slideCount), 6000)
  }, [slideCount])

  React.useEffect(() => {
    startAuto()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [startAuto])

  // Scroll suave (Lenis-like) con rAF: la tarjeta se desplaza y hace zoom;
  // el texto del hero sube y se desvanece; el manifiesto revela palabras.
  React.useEffect(() => {
    const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
    let raf = 0

    const tick = () => {
      const hero = heroRef.current
      const card = cardRef.current
      const txt = textRef.current
      if (hero && card && txt) {
        const vh = window.innerHeight
        const target = Math.max(0, -hero.getBoundingClientRect().top)
        smoothYRef.current += (target - smoothYRef.current) * 0.14
        if (Math.abs(target - smoothYRef.current) < 0.3) smoothYRef.current = target
        const y = smoothYRef.current
        // Zoom: el recorrido del zoom se reparte sobre ~1.8 pantallas de scroll.
        // El texto sí acompaña al scroll normal.
        const k = clamp01(y / (vh * 1.8))
        const eb = 1 - Math.pow(1 - k, 2.2)
        card.style.top = 42 - eb * 42 + "vh"
        card.style.left = 19 - eb * 19 + "%"
        card.style.width = 40 + eb * 60 + "%"
        card.style.height = 56 + eb * 44 + "vh"
        card.style.borderRadius = 26 - eb * 26 + "px"
        txt.style.transform = "translateY(" + -y + "px)"
        txt.style.opacity = String(clamp01(1 - k * 1.4))

        // Controles del carrusel visibles desde el estado inicial.
        rootRef.current?.querySelectorAll<HTMLElement>("[data-heroctrl]").forEach((el) => {
          el.style.opacity = "1"
          el.style.pointerEvents = "auto"
        })
      }

      const p = manifestoRef.current
      if (p) {
        const vh2 = window.innerHeight
        const r = p.getBoundingClientRect()
        const prog = clamp01((vh2 * 0.85 - r.top) / (r.height + vh2 * 0.35))
        const words = p.querySelectorAll<HTMLElement>("[data-mword]")
        const n = Math.floor(prog * words.length * 1.15)
        words.forEach((w, i) => {
          w.style.color = i < n
            ? "var(--primary-foreground)"
            : "color-mix(in srgb, var(--primary-foreground) 22%, transparent)"
        })
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const manifestoWords = t.manifesto.split(" ")
  const pillsRow1 = mkPills(t.pills1)
  const pillsRow2 = mkPills(t.pills2)

  return (
    <div ref={rootRef} style={{ background: c.ink, color: c.paper, overflowX: "clip", fontFamily: "var(--font-sans)" }}>
      {/* Hero + carrusel: una sola sección, la tarjeta se expande al hacer scroll.
          Sección más alta (300vh) para que el zoom sea lento y quede fijo al llegar. */}
      <section
        ref={heroRef}
        id="inicio"
        style={{ position: "relative", height: "300vh", background: c.ink }}
      >
        <div
          id="proyectos"
          style={{
            position: "sticky",
            top: 0,
            height: "100vh",
            overflow: "hidden",
            background: c.ink,
          }}
        >
          {/* Fondo del hero estilo póster: split horizontal — arriba oscuro,
              bloque de color (--primary) abajo, divisor horizontal nítido. */}
          <div
            aria-hidden
            style={{ position: "absolute", left: 0, right: 0, top: "62%", bottom: 0, background: c.brand }}
          />

          {/* Capa de texto del hero */}
          <div
            ref={textRef}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              paddingTop: "22vh",
              willChange: "transform, opacity",
            }}
          >
            <div style={{ padding: "0 4vw" }}>
              <p
                style={{
                  margin: "0 0 1vh 4px",
                  fontSize: "clamp(15px, 1.4vw, 22px)",
                  fontWeight: 500,
                  color: c.paper,
                  animation: "hagem-fadeUp 0.9s 0.2s ease both",
                }}
              >
                {t.welcome}
              </p>
            </div>
            <div style={{ overflow: "hidden" }}>
              <h1 style={{ ...heroTitle, color: c.paper }}>{BRAND}</h1>
            </div>
            <div
              style={{
                borderTop: "1px solid color-mix(in srgb, var(--background) 30%, transparent)",
                margin: "1vh 4vw 0 4vw",
              }}
            />
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: "4vw",
                padding: "0 4vw 4vh 4vw",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  animation: "hagem-fadeUp 0.9s 0.9s ease both",
                }}
              >
                <span style={{ fontSize: 22, color: c.paper }}>↓</span>
                <span style={{ fontSize: 12, letterSpacing: 3, fontWeight: 600, color: c.paper }}>
                  {t.explore}
                </span>
              </div>
              <div style={{ maxWidth: 420, animation: "hagem-fadeUp 0.9s 1s ease both" }}>
                <p style={{ margin: "0 0 6px 0", fontWeight: 800, fontSize: 15, color: c.onBrand }}>
                  {t.weAre}
                </p>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: c.paper }}>
                  {t.heroDesc}
                </p>
              </div>
            </div>
          </div>

          {/* Tarjeta de medios: crece de tarjeta a pantalla completa */}
          <div
            ref={cardRef}
            style={{
              position: "absolute",
              top: "42vh",
              left: "19%",
              width: "40%",
              height: "56vh",
              borderRadius: 26,
              overflow: "hidden",
              animation: "hagem-fadeUp 1s 0.7s ease both",
              willChange: "top, left, width, height",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                transition: "transform 0.8s cubic-bezier(0.65, 0, 0.35, 1)",
                transform: `translateX(-${slide * 100}%)`,
              }}
            >
              {t.slides.map((s, i) => (
                <div key={i} style={{ position: "relative", flex: "0 0 100%", width: "100%", height: "100%" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/gekko-hero.jpg"
                    alt={s.title}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "center",
                      display: "block",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)",
                      pointerEvents: "none",
                    }}
                  />
                  <div style={{ position: "absolute", left: 24, bottom: 24, pointerEvents: "none" }}>
                    <div data-heroctrl style={{ opacity: 1 }}>
                      <p style={{ margin: "0 0 8px 0", fontSize: 14, fontWeight: 600, color: "#fff" }}>
                        {s.kicker}
                      </p>
                      <h2
                        style={{
                          margin: "0 0 20px 0",
                          color: "#fff",
                          fontWeight: 900,
                          fontSize: "clamp(32px, 4.5vw, 64px)",
                          letterSpacing: "-1px",
                          lineHeight: 1,
                        }}
                      >
                        {s.title}
                      </h2>
                    </div>
                    <button
                      type="button"
                      style={{
                        pointerEvents: "auto",
                        background: c.brand,
                        border: "none",
                        color: c.onBrand,
                        borderRadius: 999,
                        padding: "13px 24px",
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: "pointer",
                      }}
                    >
                      {s.cta}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Controles del carrusel: dots + flechas, visibles desde el inicio */}
            <div data-heroctrl style={{ opacity: 1 }}>
              <div
                style={{
                  position: "absolute",
                  right: "4vw",
                  bottom: 32,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                {t.slides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      go(i)
                      startAuto()
                    }}
                    aria-label={`Ir al slide ${i + 1}`}
                    style={{
                      width: i === slide ? 44 : 26,
                      height: 4,
                      borderRadius: 2,
                      border: "none",
                      background: i === slide ? c.brand : "rgba(255,255,255,0.45)",
                      cursor: "pointer",
                      padding: 0,
                      transition: "all 0.4s",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Manifiesto */}
      <section
        style={{
          position: "relative",
          background: c.brand,
          padding: "16vh 6vw",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: "60vw",
            height: "60vw",
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(circle, color-mix(in srgb, ${c.onBrand} 22%, transparent), transparent 60%)`,
            filter: "blur(30px)",
            pointerEvents: "none",
          }}
        />
        <p
          ref={manifestoRef}
          style={{
            position: "relative",
            margin: 0,
            maxWidth: 1200,
            fontWeight: 800,
            fontSize: "clamp(28px, 4vw, 58px)",
            lineHeight: 1.25,
            letterSpacing: "-1px",
            color: c.onBrand,
          }}
        >
          {manifestoWords.map((w, i) => (
            <span
              key={i}
              data-mword
              style={{
                color: "color-mix(in srgb, var(--primary-foreground) 22%, transparent)",
                transition: "color 0.25s",
              }}
            >
              {w}{" "}
            </span>
          ))}
        </p>
      </section>

      {/* Servicios */}
      <section id="servicios" style={{ background: c.muted, padding: "12vh 0", overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "6vw",
            padding: "0 6vw 9vh 6vw",
            alignItems: "start",
          }}
        >
          <h2
            style={{
              margin: 0,
              color: c.ink,
              fontWeight: 900,
              fontSize: "clamp(36px, 4.5vw, 68px)",
              letterSpacing: "-2px",
              lineHeight: 1,
            }}
          >
            {t.servicesTitle}
          </h2>
          <p style={{ margin: 0, color: c.onMuted, fontSize: 16, lineHeight: 1.6, maxWidth: 520 }}>
            {t.servicesDesc}
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              width: "max-content",
              gap: 18,
              animation: `hagem-marqL ${MARQ_DUR} linear infinite`,
            }}
          >
            {pillsRow1.map((p, i) => (
              <span key={i} style={pillStyle(p.bg, p.fg)}>
                {p.label}
              </span>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              width: "max-content",
              gap: 18,
              animation: `hagem-marqR ${MARQ_DUR} linear infinite`,
            }}
          >
            {pillsRow2.map((p, i) => (
              <span key={i} style={pillStyle(p.bg, p.fg)}>
                {p.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Impacto / clientes */}
      <section style={{ background: c.ink, padding: "14vh 0 12vh 0", overflow: "hidden" }}>
        <div style={{ padding: "0 6vw 8vh 6vw", maxWidth: 1100 }}>
          <p style={{ margin: "0 0 14px 0", color: c.brand, fontWeight: 700, fontSize: 14, letterSpacing: 1 }}>
            {t.impactKicker}
          </p>
          <h2
            style={{
              margin: 0,
              color: c.paper,
              fontWeight: 900,
              fontSize: "clamp(30px, 3.8vw, 56px)",
              letterSpacing: "-1px",
              lineHeight: 1.15,
            }}
          >
            {t.impactTitle}
          </h2>
        </div>
        <div
          style={{
            display: "flex",
            width: "max-content",
            gap: 22,
            animation: `hagem-marqL ${MARQ_DUR_LOGOS} linear infinite`,
          }}
        >
          {[0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5].map((n, i) => (
            <div
              key={i}
              style={{
                width: 280,
                height: 110,
                border: "1.5px solid color-mix(in srgb, var(--background) 45%, transparent)",
                borderRadius: 999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "14px 30px",
                boxSizing: "border-box",
                color: c.paper,
                fontWeight: 800,
                fontSize: 15,
                opacity: 0.85,
              }}
            >
              Cliente {n + 1}
            </div>
          ))}
        </div>
      </section>

      {/* Get in touch marquee + footer */}
      <section id="contacto" style={{ background: c.brand, padding: "10vh 0 0 0", overflow: "hidden" }}>
        <div
          style={{
            display: "flex",
            width: "max-content",
            alignItems: "center",
            gap: "5vw",
            animation: "hagem-marqL 18s linear infinite",
          }}
        >
          {[0, 1, 2, 3].map((r) => (
            <div key={r} style={{ display: "flex", alignItems: "center", gap: "5vw" }}>
              <span
                style={{
                  color: c.onBrand,
                  fontWeight: 900,
                  fontSize: "clamp(90px, 13vw, 230px)",
                  letterSpacing: "-0.04em",
                  whiteSpace: "nowrap",
                  lineHeight: 1,
                }}
              >
                {t.touch}
              </span>
              <span
                style={{
                  color: "color-mix(in srgb, var(--primary-foreground) 65%, transparent)",
                  fontSize: "clamp(60px, 8vw, 140px)",
                  display: "inline-block",
                  animation: "hagem-spinSlow 10s linear infinite",
                }}
              >
                ✳
              </span>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", padding: "12vh 6vw 8vh 6vw" }}>
          <h2
            style={{
              margin: "0 0 18px 0",
              color: c.onBrand,
              fontWeight: 900,
              fontSize: "clamp(30px, 3.5vw, 52px)",
              letterSpacing: "-1px",
            }}
          >
            {t.footerTitle}
          </h2>
          <p
            style={{
              margin: "0 auto",
              maxWidth: 480,
              color: "color-mix(in srgb, var(--primary-foreground) 78%, transparent)",
              fontSize: 16,
              lineHeight: 1.6,
            }}
          >
            {t.footerDesc}
          </p>
          <a
            href="mailto:contacto@gekko.pe"
            style={{
              display: "inline-block",
              marginTop: 36,
              background: c.ink,
              color: c.onBrand,
              borderRadius: 999,
              padding: "16px 32px",
              fontWeight: 700,
              fontSize: 15,
              textDecoration: "none",
            }}
          >
            {t.footerCta}
          </a>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "4vw",
            padding: "6vh 6vw 5vh 6vw",
            borderTop: "1.5px solid color-mix(in srgb, var(--primary-foreground) 20%, transparent)",
          }}
        >
          <div>
            <p style={footLabel}>{t.phoneLabel}</p>
            <p style={footValue}>+51 000 000 000</p>
            <p style={footLabel}>WhatsApp</p>
            <p style={{ ...footValue, marginBottom: 0 }}>+51 000 000 000</p>
          </div>
          <div>
            <p style={footLabel}>email</p>
            <p style={footValue}>contacto@gekko.pe</p>
            <p style={footLabel}>instagram</p>
            <p style={{ ...footValue, marginBottom: 0 }}>@gekko.pe</p>
          </div>
          <div>
            <p style={footLabel}>{t.addressLabel}</p>
            <p style={{ ...footValue, marginBottom: 0, lineHeight: 1.3 }}>{t.address}</p>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "0 6vw 3vh 6vw",
            fontSize: 12,
            color: "color-mix(in srgb, var(--primary-foreground) 60%, transparent)",
          }}
        >
          <span>{BRAND} 2026</span>
          <span>{t.privacy}</span>
        </div>
      </section>
    </div>
  )
}

const heroTitle: React.CSSProperties = {
  margin: 0,
  paddingLeft: "4vw",
  fontWeight: 900,
  fontSize: "clamp(52px, 14vw, 300px)",
  lineHeight: 0.9,
  letterSpacing: "-0.045em",
  animation: "hagem-riseIn 1s 0.35s cubic-bezier(0.2, 0.7, 0.2, 1) both",
  whiteSpace: "nowrap",
}

function pillStyle(bg: string, fg: string): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    whiteSpace: "nowrap",
    borderRadius: 999,
    padding: "20px 34px",
    fontWeight: 700,
    fontSize: "clamp(16px, 1.5vw, 22px)",
    background: bg,
    color: fg,
  }
}

const footLabel: React.CSSProperties = {
  margin: "0 0 4px 0",
  fontSize: 12,
  fontWeight: 600,
  color: "color-mix(in srgb, var(--primary-foreground) 60%, transparent)",
}

const footValue: React.CSSProperties = {
  margin: "0 0 20px 0",
  fontSize: "clamp(18px, 1.8vw, 26px)",
  fontWeight: 800,
  color: "var(--primary-foreground)",
}
