"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  RiErrorWarningLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiBuilding2Line,
  RiCheckboxCircleFill,
} from "@remixicon/react"

import { Button } from "@/components/ui/button"
import { GoogleButton, useGooglePrompt } from "@/components/auth/google-button"
import { OnboardingForm } from "@/components/auth/onboarding-form"
import { useAuthContext } from "@/components/auth/auth-provider"
import { loginGoogle } from "@/lib/api/auth"
import { guardarSesion, guardarPerfilDesdeIdToken } from "@/lib/auth/session"
import { ApiError } from "@/lib/api/client"
import type { SeleccionTenantRequerida, TenantResumen } from "@/lib/api/types"

type Vista =
  | { tipo: "inicio" }
  | { tipo: "seleccion"; idToken: string; empresas: TenantResumen[] }
  | { tipo: "onboarding"; idToken: string }

export default function LoginPage() {
  const router = useRouter()
  const { refrescarPerfil } = useAuthContext()
  const [vista, setVista] = React.useState<Vista>({ tipo: "inicio" })
  const [error, setError] = React.useState<string | null>(null)
  const [cargando, setCargando] = React.useState(false)
  const [correo, setCorreo] = React.useState("")
  const [novedades, setNovedades] = React.useState(true)

  async function ingresar(idToken: string, tenantCodigo?: string) {
    setError(null)
    setCargando(true)
    try {
      const tokens = await loginGoogle({ idToken, tenantCodigo })
      guardarPerfilDesdeIdToken(idToken)
      guardarSesion(tokens)
      refrescarPerfil()
      router.push("/dashboard")
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        const body = e.body as { codigo?: string }
        if (body?.codigo === "SIN_TENANT") {
          setVista({ tipo: "onboarding", idToken })
          return
        }
        if (body?.codigo === "SELECCION_TENANT_REQUERIDA") {
          setVista({ tipo: "seleccion", idToken, empresas: (body as SeleccionTenantRequerida).tenants })
          return
        }
      }
      setError(e instanceof ApiError ? e.message : "No se pudo iniciar sesión")
    } finally {
      setCargando(false)
    }
  }

  const { prompt, listo, error: errorGoogle } = useGooglePrompt((token) =>
    ingresar(token)
  )

  if (vista.tipo === "onboarding") {
    return (
      <div className="flex flex-col gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Crea tu empresa</h1>
          <p className="text-sm text-muted-foreground">
            Tu cuenta aún no pertenece a ninguna empresa. Crea una para empezar.
          </p>
        </div>
        <OnboardingForm idToken={vista.idToken} />
        <VolverInicio onClick={() => setVista({ tipo: "inicio" })} />
      </div>
    )
  }

  if (vista.tipo === "seleccion") {
    return (
      <div className="flex flex-col gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Elige tu empresa</h1>
          <p className="text-sm text-muted-foreground">Tu correo está asociado a varias empresas.</p>
        </div>
        {error ? <ErrorBox mensaje={error} /> : null}
        <div className="flex flex-col gap-2">
          {vista.empresas.map((t) => (
            <button
              key={t.codigo}
              disabled={cargando}
              onClick={() => ingresar(vista.idToken, t.codigo)}
              className="flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors hover:bg-muted disabled:opacity-50"
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <RiBuilding2Line className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{t.nombre}</span>
                <span className="block truncate text-xs text-muted-foreground">{t.codigo}</span>
              </span>
            </button>
          ))}
        </div>
        <VolverInicio onClick={() => setVista({ tipo: "inicio" })} />
      </div>
    )
  }

  // Inicio — Google como acceso principal (entrar o registrarse).
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-0.5">
        <h1 className="text-2xl font-semibold tracking-tight">Iniciar sesión</h1>
        <p className="text-sm text-muted-foreground">
          Inicia sesión o crea una cuenta
        </p>
      </div>

      {error ? <ErrorBox mensaje={error} /> : null}
      {errorGoogle ? <ErrorBox mensaje={errorGoogle} /> : null}

      {/* Botón renderizado de Google (popup OAuth real). Confiable: no depende
          de One Tap/FedCM, que Chrome bloquea con AbortError/NetworkError. */}
      <GoogleButton onCredential={(token) => ingresar(token)} text="signin_with" />

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">o</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          prompt(correo.trim() || undefined)
        }}
        className="relative"
      >
        <input
          type="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          placeholder="Correo electrónico"
          autoComplete="email"
          className="h-12 w-full rounded-xl border bg-background pl-4 pr-12 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
        />
        <button
          type="submit"
          aria-label="Continuar"
          disabled={!listo || cargando}
          className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg transition-colors hover:bg-muted disabled:opacity-40"
        >
          <RiArrowRightLine className="size-4" />
        </button>
      </form>

      <button
        type="button"
        role="checkbox"
        aria-checked={novedades}
        onClick={() => setNovedades((v) => !v)}
        className="flex items-center gap-2 text-left text-sm"
      >
        {novedades ? (
          <RiCheckboxCircleFill className="size-5 shrink-0 text-foreground" />
        ) : (
          <span className="size-5 shrink-0 rounded-full border-2 border-muted-foreground/40" />
        )}
        <span>Envíenme novedades y ofertas por correo</span>
      </button>

      <p className="text-center text-xs text-muted-foreground">
        Si continúas, aceptas nuestros{" "}
        <Link href="/terminos" className="underline underline-offset-2">
          Términos del servicio
        </Link>
      </p>

    </div>
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

function VolverInicio({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" className="self-start" onClick={onClick}>
      <RiArrowLeftLine />
      Volver
    </Button>
  )
}
