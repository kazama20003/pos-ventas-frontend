"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiFlashlightFill,
  RiSafe2Line,
  RiSettings3Line,
  RiStore2Line,
} from "@remixicon/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthContext } from "@/components/auth/auth-provider"
import { registrarEmpresa } from "@/lib/api/onboarding"
import { guardarSesion, guardarPerfilDesdeIdToken } from "@/lib/auth/session"
import { ApiError } from "@/lib/api/client"
import { RUC_REGEX, TENANT_CODIGO_REGEX } from "@/lib/api/types"

const STEPS = ["Tu negocio", "Tu local", "Listo para vender"]

const DEFAULTS = {
  sucursalNombre: "Sucursal principal",
  almacenNombre: "Almacén principal",
  cajaNombre: "Caja principal",
}

type Form = {
  tenantNombre: string
  tenantCodigo: string
  organizacionNombre: string
  empresaRazonSocial: string
  empresaRuc: string
  adminNombre: string
  sucursalNombre: string
  sucursalDireccion: string
  almacenNombre: string
  cajaNombre: string
}

const FORM_INICIAL: Form = {
  tenantNombre: "",
  tenantCodigo: "",
  organizacionNombre: "",
  empresaRazonSocial: "",
  empresaRuc: "",
  adminNombre: "",
  sucursalNombre: DEFAULTS.sucursalNombre,
  sucursalDireccion: "",
  almacenNombre: DEFAULTS.almacenNombre,
  cajaNombre: DEFAULTS.cajaNombre,
}

/**
 * Lógica de registro compartida por los flujos rápido y manual. Preserva el
 * comportamiento exacto del onboarding original: guarda perfil desde el idToken,
 * guarda la sesión, refresca el perfil y navega al dashboard.
 */
function useRegistro(idToken: string) {
  const router = useRouter()
  const { refrescarPerfil } = useAuthContext()
  const [error, setError] = React.useState<string | null>(null)
  const [cargando, setCargando] = React.useState(false)

  const registrar = React.useCallback(
    async (form: Form) => {
      setError(null)
      setCargando(true)
      try {
        const res = await registrarEmpresa({
          idToken,
          tenantCodigo: form.tenantCodigo || undefined,
          tenantNombre: form.tenantNombre.trim(),
          organizacionNombre:
            form.organizacionNombre.trim() || form.tenantNombre.trim(),
          empresaRazonSocial: form.empresaRazonSocial.trim(),
          empresaRuc: form.empresaRuc,
          adminNombre: form.adminNombre.trim() || undefined,
          configuracionInicial: "RAPIDA",
          sucursalNombre: form.sucursalNombre.trim() || DEFAULTS.sucursalNombre,
          sucursalDireccion: form.sucursalDireccion.trim() || undefined,
          almacenNombre: form.almacenNombre.trim() || DEFAULTS.almacenNombre,
          cajaNombre: form.cajaNombre.trim() || DEFAULTS.cajaNombre,
        })
        guardarPerfilDesdeIdToken(idToken)
        guardarSesion(res.tokens)
        refrescarPerfil()
        router.push("/dashboard")
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : "No se pudo crear tu cuenta"
        )
        setCargando(false)
      }
    },
    [idToken, refrescarPerfil, router]
  )

  return { registrar, error, cargando, setError }
}

type Eleccion = "eleccion" | "rapido" | "manual"

/**
 * Pantalla de onboarding tras autenticarse con Google: primero deja elegir
 * entre empezar rápido o configurar manualmente, y luego renderiza el flujo
 * correspondiente. Se reutiliza en /register y en la vista de creación de
 * empresa del login.
 */
export function OnboardingFlow({ idToken }: { idToken: string }) {
  const [modo, setModo] = React.useState<Eleccion>("eleccion")

  if (modo === "eleccion") {
    return <Eleccion onElegir={setModo} />
  }
  if (modo === "rapido") {
    return (
      <FlujoRapido idToken={idToken} onAtras={() => setModo("eleccion")} />
    )
  }
  return <FlujoManual idToken={idToken} onAtras={() => setModo("eleccion")} />
}

