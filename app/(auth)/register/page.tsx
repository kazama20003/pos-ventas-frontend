"use client"

import * as React from "react"
import Link from "next/link"

import { GoogleButton } from "@/components/auth/google-button"
import { OnboardingForm } from "@/components/auth/onboarding-form"

export default function RegisterPage() {
  const [idToken, setIdToken] = React.useState<string | null>(null)

  // Paso 2: ya autenticado con Google, configurar el primer punto de venta.
  if (idToken) {
    return (
      <div className="flex flex-col gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Configuremos tu negocio</h1>
          <p className="text-sm text-muted-foreground">
            En tres pasos tendrás tu primer punto de venta listo para operar.
          </p>
        </div>
        <OnboardingForm idToken={idToken} />
      </div>
    )
  }

  // Paso 1: autenticar con Google.
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Crea tu cuenta en Gekko</h1>
        <p className="text-sm text-muted-foreground">
          Primero identifícate con Google; luego registras tu empresa.
        </p>
      </div>

      <GoogleButton onCredential={setIdToken} text="signup_with" />

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes empresa?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  )
}
