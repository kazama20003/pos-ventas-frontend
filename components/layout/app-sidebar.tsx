"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"

import { siteConfig } from "@/lib/config/site"
import { useAuthContext } from "@/components/auth/auth-provider"
import { usePermisos } from "@/hooks/use-permisos"
import { SucursalSwitcher } from "@/components/layout/sucursal-switcher"

type Sub = { label: string; route: string }
type Modulo = {
  label: string
  desc: string
  route: string
  icon: string
  icon2?: string
  subs: Sub[]
  /** Si se define, el módulo solo se ve si el usuario tiene alguno de estos permisos. */
  perm?: string[]
}

// Riel de navegación. Los módulos de uso diario quedan visibles con su propio
// ícono; solo se agrupan las vistas secundarias afines (transferencias bajo
// inventario, proveedores bajo compras, empresas/plan bajo organización).
// Los sub-ítems apuntan únicamente a páginas reales.
const MODULOS: Modulo[] = [
  {
    label: "Dashboard",
    desc: "Resumen general del negocio",
    route: "/dashboard",
    icon: "M3 3h8v8H3zM13 3h8v5h-8zM13 12h8v9h-8zM3 15h8v6H3z",
    subs: [{ label: "Resumen", route: "/dashboard" }],
  },
  {
    label: "Ventas",
    desc: "Punto de venta y transacciones",
    route: "/ventas",
    icon: "M4 5h2l2.2 10.5a1 1 0 0 0 1 .8h8.6a1 1 0 0 0 1-.78L21 9H6.4",
    icon2: "M9.5 20h.01M17.5 20h.01",
    subs: [{ label: "Punto de venta", route: "/ventas" }],
    perm: ["ventas.crear", "ventas.devolver"],
  },
  {
    label: "Caja",
    desc: "Turnos y arqueos",
    route: "/caja",
    icon: "M2 7h20v10H2z",
    icon2: "M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM5.5 10.5h.01M18.5 13.5h.01",
    subs: [{ label: "Caja", route: "/caja" }],
    perm: ["caja.abrir", "caja.cerrar"],
  },
  {
    label: "Productos",
    desc: "Catálogo y precios",
    route: "/productos",
    icon: "M21 8l-9-5-9 5v8l9 5 9-5V8z",
    icon2: "M3 8l9 5 9-5M12 13v8",
    subs: [
      { label: "Catálogo", route: "/productos" },
      { label: "Marcas", route: "/marcas" },
    ],
    perm: ["catalogo.listar", "catalogo.crear", "catalogo.editar"],
  },
  {
    label: "Inventario",
    desc: "Stock y movimientos entre almacenes",
    route: "/inventario",
    icon: "M3 4h18v4H3z",
    icon2: "M5 8v12h14V8M10 12h4",
    subs: [
      { label: "Stock consolidado", route: "/inventario" },
      { label: "Transferencias", route: "/transferencias" },
      { label: "Conteos físicos", route: "/inventario/conteos" },
      { label: "Reservas", route: "/inventario/reservas" },
    ],
    perm: ["inventario.listar", "inventario.ajustar", "inventario.transferir"],
  },
  {
    label: "Clientes",
    desc: "Directorio y cuentas por cobrar",
    route: "/clientes",
    icon: "M16 19v-1a4 4 0 0 0-8 0v1",
    icon2: "M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    subs: [{ label: "Directorio", route: "/clientes" }],
    perm: ["clientes.listar", "clientes.crear"],
  },
  {
    label: "Compras",
    desc: "Órdenes, recepciones y proveedores",
    route: "/compras",
    icon: "M6 2l-3 4v14a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V6l-3-4z",
    icon2: "M3 6h18M16 10a4 4 0 0 1-8 0",
    subs: [
      { label: "Órdenes de compra", route: "/compras" },
      { label: "Proveedores", route: "/proveedores" },
    ],
    perm: ["compras.listar", "compras.crear", "proveedores.listar"],
  },
  {
    label: "Facturación",
    desc: "Comprobantes electrónicos",
    route: "/facturacion",
    icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
    icon2: "M14 2v6h6M9 13h6M9 17h4",
    subs: [{ label: "Comprobantes", route: "/facturacion" }],
    perm: ["facturacion.leer", "facturacion.emitir"],
  },
  {
    label: "Reportes",
    desc: "Análisis y exportaciones",
    route: "/reportes",
    icon: "M4 20h16",
    icon2: "M7 20v-6M12 20V9M17 20v-4",
    subs: [{ label: "Reportes", route: "/reportes" }],
    perm: ["reportes.leer"],
  },
  {
    label: "Organización",
    desc: "Sucursales, empresas y plan",
    route: "/sucursales",
    icon: "M3 21h18M6 21V7l6-4 6 4v14",
    icon2: "M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01",
    subs: [
      { label: "Sucursales y almacenes", route: "/sucursales" },
      { label: "Empresas", route: "/empresas" },
      { label: "Usuarios", route: "/usuarios" },
      { label: "Roles y permisos", route: "/roles" },
      { label: "Suscripción", route: "/suscripcion" },
    ],
    perm: [
      "sucursales.leer",
      "sucursales.gestionar",
      "empresas.leer",
      "usuarios.listar",
      "roles.listar",
      "suscripcion.leer",
    ],
  },
  {
    label: "Configuración",
    desc: "Ajustes del sistema",
    route: "/configuracion",
    icon: "M4 8h10M18 8h2M4 16h4M12 16h8",
    icon2: "M14 6v4M8 14v4",
    subs: [{ label: "General", route: "/configuracion" }],
  },
]

