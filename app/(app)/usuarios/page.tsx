"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  RiAddLine,
  RiCheckLine,
  RiCloseLine,
  RiErrorWarningLine,
  RiGoogleFill,
  RiMailLine,
  RiShieldUserLine,
  RiUserLine,
} from "@remixicon/react"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError } from "@/lib/api/client"
import { listarSucursales } from "@/lib/api/organizacion"
import {
  actualizarUsuario,
  cambiarEstadoUsuario,
  invitarUsuario,
  listarOrganizaciones,
  listarRoles,
  listarUsuarios,
  type AsignacionRol,
  type EstadoMembresia,
  type Rol,
  type Usuario,
} from "@/lib/api/usuarios"

const ESTADO_META: Record<EstadoMembresia, { label: string; clase: string }> = {
  INVITADA: {
    label: "Invitada",
    clase: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  ACTIVA: {
    label: "Activa",
    clase: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  SUSPENDIDA: { label: "Suspendida", clase: "bg-muted text-muted-foreground" },
  REVOCADA: { label: "Revocada", clase: "bg-destructive/15 text-destructive" },
}

const TODAS = "__todas__"

export default function UsuariosPage() {
  const qc = useQueryClient()
  const usuarios = useQuery({ queryKey: ["usuarios"], queryFn: listarUsuarios })
  const roles = useQuery({ queryKey: ["roles"], queryFn: listarRoles })
  const sucursales = useQuery({
    queryKey: ["sucursales"],
    queryFn: listarSucursales,
  })
  const orgs = useQuery({
    queryKey: ["organizaciones"],
    queryFn: listarOrganizaciones,
  })

  const [invitando, setInvitando] = React.useState(false)

  const sucursalNombre = React.useMemo(() => {
    const map = new Map((sucursales.data ?? []).map((s) => [s.id, s.nombre]))
    return (id: string | null) => (id ? (map.get(id) ?? "—") : "Todas")
  }, [sucursales.data])

  return (
    <>
      <PageHeader
        title="Usuarios y permisos"
        description="Invita empleados y define qué pueden hacer y en qué sucursal."
        actions={
          <Button
            type="button"
            size="sm"
            variant={invitando ? "secondary" : "default"}
            onClick={() => setInvitando((v) => !v)}
          >
            {invitando ? <RiCloseLine /> : <RiAddLine />}
            {invitando ? "Cerrar" : "Invitar usuario"}
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-4 md:p-6">
        {invitando ? (
          <div className="mb-4">
            <FormularioInvitar
              roles={roles.data ?? []}
              sucursales={sucursales.data ?? []}
              orgs={orgs.data ?? []}
              onListo={() => {
                qc.invalidateQueries({ queryKey: ["usuarios"] })
                setInvitando(false)
              }}
              onCancelar={() => setInvitando(false)}
            />
          </div>
        ) : null}

        {usuarios.isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
        ) : usuarios.error ? (
          <p className="flex items-center gap-1.5 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <RiErrorWarningLine className="size-4" />
            {(usuarios.error as ApiError | Error).message}
          </p>
        ) : (usuarios.data ?? []).length === 0 ? (
          <p className="rounded-2xl border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
            Aún no hay usuarios. Invita al primero.
          </p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {(usuarios.data ?? []).map((u) => (
              <TarjetaUsuario
                key={u.membresiaId}
                usuario={u}
                roles={roles.data ?? []}
                sucursales={sucursales.data ?? []}
                sucursalNombre={sucursalNombre}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

/** Editor de filas rol + sucursal (reutilizado en invitar y editar). */
function EditorRoles({
  roles,
  sucursales,
  valor,
  onChange,
}: {
  roles: Rol[]
  sucursales: { id: string; nombre: string; codigo: string }[]
  valor: AsignacionRol[]
  onChange: (v: AsignacionRol[]) => void
}) {
  const opcionesRol = roles.map((r) => ({ value: r.id, label: r.nombre }))
  const opcionesSuc = [
    { value: TODAS, label: "Todas las sucursales" },
    ...sucursales.map((s) => ({ value: s.id, label: s.nombre, hint: s.codigo })),
  ]

  const set = (i: number, patch: Partial<AsignacionRol>) =>
    onChange(valor.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  const quitar = (i: number) => onChange(valor.filter((_, j) => j !== i))
  const agregar = () =>
    onChange([...valor, { rolId: "", sucursalId: undefined }])

  return (
    <div className="flex flex-col gap-2">
      {valor.map((fila, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2">
          <Select
            value={fila.rolId}
            onChange={(v) => set(i, { rolId: v })}
            options={opcionesRol}
            placeholder="Rol"
            className="min-w-[160px] flex-1"
          />
          <span className="text-xs text-muted-foreground">en</span>
          <Select
            value={fila.sucursalId ?? TODAS}
            onChange={(v) =>
              set(i, { sucursalId: v === TODAS ? undefined : v })
            }
            options={opcionesSuc}
            className="min-w-[180px] flex-1"
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => quitar(i)}
          >
            <RiCloseLine />
          </Button>
        </div>
      ))}
      <div>
        <Button type="button" size="xs" variant="outline" onClick={agregar}>
          <RiAddLine />
          Agregar rol
        </Button>
      </div>
    </div>
  )
}

function FormularioInvitar({
  roles,
  sucursales,
  orgs,
  onListo,
  onCancelar,
}: {
  roles: Rol[]
  sucursales: { id: string; nombre: string; codigo: string }[]
  orgs: { id: string; nombre: string; codigo: string }[]
  onListo: () => void
  onCancelar: () => void
}) {
  const [email, setEmail] = React.useState("")
  const [nombre, setNombre] = React.useState("")
  const [orgSel, setOrgSel] = React.useState("")
  const [asignaciones, setAsignaciones] = React.useState<AsignacionRol[]>([
    { rolId: "", sucursalId: undefined },
  ])

  // Org efectiva: la elegida, o la única disponible por defecto (sin efecto).
  const orgId = orgSel || (orgs.length === 1 ? orgs[0].id : "")

  const m = useMutation({
    mutationFn: () =>
      invitarUsuario({
        email: email.trim(),
        nombreVisible: nombre.trim(),
        organizacionId: orgId,
        roles: asignaciones.filter((a) => a.rolId),
      }),
    onSuccess: onListo,
  })
  const err = m.error as ApiError | Error | null

  const valido =
    /.+@.+\..+/.test(email) &&
    nombre.trim() &&
    orgId &&
    asignaciones.some((a) => a.rolId)

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm ring-1 ring-foreground/5">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <RiMailLine className="size-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Invitar usuario</h2>
          <p className="text-xs text-muted-foreground">
            Entrará firmando con la cuenta Google de este correo.
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-1.5">
          <Label className="text-xs text-muted-foreground">Correo</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="empleado@correo.com"
            className="h-10"
          />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs text-muted-foreground">Nombre</Label>
          <Input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre y apellido"
            className="h-10"
          />
        </div>
        <div className="grid gap-1.5 md:col-span-2">
          <Label className="text-xs text-muted-foreground">Organización</Label>
          <Select
            value={orgId}
            onChange={setOrgSel}
            options={orgs.map((o) => ({
              value: o.id,
              label: o.nombre,
              hint: o.codigo,
            }))}
            placeholder="Elige la organización"
          />
        </div>
      </div>

      <div className="mt-4">
        <Label className="mb-2 block text-xs text-muted-foreground">
          Roles y sucursal
        </Label>
        <EditorRoles
          roles={roles}
          sucursales={sucursales}
          valor={asignaciones}
          onChange={setAsignaciones}
        />
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
          <RiMailLine />
          {m.isPending ? "Invitando…" : "Enviar invitación"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancelar}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}

function TarjetaUsuario({
  usuario,
  roles,
  sucursales,
  sucursalNombre,
}: {
  usuario: Usuario
  roles: Rol[]
  sucursales: { id: string; nombre: string; codigo: string }[]
  sucursalNombre: (id: string | null) => string
}) {
  const qc = useQueryClient()
  const [editando, setEditando] = React.useState(false)
  const [asignaciones, setAsignaciones] = React.useState<AsignacionRol[]>(
    usuario.roles.map((r) => ({
      rolId: r.id,
      sucursalId: r.sucursalId ?? undefined,
    }))
  )

  const invalidar = () => qc.invalidateQueries({ queryKey: ["usuarios"] })

  const mGuardar = useMutation({
    mutationFn: () =>
      actualizarUsuario(usuario.membresiaId, {
        roles: asignaciones.filter((a) => a.rolId),
      }),
    onSuccess: () => {
      invalidar()
      setEditando(false)
    },
  })
  const mEstado = useMutation({
    mutationFn: (estado: "ACTIVA" | "SUSPENDIDA") =>
      cambiarEstadoUsuario(usuario.membresiaId, estado),
    onSuccess: invalidar,
  })

  const meta = ESTADO_META[usuario.estado]
  const err = (mGuardar.error || mEstado.error) as ApiError | Error | null
  const suspendida = usuario.estado === "SUSPENDIDA"

  return (
    <section className="flex flex-col rounded-2xl border bg-card p-4 shadow-sm ring-1 ring-foreground/5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <RiUserLine className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{usuario.nombreVisible}</span>
            <span
              className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${meta.clase}`}
            >
              {meta.label}
            </span>
          </div>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
            {usuario.email}
            {usuario.vinculadoAGoogle ? (
              <RiGoogleFill className="size-3.5 text-muted-foreground" />
            ) : null}
          </p>
        </div>
      </div>

      {/* Roles */}
      <div className="mt-3">
        {editando ? (
          <EditorRoles
            roles={roles}
            sucursales={sucursales}
            valor={asignaciones}
            onChange={setAsignaciones}
          />
        ) : usuario.roles.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sin roles asignados.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {usuario.roles.map((r) => (
              <span
                key={`${r.id}-${r.sucursalId ?? "g"}`}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs"
              >
                <RiShieldUserLine className="size-3.5 text-primary" />
                {r.nombre}
                <span className="text-muted-foreground">
                  · {sucursalNombre(r.sucursalId)}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      {err ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
          <RiErrorWarningLine className="size-4" />
          {err.message}
        </p>
      ) : null}

      {/* Acciones */}
      <div className="mt-3 flex gap-2">
        {editando ? (
          <>
            <Button
              type="button"
              size="sm"
              disabled={mGuardar.isPending}
              onClick={() => mGuardar.mutate()}
            >
              <RiCheckLine />
              {mGuardar.isPending ? "Guardando…" : "Guardar roles"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditando(false)
                setAsignaciones(
                  usuario.roles.map((r) => ({
                    rolId: r.id,
                    sucursalId: r.sucursalId ?? undefined,
                  }))
                )
              }}
            >
              Cancelar
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setEditando(true)}
            >
              <RiShieldUserLine />
              Editar roles
            </Button>
            <Button
              type="button"
              size="sm"
              variant={suspendida ? "secondary" : "outline"}
              disabled={mEstado.isPending}
              onClick={() => mEstado.mutate(suspendida ? "ACTIVA" : "SUSPENDIDA")}
            >
              {suspendida ? "Reactivar" : "Suspender"}
            </Button>
          </>
        )}
      </div>
    </section>
  )
}
