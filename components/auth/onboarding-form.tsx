"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { RiErrorWarningLine } from "@remixicon/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { registrarEmpresa } from "@/lib/api/onboarding"
import { guardarSesion } from "@/lib/auth/session"
import { ApiError } from "@/lib/api/client"
import { RUC_REGEX, TENANT_CODIGO_REGEX } from "@/lib/api/types"

/**
 * Formulario de creación de empresa (onboarding). Se usa como paso posterior a
 * la autenticación con Google: recibe el `idToken` ya obtenido y crea el tenant.
 */
export function OnboardingForm({ idToken }: { idToken: string }) {
  const router = useRouter()
  const [form, setForm] = React.useState({
    tenantNombre: "",
    tenantCodigo: "",
    organizacionNombre: "",
    empresaRazonSocial: "",
    empresaRuc: "",
    adminNombre: "",
  })
  const [error, setError] = React.useState<string | null>(null)
  const [cargando, setCargando] = React.useState(false)

  const set = (k: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }))

  const codigoOk =
    form.tenantCodigo === "" || TENANT_CODIGO_REGEX.test(form.tenantCodigo)
  const valido =
    codigoOk &&
    RUC_REGEX.test(form.empresaRuc) &&
    form.tenantNombre.length >= 2 &&
    form.organizacionNombre.length >= 2 &&
    form.empresaRazonSocial.length >= 2

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!valido) return
    setError(null)
    setCargando(true)
    try {
      const res = await registrarEmpresa({
        idToken,
        tenantCodigo: form.tenantCodigo || undefined,
        tenantNombre: form.tenantNombre,
        organizacionNombre: form.organizacionNombre,
        empresaRazonSocial: form.empresaRazonSocial,
        empresaRuc: form.empresaRuc,
        adminNombre: form.adminNombre || undefined,
      })
      guardarSesion(res.tokens)
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo registrar")
    } finally {
      setCargando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-5">
      {error ? (
        <div className="flex items-start gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <RiErrorWarningLine className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="tenantNombre">Nombre del negocio</Label>
          <Input
            id="tenantNombre"
            placeholder="Mi Bodega"
            value={form.tenantNombre}
            onChange={(e) => set("tenantNombre")(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="tenantCodigo">
            Código de empresa{" "}
            <span className="text-muted-foreground">(opcional)</span>
          </Label>
          <Input
            id="tenantCodigo"
            placeholder="se genera automáticamente"
            value={form.tenantCodigo}
            onChange={(e) => set("tenantCodigo")(e.target.value.trim())}
            aria-invalid={
              form.tenantCodigo.length > 0 &&
              !TENANT_CODIGO_REGEX.test(form.tenantCodigo)
            }
          />
          <p className="text-xs text-muted-foreground">
            Si lo dejas vacío, lo generamos a partir del nombre. Se usa para
            iniciar sesión.
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="organizacionNombre">Organización</Label>
          <Input
            id="organizacionNombre"
            placeholder="Mi Bodega S.A.C."
            value={form.organizacionNombre}
            onChange={(e) => set("organizacionNombre")(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label htmlFor="empresaRazonSocial">Razón social</Label>
            <Input
              id="empresaRazonSocial"
              placeholder="Mi Bodega S.A.C."
              value={form.empresaRazonSocial}
              onChange={(e) => set("empresaRazonSocial")(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="empresaRuc">RUC</Label>
            <Input
              id="empresaRuc"
              placeholder="20123456789"
              inputMode="numeric"
              maxLength={11}
              value={form.empresaRuc}
              onChange={(e) =>
                set("empresaRuc")(e.target.value.replace(/\D/g, ""))
              }
              aria-invalid={
                form.empresaRuc.length > 0 && !RUC_REGEX.test(form.empresaRuc)
              }
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="adminNombre">
            Tu nombre{" "}
            <span className="text-muted-foreground">(opcional)</span>
          </Label>
          <Input
            id="adminNombre"
            placeholder="Tu nombre y apellido"
            value={form.adminNombre}
            onChange={(e) => set("adminNombre")(e.target.value)}
          />
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={!valido || cargando}>
        {cargando ? "Creando empresa…" : "Crear empresa"}
      </Button>
    </form>
  )
}