// Compatibilidad: export usado históricamente. Ahora abre el flujo completo.
export const OnboardingForm = OnboardingFlow

function Eleccion({ onElegir }: { onElegir: (modo: Eleccion) => void }) {
  const [seleccion, setSeleccion] = React.useState<"rapido" | "manual" | null>(
    "rapido"
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">¿Cómo quieres empezar?</h2>
        <p className="text-sm text-muted-foreground">
          Elige una opción y pulsa continuar. Podrás cambiar todo después.
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label="Forma de empezar"
        className="grid gap-3"
      >
        <TarjetaEleccion
          seleccionada={seleccion === "rapido"}
          onSelect={() => setSeleccion("rapido")}
          onConfirm={() => onElegir("rapido")}
          recomendada
          icon={<RiFlashlightFill className="size-5" />}
          titulo="Empezar rápido"
          descripcion="Creamos tu sucursal, almacén y caja con valores por defecto. Empiezas a vender en un minuto."
        />
        <TarjetaEleccion
          seleccionada={seleccion === "manual"}
          onSelect={() => setSeleccion("manual")}
          onConfirm={() => onElegir("manual")}
          icon={<RiSettings3Line className="size-5" />}
          titulo="Configurar a mi manera"
          descripcion="Nombra tú mismo tu sucursal, almacén y caja. Ideal si ya tienes tu estructura clara."
        />
      </div>

      <Button
        type="button"
        size="lg"
        className="h-12 w-full rounded-xl text-base font-semibold"
        disabled={!seleccion}
        onClick={() => seleccion && onElegir(seleccion)}
      >
        Continuar
        <RiArrowRightLine className="size-4" />
      </Button>
    </div>
  )
}

function TarjetaEleccion({
  seleccionada,
  onSelect,
  onConfirm,
  icon,
  titulo,
  descripcion,
  recomendada,
}: {
  seleccionada: boolean
  onSelect: () => void
  onConfirm: () => void
  icon: React.ReactNode
  titulo: string
  descripcion: string
  recomendada?: boolean
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={seleccionada}
      onClick={onSelect}
      onDoubleClick={onConfirm}
      className={`group relative flex items-start gap-4 rounded-2xl border-2 p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 ${
        seleccionada
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border bg-card hover:border-primary/40 hover:bg-muted/40"
      }`}
    >
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors ${
          seleccionada
            ? "bg-primary text-primary-foreground"
            : "bg-primary/10 text-primary"
        }`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">{titulo}</p>
          {recomendada ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              Recomendado
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          {descripcion}
        </p>
      </div>
      <span
        aria-hidden="true"
        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          seleccionada
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/30"
        }`}
      >
        {seleccionada ? <RiCheckboxCircleLine className="size-3.5" /> : null}
      </span>
    </button>
  )
}

function ErrorBox({ mensaje }: { mensaje: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
      <RiErrorWarningLine className="mt-0.5 size-4 shrink-0" />
      <span>{mensaje}</span>
    </div>
  )
}

function BotonAtras({
  onClick,
  disabled,
}: {
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      disabled={disabled}
    >
      <RiArrowLeftLine /> Atrás
    </Button>
  )
}

// ── Flujo rápido: un solo paso ────────────────────────────────────────────
function FlujoRapido({
  idToken,
  onAtras,
}: {
  idToken: string
  onAtras: () => void
}) {
  const { registrar, error, cargando } = useRegistro(idToken)
  const [form, setForm] = React.useState<Form>(FORM_INICIAL)

  const set = (key: keyof Form) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }))

  const codigoOk =
    form.tenantCodigo === "" || TENANT_CODIGO_REGEX.test(form.tenantCodigo)
  const valido =
    codigoOk &&
    RUC_REGEX.test(form.empresaRuc) &&
    form.tenantNombre.trim().length >= 2 &&
    form.empresaRazonSocial.trim().length >= 2

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (valido && !cargando) void registrar(form)
      }}
      className="flex flex-col gap-6"
    >
      <div className="flex gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <RiFlashlightFill className="size-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">Empieza rápido</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Solo necesitamos los datos de tu negocio. Creamos tu sucursal,
            almacén y caja por ti.
          </p>
        </div>
      </div>

      {error ? <ErrorBox mensaje={error} /> : null}

      <DatosNegocio form={form} set={set} codigoOk={codigoOk} />

      <div className="flex items-center justify-between gap-3 border-t pt-5">
        <BotonAtras onClick={onAtras} disabled={cargando} />
        <Button type="submit" disabled={!valido || cargando}>
          {cargando ? "Preparando tu espacio…" : "Crear y empezar a vender"}
        </Button>
      </div>
    </form>
  )
}