const ACCENT = "var(--primary)"
const ACCENT_SOFT = "color-mix(in oklab, var(--primary) 14%, transparent)"
const HOVER = "var(--sidebar-accent)"
const TEXT = "var(--foreground)"
const MUTED = "var(--muted-foreground)"
const BORDER = "var(--sidebar-border)"

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const { user, logout } = useAuthContext()
  const [mounted, setMounted] = React.useState(false)
  const [expanded, setExpanded] = React.useState(true)
  const [hoverIdx, setHoverIdx] = React.useState(-1)
  const [tip, setTip] = React.useState({ x: 0, y: 0 })
  const [avatarOpen, setAvatarOpen] = React.useState(false)
  const avatarRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => setMounted(true), [])
  const dark = mounted && resolvedTheme === "dark"

  const { can } = usePermisos()

  const matchRuta = React.useCallback(
    (route: string) => pathname === route || pathname.startsWith(route + "/"),
    [pathname]
  )

  // Módulos visibles según los permisos del usuario (gating de UI).
  const mods = React.useMemo(
    () => MODULOS.filter((m) => !m.perm || can(...m.perm)),
    [can]
  )

  // Módulo activo: coincide su ruta o la de alguno de sus sub-ítems.
  const active = React.useMemo(() => {
    const i = mods.findIndex(
      (m) => matchRuta(m.route) || m.subs.some((s) => matchRuta(s.route))
    )
    return i === -1 ? 0 : i
  }, [mods, matchRuta])

  // Sub-ítem activo derivado de la URL (sin estado ni efecto).
  const activeSub = React.useMemo(() => {
    const subs = mods[active]?.subs ?? []
    const j = subs.findIndex((s) => matchRuta(s.route))
    return j === -1 ? 0 : j
  }, [mods, active, matchRuta])

  React.useEffect(() => {
    if (!avatarOpen) return
    const onDown = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false)
      }
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [avatarOpen])

  const sec = mods[active]
  const nombre = user?.name || "Invitado"
  const correo = user?.email || "Sin sesión"
  const foto = user?.picture
  const initials = nombre.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()

  function clickModulo(i: number) {
    if (i === active && expanded) {
      setExpanded(false)
      return
    }
    setExpanded(true)
    router.push(mods[i].route)
  }

  function cerrarSesion() {
    logout()
    router.push("/login")
  }

  const themeIcon = dark
    ? "M12 3v2M12 19v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M3 12h2M19 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
    : "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"

  return (
    <aside
      style={{
        display: "flex",
        flexDirection: "column",
        width: expanded ? "330px" : "72px",
        background: "var(--card)",
        color: TEXT,
        borderRadius: 24,
        boxShadow: "0 12px 40px rgba(20,15,35,.10)",
        border: "1px solid " + BORDER,
        transition: "width .35s cubic-bezier(.4,0,.2,1), background .3s",
        position: "relative",
        flexShrink: 0,
        fontFamily: "var(--font-sora), sans-serif",
      }}
    >
      <style>{GK_CSS}</style>
      <div style={{ display: "flex", flex: 1, minHeight: 0, borderRadius: 24, overflow: "hidden" }}>
        <div
          style={{
            width: 72, flexShrink: 0, display: "flex", flexDirection: "column",
            alignItems: "center", padding: "14px 0", gap: 6,
            borderRight: "1px solid " + BORDER,
          }}
        >
          <div
            style={{
              width: 44, height: 44, borderRadius: 14, background: ACCENT,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--primary-foreground)", fontWeight: 700, fontSize: 18, letterSpacing: "-.5px",
            }}
          >
            {siteConfig.name.charAt(0)}
          </div>
          <div
            onClick={() => setExpanded((e) => !e)}
            title={expanded ? "Contraer panel" : "Expandir panel"}
            className="gk-pill"
            style={{
              width: 44, height: 28, display: "flex", alignItems: "center",
              justifyContent: "center", cursor: "pointer", color: MUTED,
              marginBottom: 2, borderRadius: 9,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "rotate(" + (expanded ? 180 : 0) + "deg)", transition: "transform .35s" }}>
              <path d="M6 5l7 7-7 7" />
              <path d="M13 5l7 7-7 7" />
            </svg>
          </div>
          <div style={{ width: 28, height: 1, background: BORDER, marginBottom: 4 }} />

          <div className="no-scrollbar" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, overflowY: "auto", flexShrink: 1, minHeight: 0 }}>
            {mods.map((m, i) => {
              const isActive = i === active
              const isHover = hoverIdx === i
              return (
                <div
                  key={m.route}
                  onClick={() => clickModulo(i)}
                  onMouseEnter={(e) => {
                    const r = e.currentTarget.getBoundingClientRect()
                    setHoverIdx(i)
                    setTip({ x: r.right + 12, y: r.top + r.height / 2 })
                  }}
                  onMouseLeave={() => setHoverIdx(-1)}
                  style={{
                    width: 44, height: 44, flexShrink: 0, borderRadius: 14, display: "flex",
                    alignItems: "center", justifyContent: "center", cursor: "pointer",
                    background: isActive ? ACCENT_SOFT : isHover ? HOVER : "transparent",
                    color: isActive ? ACCENT : isHover ? TEXT : MUTED,
                    transform: "scale(" + (isHover ? 1.1 : 1) + ")",
                    transition: "background .2s, color .2s, transform .15s",
                  }}
                >
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d={m.icon} />
                    {m.icon2 ? <path d={m.icon2} /> : null}
                  </svg>
                </div>
              )
            })}
          </div>

          <div style={{ flex: 1, minHeight: 8 }} />

          <div
            onClick={() => setTheme(dark ? "light" : "dark")}
            title="Cambiar tema"
            className="gk-pill"
            style={{
              width: 44, height: 44, flexShrink: 0, borderRadius: 14, display: "flex",
              alignItems: "center", justifyContent: "center", cursor: "pointer", color: MUTED,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d={themeIcon} />
            </svg>
          </div>

          <div ref={avatarRef} style={{ position: "relative", flexShrink: 0 }}>
            <div
              onClick={() => setAvatarOpen((v) => !v)}
              style={{
                width: 44, height: 44, borderRadius: "50%", cursor: "pointer",
                padding: 2, border: "2px solid " + BORDER, boxSizing: "border-box", marginTop: 4,
              }}
            >
              {foto ? (
                <img src={foto} alt={nombre} referrerPolicy="no-referrer" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "linear-gradient(135deg,#e8683a,#f2a03d)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 600 }}>
                  {initials}
                </div>
              )}
            </div>

            {avatarOpen ? (
              <div
                style={{
                  position: "absolute", left: 6, bottom: 54, width: 210,
                  background: "var(--popover)", borderRadius: 16,
                  boxShadow: "0 16px 40px rgba(20,15,35,.22)", padding: 8, zIndex: 50,
                  border: "1px solid " + BORDER,
                }}
              >
                <div style={{ padding: "10px 12px 8px" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nombre}</div>
                  <div style={{ fontSize: 11, color: MUTED, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{correo}</div>
                </div>
                <div style={{ height: 1, background: BORDER, margin: "4px 8px" }} />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div onClick={() => router.push("/configuracion")} className="gk-pill" style={{ padding: "9px 12px", borderRadius: 10, fontSize: 13, cursor: "pointer", color: TEXT }}>Mi perfil</div>
                  <div onClick={() => router.push("/configuracion")} className="gk-pill" style={{ padding: "9px 12px", borderRadius: 10, fontSize: 13, cursor: "pointer", color: TEXT }}>Preferencias</div>
                  <div onClick={cerrarSesion} className="gk-danger" style={{ padding: "9px 12px", borderRadius: 10, fontSize: 13, cursor: "pointer", color: "var(--destructive)", transition: "background .2s" }}>Cerrar sesión</div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div
          style={{
            flex: 1, minWidth: 0, display: "flex", flexDirection: "column",
            padding: "20px 18px", opacity: expanded ? 1 : 0,
            transition: "opacity .25s .1s", pointerEvents: expanded ? "auto" : "none",
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <SucursalSwitcher />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: TEXT, whiteSpace: "nowrap" }}>{sec.label}</div>
            <div
              onClick={() => setExpanded(false)}
              className="gk-pill"
              style={{ width: 28, height: 28, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: MUTED }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 6l-6 6 6 6" /></svg>
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: MUTED, marginBottom: 18, whiteSpace: "nowrap" }}>{sec.desc}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {sec.subs.map((sub, j) => {
              const on = j === activeSub
              return (
                <div
                  key={sub.label}
                  onClick={() => router.push(sub.route)}
                  className={on ? undefined : "gk-pill"}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                    borderRadius: 12, cursor: "pointer", fontSize: 13.5, whiteSpace: "nowrap",
                    fontWeight: on ? 600 : 400, color: on ? TEXT : MUTED,
                    background: on ? HOVER : "transparent",
                  }}
                >
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: on ? ACCENT : "transparent" }} />
                  {sub.label}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div
        style={{
          position: "fixed", left: tip.x, top: tip.y, transform: "translateY(-50%)",
          background: "var(--foreground)", color: "var(--background)", fontSize: 11, fontWeight: 600,
          padding: "7px 12px", borderRadius: 10, whiteSpace: "nowrap", pointerEvents: "none",
          opacity: hoverIdx >= 0 ? 1 : 0, transition: "opacity .15s",
          boxShadow: "0 8px 24px rgba(20,15,35,.25)", zIndex: 60,
          fontFamily: "var(--font-sora), sans-serif",
        }}
      >
        {hoverIdx >= 0 ? (mods[hoverIdx]?.label ?? "") : ""}
      </div>
    </aside>
  )
}

const GK_CSS = `
  .gk-pill{transition:background .15s,color .15s}
  .gk-pill:hover{background:var(--sidebar-accent)}
  .gk-danger:hover{background:color-mix(in oklab, var(--destructive) 12%, transparent)}
`
