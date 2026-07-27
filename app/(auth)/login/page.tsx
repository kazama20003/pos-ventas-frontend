"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { RiErrorWarningLine, RiArrowLeftLine, RiBuilding2Line } from "@remixicon/react"

import { Button } from "@/components/ui/button"
import { GoogleButton } from "@/components/auth/google-button"
import { OnboardingForm } from "@/components/auth/onboarding-form"
import { loginGoogle } from "@/lib/api/auth"
import { guardarSesion } from "@/lib/auth/session"
import { ApiError } from "@/lib/api/client"
import type {
  SeleccionTenantRequerida,
  TenantResumen,
} from "@/lib/api/types"

type Vista =
  | { tipo: "inicio" }
  | { tipo: "seleccion"; idToken: string; empresas: TenantResumen[] }
  | { tipo: "onboarding"; idToken: string }

export default function LoginPage() {
  const router = useRouter()
  const [vista, setVista] = React.useState<Vista>({ tipo: "inicio" })
  const [error, setError] = React.useState<string | null>(null)
  const [cargando, setCargando] = React.useState(false)

  async function ingresar(idToken: string, tenantCodigo?: string) {
    setError(null)
    setCargando(true)
    try {
      const tokens = await loginGoogle({ idToken, tenantCodigo })
      guardarSesion(tokens)
      router.push("/dashboard")
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        const body = e.body as { codigo?: string }
        if (body?.codigo === "SIN_TENANT") {
          setVista({ tipo: "onboarding", idToken })
          return
        }
        if (body?.codigo === "SELECCION_TENANT_REQUERIDA") {
          setVista({
            tipo: "seleccion",
            idToken,
            empresas: (body as SeleccionTenantRequerida).tenants,
          })
          return
        }
      }
      setError(e instanceof ApiError ? e.message : "No se pudo iniciar sesión")
    } finally {
      setCargando(false)
    }
  }

  // Cuenta sin empresa: crear una (onboarding con el idToken ya obtenido).
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

  // El correo pertenece a varias empresas: elegir.
  if (vista.tipo === "seleccion") {
    return (
      <div className="flex flex-col gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Elige tu empresa</h1>
          <p className="text-sm text-muted-foreground">
            Tu correo está asociado a varias empresas.
          </p>
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
                <span className="block truncate text-xs text-muted-foreground">
                  {t.codigo}
                </span>
              </span>
            </button>
          ))}
        </div>
        <VolverInicio onClick={() => setVista({ tipo: "inicio" })} />
      </div>
    )
  }

  // Inicio: un solo botón de Google (sirve para entrar y para registrarse).
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Bienvenido a Gekko</h1>
        <p className="text-sm text-muted-foreground">
          Entra con Google. Si aún no tienes empresa, podrás crearla enseguida.
        </p>
      </div>

      {error ? <ErrorBox mensaje={error} /> : null}

      <GoogleButton onCredential={(token) => ingresar(token)} text="continue_with" />

      <p className="text-center text-xs text-muted-foreground">
        Detectamos tu empresa automáticamente a partir de tu correo.
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
