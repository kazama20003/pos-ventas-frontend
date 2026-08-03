"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  RiAddLine,
  RiBuilding4Line,
  RiCheckLine,
  RiCloseLine,
  RiEditLine,
  RiErrorWarningLine,
} from "@remixicon/react"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError } from "@/lib/api/client"
import {
  actualizarEmpresa,
  crearEmpresa,
  listarEmpresas,
  type Empresa,
} from "@/lib/api/organizacion"
import { listarOrganizaciones } from "@/lib/api/usuarios"

const MONEDAS = [
  { value: "PEN", label: "Soles (PEN)" },
  { value: "USD", label: "Dólares (USD)" },
]

function soloUbigeo(v: string) {
  return v.replace(/\D/g, "").slice(0, 6)
}

export default function EmpresasPage() {
  const qc = useQueryClient()
  const empresas = useQuery({ queryKey: ["empresas"], queryFn: listarEmpresas })
  const orgs = useQuery({
    queryKey: ["organizaciones"],
    queryFn: listarOrganizaciones,
  })
  const [creando, setCreando] = React.useState(false)

  return (
    <>
      <PageHeader
        title="Empresas"
        description="Razones sociales que emiten comprobantes (una o varias por negocio)."
        actions={
          <Button
            type="button"
            size="sm"
            variant={creando ? "secondary" : "default"}
            onClick={() => setCreando((v) => !v)}
          >
            {creando ? <RiCloseLine /> : <RiAddLine />}
            {creando ? "Cerrar" : "Nueva empresa"}
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-4 md:p-6">
        {creando ? (
          <div className="mb-4">
            <FormularioEmpresa
              orgs={orgs.data ?? []}
              cargandoOrgs={orgs.isLoading}
              onListo={() => {
                qc.invalidateQueries({ queryKey: ["empresas"] })
                setCreando(false)
              }}
              onCancelar={() => setCreando(false)}
            />
          </div>
        ) : null}

        {empresas.isLoading ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-2xl" />
            ))}
          </div>
        ) : empresas.error ? (
          <p className="flex items-center gap-1.5 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <RiErrorWarningLine className="size-4" />
            {(empresas.error as ApiError | Error).message}
          </p>
        ) : (empresas.data ?? []).length === 0 ? (
          <p className="rounded-2xl border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
            Aún no hay empresas. Registra la primera.
          </p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {(empresas.data ?? []).map((e) => (
              <TarjetaEmpresa key={e.id} empresa={e} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function FormularioEmpresa({
  orgs,
  cargandoOrgs,
  onListo,
  onCancelar,
}: {
  orgs: { id: string; nombre: string; codigo: string }[]
  cargandoOrgs: boolean
  onListo: () => void
  onCancelar: () => void
}) {
  const [orgSel, setOrgSel] = React.useState("")
  const [razonSocial, setRazonSocial] = React.useState("")
  const [ruc, setRuc] = React.useState("")
  const [comercial, setComercial] = React.useState("")
  const [ubigeo, setUbigeo] = React.useState("")
  const [direccion, setDireccion] = React.useState("")
  const [moneda, setMoneda] = React.useState("PEN")

  const orgId = orgSel || (orgs.length === 1 ? orgs[0].id : "")

  const m = useMutation({
    mutationFn: () =>
      crearEmpresa({
        organizacionId: orgId,
        razonSocial: razonSocial.trim(),
        ruc: ruc.trim(),
        nombreComercial: comercial.trim() || undefined,
        sunatUbigeo: ubigeo.trim() || undefined,
        fiscalAddress: direccion.trim() || undefined,
        moneda,
      }),
    onSuccess: onListo,
  })
  const err = m.error as ApiError | Error | null

  const valido =
    orgId &&
    razonSocial.trim() &&
    /^\d{11}$/.test(ruc) &&
    (ubigeo.length === 0 || ubigeo.length === 6)

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm ring-1 ring-foreground/5">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <RiBuilding4Line className="size-4" />
        </span>
        <h2 className="text-sm font-semibold">Nueva empresa (razón social)</h2>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-1.5">
          <Label className="text-xs text-muted-foreground">Organización</Label>
          <Select
            value={orgId}
            onChange={setOrgSel}
            placeholder={cargandoOrgs ? "Cargando…" : "Elige la organización"}
            options={orgs.map((o) => ({
              value: o.id,
              label: o.nombre,
              hint: o.codigo,
            }))}
          />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs text-muted-foreground">RUC</Label>
          <Input
            value={ruc}
            onChange={(e) => setRuc(e.target.value.replace(/\D/g, "").slice(0, 11))}
            placeholder="11 dígitos"
            className="h-10"
            inputMode="numeric"
          />
        </div>
        <div className="grid gap-1.5 md:col-span-2">
          <Label className="text-xs text-muted-foreground">Razón social</Label>
          <Input
            value={razonSocial}
            onChange={(e) => setRazonSocial(e.target.value)}
            placeholder="Nombre legal de la empresa"
            className="h-10"
          />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs text-muted-foreground">
            Nombre comercial
          </Label>
          <Input
            value={comercial}
            onChange={(e) => setComercial(e.target.value)}
            placeholder="Opcional"
            className="h-10"
          />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs text-muted-foreground">Moneda</Label>
          <Select value={moneda} onChange={setMoneda} options={MONEDAS} />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs text-muted-foreground">Ubigeo SUNAT</Label>
          <Input
            value={ubigeo}
            onChange={(e) => setUbigeo(soloUbigeo(e.target.value))}
            placeholder="6 dígitos (opcional)"
            className="h-10"
          />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs text-muted-foreground">
            Dirección fiscal
          </Label>
          <Input
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            placeholder="Opcional"
            className="h-10"
          />
        </div>
      </div>

      {err ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-destructive">
          <RiErrorWarningLine className="size-4" />
          {err.message}
        </p>
      ) : null}

      <div className="mt-4 flex gap-2">
        <Button
          type="button"
          disabled={!valido || m.isPending}
          onClick={() => m.mutate()}
        >
          <RiCheckLine />
          {m.isPending ? "Creando…" : "Crear empresa"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancelar}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}

function TarjetaEmpresa({ empresa }: { empresa: Empresa }) {
  const qc = useQueryClient()
  const [editando, setEditando] = React.useState(false)
  const [razonSocial, setRazonSocial] = React.useState(empresa.razonSocial)
  const [comercial, setComercial] = React.useState(empresa.nombreComercial ?? "")
  const [ubigeo, setUbigeo] = React.useState(empresa.sunatUbigeo ?? "")
  const [direccion, setDireccion] = React.useState(empresa.fiscalAddress ?? "")
  const [codSunat, setCodSunat] = React.useState(
    empresa.sunatProductCodeDefault ?? ""
  )

  const m = useMutation({
    mutationFn: () =>
      actualizarEmpresa(empresa.id, {
        razonSocial: razonSocial.trim(),
        nombreComercial: comercial.trim(),
        sunatUbigeo: ubigeo.trim(),
        fiscalAddress: direccion.trim(),
        sunatProductCodeDefault: codSunat.trim(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["empresas"] })
      setEditando(false)
    },
  })
  const err = m.error as ApiError | Error | null
  const activa = empresa.estado === "ACTIVO" || !empresa.estado

  return (
    <section className="flex flex-col rounded-2xl border bg-card p-5 shadow-sm ring-1 ring-foreground/5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <RiBuilding4Line className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate font-semibold">{empresa.razonSocial}</h2>
            {!activa ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {empresa.estado}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
            RUC {empresa.ruc}
            {empresa.moneda ? ` · ${empresa.moneda}` : ""}
          </p>
        </div>
        {!editando ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setEditando(true)}
          >
            <RiEditLine />
            Editar
          </Button>
        ) : null}
      </div>

      {editando ? (
        <div className="mt-3 flex flex-col gap-2.5 rounded-xl bg-muted/40 p-3">
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Razón social</Label>
            <Input
              value={razonSocial}
              onChange={(e) => setRazonSocial(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">
                Nombre comercial
              </Label>
              <Input
                value={comercial}
                onChange={(e) => setComercial(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Ubigeo</Label>
              <Input
                value={ubigeo}
                onChange={(e) => setUbigeo(soloUbigeo(e.target.value))}
                placeholder="6 dígitos"
                className="h-9"
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">
              Dirección fiscal
            </Label>
            <Input
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">
              Código SUNAT por defecto
            </Label>
            <Input
              value={codSunat}
              onChange={(e) => setCodSunat(e.target.value)}
              placeholder="UNSPSC genérico, ej: 10000000"
              className="h-9 font-mono"
            />
            <p className="text-[11px] text-muted-foreground">
              Se aplica a todos los productos que no tengan su propio código
              (ni por categoría) al facturar.
            </p>
          </div>
          {err ? (
            <p className="flex items-center gap-1.5 text-xs text-destructive">
              <RiErrorWarningLine className="size-4" />
              {err.message}
            </p>
          ) : null}
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={
                !razonSocial.trim() ||
                (ubigeo.length > 0 && ubigeo.length !== 6) ||
                m.isPending
              }
              onClick={() => m.mutate()}
            >
              <RiCheckLine />
              {m.isPending ? "Guardando…" : "Guardar"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditando(false)
                setRazonSocial(empresa.razonSocial)
                setComercial(empresa.nombreComercial ?? "")
                setUbigeo(empresa.sunatUbigeo ?? "")
                setDireccion(empresa.fiscalAddress ?? "")
                setCodSunat(empresa.sunatProductCodeDefault ?? "")
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 grid gap-1 text-sm">
          {empresa.nombreComercial ? (
            <p className="text-muted-foreground">
              Comercial:{" "}
              <span className="text-foreground">{empresa.nombreComercial}</span>
            </p>
          ) : null}
          {empresa.fiscalAddress ? (
            <p className="truncate text-muted-foreground">
              Dirección:{" "}
              <span className="text-foreground">{empresa.fiscalAddress}</span>
            </p>
          ) : null}
        </div>
      )}
    </section>
  )
}