// ── Flujo manual: wizard de 3 pasos ───────────────────────────────────────
function FlujoManual({
  idToken,
  onAtras,
}: {
  idToken: string
  onAtras: () => void
}) {
  const { registrar, error, cargando, setError } = useRegistro(idToken)
  const [step, setStep] = React.useState(0)
  const [form, setForm] = React.useState<Form>(FORM_INICIAL)

  const set = (key: keyof Form) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }))

  const codigoOk =
    form.tenantCodigo === "" || TENANT_CODIGO_REGEX.test(form.tenantCodigo)
  const negocioValido =
    codigoOk &&
    RUC_REGEX.test(form.empresaRuc) &&
    form.tenantNombre.trim().length >= 2 &&
    form.empresaRazonSocial.trim().length >= 2
  const localValido = form.sucursalNombre.trim().length >= 2
  const puntoVentaValido =
    form.almacenNombre.trim().length >= 2 && form.cajaNombre.trim().length >= 2
  const puedeAvanzar = [negocioValido, localValido, puntoVentaValido][step]

  function avanzar() {
    if (!puedeAvanzar) return
    setError(null)
    if (step === STEPS.length - 1) {
      if (!cargando) void registrar(form)
      return
    }
    setStep((current) => current + 1)
  }

  function retroceder() {
    if (step === 0) {
      onAtras()
      return
    }
    setStep((current) => current - 1)
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        avanzar()
      }}
      className="flex flex-col gap-6"
    >
      <div className="flex gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <RiSettings3Line className="size-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">Configura tu negocio</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tres pasos rápidos para dejar tu punto de venta listo.
          </p>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2">
          {STEPS.map((label, index) => (
            <React.Fragment key={label}>
              {index > 0 ? (
                <span className="h-px flex-1 bg-border" aria-hidden="true" />
              ) : null}
              <div className="flex items-center gap-1.5">
                <span
                  className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold ${
                    index < step
                      ? "bg-emerald-500 text-white"
                      : index === step
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index < step ? (
                    <RiCheckboxCircleLine className="size-4" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={`hidden text-xs font-medium sm:inline ${
                    index === step ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Paso {step + 1} de {STEPS.length}
        </p>
      </div>

      {error ? <ErrorBox mensaje={error} /> : null}

      {step === 0 ? (
        <DatosNegocio form={form} set={set} codigoOk={codigoOk} />
      ) : null}
      {step === 1 ? <DatosLocal form={form} set={set} /> : null}
      {step === 2 ? <DatosPuntoVenta form={form} set={set} /> : null}

      <div className="flex items-center justify-between gap-3 border-t pt-5">
        <BotonAtras onClick={retroceder} disabled={cargando} />
        <Button type="submit" disabled={!puedeAvanzar || cargando}>
          {cargando ? (
            "Preparando tu espacio…"
          ) : step === STEPS.length - 1 ? (
            "Crear mi espacio"
          ) : (
            <>
              Continuar <RiArrowRightLine />
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

type SectionProps = {
  form: Form
  set: (key: keyof Form) => (value: string) => void
}

function DatosNegocio({
  form,
  set,
  codigoOk,
}: SectionProps & { codigoOk: boolean }) {
  return (
    <div className="grid gap-5">
      <div>
        <h2 className="text-lg font-semibold">Cuéntanos sobre tu negocio</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Estos datos identifican tu empresa y su administrador.
        </p>
      </div>
      <Campo label="Nombre del negocio" htmlFor="tenantNombre">
        <Input
          id="tenantNombre"
          placeholder="Mi Bodega"
          value={form.tenantNombre}
          onChange={(e) => set("tenantNombre")(e.target.value)}
          autoFocus
        />
      </Campo>
      <Campo label="Razón social" htmlFor="empresaRazonSocial">
        <Input
          id="empresaRazonSocial"
          placeholder="Mi Bodega S.A.C."
          value={form.empresaRazonSocial}
          onChange={(e) => set("empresaRazonSocial")(e.target.value)}
        />
      </Campo>
      <Campo label="RUC" htmlFor="empresaRuc">
        <Input
          id="empresaRuc"
          placeholder="20123456789"
          inputMode="numeric"
          maxLength={11}
          value={form.empresaRuc}
          onChange={(e) => set("empresaRuc")(e.target.value.replace(/\D/g, ""))}
        />
      </Campo>
      <Campo label="Tu nombre" htmlFor="adminNombre" optional>
        <Input
          id="adminNombre"
          placeholder="Tu nombre y apellido"
          value={form.adminNombre}
          onChange={(e) => set("adminNombre")(e.target.value)}
        />
      </Campo>
      <details className="rounded-xl border px-3 py-2">
        <summary className="cursor-pointer text-sm font-medium">
          Opciones avanzadas
        </summary>
        <div className="mt-3 grid gap-3">
          <Campo label="Organización" htmlFor="organizacionNombre">
            <Input
              id="organizacionNombre"
              placeholder="Mi Bodega S.A.C."
              value={form.organizacionNombre}
              onChange={(e) => set("organizacionNombre")(e.target.value)}
            />
          </Campo>
          <Campo label="Código de empresa" htmlFor="tenantCodigo" optional>
            <Input
              id="tenantCodigo"
              placeholder="se genera automáticamente"
              value={form.tenantCodigo}
              aria-invalid={!codigoOk}
              onChange={(e) => set("tenantCodigo")(e.target.value.trim())}
            />
          </Campo>
        </div>
      </details>
    </div>
  )
}

function DatosLocal({ form, set }: SectionProps) {
  return (
    <div className="grid gap-5">
      <div className="flex gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <RiStore2Line className="size-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">¿Dónde venderás?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Crea tu primera sucursal. Después podrás añadir más locales.
          </p>
        </div>
      </div>
      <Campo label="Nombre de la sucursal" htmlFor="sucursalNombre">
        <Input
          id="sucursalNombre"
          value={form.sucursalNombre}
          onChange={(e) => set("sucursalNombre")(e.target.value)}
          autoFocus
        />
      </Campo>
      <Campo label="Dirección" htmlFor="sucursalDireccion" optional>
        <Input
          id="sucursalDireccion"
          placeholder="Av. Principal 123"
          value={form.sucursalDireccion}
          onChange={(e) => set("sucursalDireccion")(e.target.value)}
        />
      </Campo>
    </div>
  )
}

function DatosPuntoVenta({ form, set }: SectionProps) {
  return (
    <div className="grid gap-5">
      <div className="flex gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
          <RiSafe2Line className="size-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">Prepara tu punto de venta</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Usaremos estos nombres para controlar tu stock y cobrar.
          </p>
        </div>
      </div>
      <Campo label="Nombre del almacén" htmlFor="almacenNombre">
        <Input
          id="almacenNombre"
          value={form.almacenNombre}
          onChange={(e) => set("almacenNombre")(e.target.value)}
          autoFocus
        />
      </Campo>
      <Campo label="Nombre de la caja" htmlFor="cajaNombre">
        <Input
          id="cajaNombre"
          value={form.cajaNombre}
          onChange={(e) => set("cajaNombre")(e.target.value)}
        />
      </Campo>
      <p className="rounded-xl bg-muted px-3 py-2.5 text-xs leading-5 text-muted-foreground">
        Crearemos la sucursal, el almacén y la caja en una sola operación. Solo
        faltará agregar un producto y abrir caja para vender.
      </p>
    </div>
  )
}

function Campo({
  label,
  htmlFor,
  optional,
  children,
}: {
  label: string
  htmlFor: string
  optional?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>
        {label}
        {optional ? (
          <span className="text-muted-foreground"> (opcional)</span>
        ) : null}
      </Label>
      {children}
    </div>
  )
}
