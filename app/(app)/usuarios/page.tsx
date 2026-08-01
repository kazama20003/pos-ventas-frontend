"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  RiAddLine,
  RiCheckLine,
  RiErrorWarningLine,
  RiGoogleFill,
  RiInformationLine,
  RiMailLine,
  RiMailSendLine,
  RiShieldUserLine,
  RiUserLine,
} from "@remixicon/react"

import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ApiError } from "@/lib/api/client"
import { listarSucursales } from "@/lib/api/organizacion"
import {
  actualizarUsuario,
  cambiarEstadoUsuario,
  invitarUsuario,
  listarOrganizaciones,
  listarRoles,
  listarUsuarios,
  reenviarInvitacion,
  type AsignacionRol,
  type EstadoMembresia,
  type Rol,
  type Usuario,
} from "@/lib/api/usuarios"
import { usePermisos } from "@/hooks/use-permisos"

type Suc = { id: string; nombre: string; codigo: string }

const TODAS = "__todas__"

const ESTADO_META: Record<
  EstadoMembresia,
  { label: string; clase: string }
> = {
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

const esAdmin = (r: { codigo: string }) => r.codigo.toUpperCase() === "ADMIN"

function errMsg(e: unknown) {
  return (e as ApiError | Error | null)?.message ?? null
}

/* ------------------------------------------------------------------ */
/* Página                                                             */
/* ------------------------------------------------------------------ */

export default function UsuariosPage() {
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
  const [nonce, setNonce] = React.useState(0)
  const [editId, setEditId] = React.useState<string | null>(null)

  const abrirInvitar = () => {
    setNonce((n) => n + 1)
    setInvitando(true)
  }

  const data = usuarios.data ?? []
  const sucNombre = React.useMemo(() => {
    const map = new Map((sucursales.data ?? []).map((s) => [s.id, s.nombre]))
    return (id: string | null) => (id ? (map.get(id) ?? "—") : "Todas")
  }, [sucursales.data])

  const { can } = usePermisos()
  const puedeInvitar = can("usuarios.crear")

  const usuarioEdit = data.find((u) => u.membresiaId === editId) ?? null
  const totActivos = data.filter((u) => u.estado === "ACTIVA").length
  const totInvit = data.filter((u) => u.estado === "INVITADA").length
  const soloAdmin = (roles.data ?? []).length <= 1

  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Invita empleados y dales acceso según su rol."
        actions={
          puedeInvitar ? (
            <Button type="button" size="sm" onClick={abrirInvitar}>
              <RiAddLine />
              Invitar usuario
            </Button>
          ) : null
        }
      />

      <div className="flex-1 overflow-auto">
        <div className="mx-auto flex max-w-5xl flex-col gap-5 p-5 md:p-6">
          {/* KPIs */}
          <div className="grid gap-3 sm:grid-cols-3">
            <Kpi
              label="Usuarios"
              valor={usuarios.isLoading ? "—" : String(data.length)}
            />
            <Kpi
              label="Activos"
              valor={usuarios.isLoading ? "—" : String(totActivos)}
            />
            <Kpi
              label="Invitaciones"
              valor={usuarios.isLoading ? "—" : String(totInvit)}
              sub="pendientes"
            />
          </div>

          {/* Aviso: solo existe ADMIN */}
          {!roles.isLoading && soloAdmin ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 text-sm">
              <RiInformationLine className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-muted-foreground">
                Por ahora solo existe el rol{" "}
                <span className="font-medium text-foreground">
                  Administrador
                </span>{" "}
                (acceso total). Cuando crees roles con permisos limitados
                (cajero, supervisor…) podrás asignarlos por sucursal.
              </p>
            </div>
          ) : null}

          {/* Tabla */}
          <div className="rounded-xl border bg-card">
            {usuarios.isLoading ? (
              <div className="flex flex-col gap-2 p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : usuarios.error ? (
              <div className="p-4">
                <ErrorLinea msg={errMsg(usuarios.error) ?? "Error"} />
              </div>
            ) : data.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <RiUserLine className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-medium">Sin usuarios todavía</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Invita al primer empleado a tu organización.
                  </p>
                </div>
                <Button type="button" size="sm" onClick={abrirInvitar}>
                  <RiAddLine />
                  Invitar usuario
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Usuario</TableHead>
                    <TableHead>Acceso</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-0" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((u) => (
                    <TableRow
                      key={u.membresiaId}
                      className="cursor-pointer"
                      onClick={() => setEditId(u.membresiaId)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <RiUserLine className="size-4" />
                          </span>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                              {u.nombreVisible}
                            </div>
                            <div className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                              {u.email}
                              {u.vinculadoAGoogle ? (
                                <RiGoogleFill className="size-3 shrink-0" />
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {u.roles.length === 0 ? (
                          <span className="text-xs text-muted-foreground">
                            Sin acceso
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {u.roles.map((r) => (
                              <Badge
                                key={`${r.id}-${r.sucursalId ?? "g"}`}
                                variant="secondary"
                                className="gap-1"
                              >
                                <RiShieldUserLine className="size-3 text-primary" />
                                {r.nombre}
                                <span className="text-muted-foreground">
                                  · {sucNombre(r.sucursalId)}
                                </span>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_META[u.estado].clase}`}
                        >
                          {ESTADO_META[u.estado].label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          tabIndex={-1}
                          className="text-muted-foreground"
                        >
                          <RiShieldUserLine />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>

      {/* Slide-over: invitar */}
      <InvitarSheet
        key={nonce}
        open={invitando}
        onOpenChange={setInvitando}
        roles={roles.data ?? []}
        sucursales={sucursales.data ?? []}
        orgs={orgs.data ?? []}
      />

      {/* Slide-over: editar acceso */}
      <Sheet
        open={usuarioEdit != null}
        onOpenChange={(o) => {
          if (!o) setEditId(null)
        }}
      >
        <SheetContent className="w-full gap-0 p-0 sm:!max-w-md">
          {usuarioEdit ? (
            <EditarUsuario
              key={usuarioEdit.membresiaId}
              usuario={usuarioEdit}
              roles={roles.data ?? []}
              sucursales={sucursales.data ?? []}
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Selector de roles (checklist + scope por sucursal)                 */
/* ------------------------------------------------------------------ */

function SelectorRoles({
  roles,
  sucursales,
  valor,
  onChange,
}: {
  roles: Rol[]
  sucursales: Suc[]
  valor: AsignacionRol[]
  onChange: (v: AsignacionRol[]) => void
}) {
  const opcionesSuc = [
    { value: TODAS, label: "Todas las sucursales" },
    ...sucursales.map((s) => ({ value: s.id, label: s.nombre, hint: s.codigo })),
  ]

  const toggle = (rol: Rol) => {
    const existe = valor.some((a) => a.rolId === rol.id)
    if (existe) {
      onChange(valor.filter((a) => a.rolId !== rol.id))
    } else {
      onChange([...valor, { rolId: rol.id, sucursalId: undefined }])
    }
  }
  const setScope = (rolId: string, sucursalId: string | undefined) =>
    onChange(valor.map((a) => (a.rolId === rolId ? { ...a, sucursalId } : a)))

  if (roles.length === 0) {
    return (
      <p className="rounded-xl border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
        No hay roles definidos.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {roles.map((rol) => {
        const asignacion = valor.find((a) => a.rolId === rol.id)
        const activo = asignacion != null
        const admin = esAdmin(rol)
        return (
          <div
            key={rol.id}
            className={`rounded-xl border p-3 transition-colors ${
              activo ? "border-primary/40 bg-primary/5" : "hover:bg-muted/30"
            }`}
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="checkbox"
                aria-checked={activo}
                onClick={() => toggle(rol)}
                className={`flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                  activo
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background"
                }`}
              >
                {activo ? <RiCheckLine className="size-3.5" /> : null}
              </button>
              <button
                type="button"
                onClick={() => toggle(rol)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <RiShieldUserLine className="size-4 shrink-0 text-primary" />
                <span className="truncate text-sm font-medium">
                  {rol.nombre}
                </span>
                {admin ? (
                  <Badge variant="secondary" className="shrink-0">
                    Acceso total
                  </Badge>
                ) : null}
              </button>
            </div>

            {activo ? (
              <div className="mt-2.5 flex items-center gap-2 pl-8">
                <span className="text-xs text-muted-foreground">Alcance</span>
                {admin ? (
                  <span className="text-xs font-medium">
                    Todas las sucursales
                  </span>
                ) : (
                  <Select
                    value={asignacion?.sucursalId ?? TODAS}
                    onChange={(v) =>
                      setScope(rol.id, v === TODAS ? undefined : v)
                    }
                    options={opcionesSuc}
                    className="h-9 w-full max-w-[220px]"
                  />
                )}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Invitar (Sheet)                                                    */
/* ------------------------------------------------------------------ */

function InvitarSheet({
  open,
  onOpenChange,
  roles,
  sucursales,
  orgs,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  roles: Rol[]
  sucursales: Suc[]
  orgs: { id: string; nombre: string; codigo: string }[]
}) {
  const qc = useQueryClient()
  const [email, setEmail] = React.useState("")
  const [nombre, setNombre] = React.useState("")
  const [orgSel, setOrgSel] = React.useState("")
  const [asignaciones, setAsignaciones] = React.useState<AsignacionRol[]>([])

  const orgId = orgSel || (orgs.length === 1 ? orgs[0].id : "")

  const m = useMutation({
    mutationFn: () =>
      invitarUsuario({
        email: email.trim(),
        nombreVisible: nombre.trim(),
        organizacionId: orgId,
        roles: asignaciones.filter((a) => a.rolId),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["usuarios"] })
      onOpenChange(false)
    },
  })
  const err = errMsg(m.error)

  const valido =
    /.+@.+\..+/.test(email) &&
    nombre.trim() &&
    orgId &&
    asignaciones.some((a) => a.rolId)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:!max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>Invitar usuario</SheetTitle>
          <SheetDescription>
            Entrará firmando con la cuenta de Google de este correo.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-auto p-6">
          <Campo label="Correo">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="empleado@correo.com"
              className="h-10"
            />
          </Campo>
          <Campo label="Nombre">
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre y apellido"
              className="h-10"
            />
          </Campo>
          {orgs.length > 1 ? (
            <Campo label="Organización">
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
            </Campo>
          ) : null}

          <Campo label="Acceso (roles)">
            <SelectorRoles
              roles={roles}
              sucursales={sucursales}
              valor={asignaciones}
              onChange={setAsignaciones}
            />
          </Campo>

          {err ? <ErrorLinea msg={err} /> : null}
        </div>

        <div className="flex justify-end gap-2 border-t p-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!valido || m.isPending}
            onClick={() => m.mutate()}
          >
            <RiMailLine />
            {m.isPending ? "Invitando…" : "Enviar invitación"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/* ------------------------------------------------------------------ */
/* Editar usuario (Sheet)                                             */
/* ------------------------------------------------------------------ */

function EditarUsuario({
  usuario,
  roles,
  sucursales,
}: {
  usuario: Usuario
  roles: Rol[]
  sucursales: Suc[]
}) {
  const qc = useQueryClient()
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
    onSuccess: invalidar,
  })
  const mEstado = useMutation({
    mutationFn: (estado: "ACTIVA" | "SUSPENDIDA" | "REVOCADA") =>
      cambiarEstadoUsuario(usuario.membresiaId, estado),
    onSuccess: invalidar,
  })
  const mReenviar = useMutation({
    mutationFn: () => reenviarInvitacion(usuario.membresiaId),
  })

  const err = errMsg(mGuardar.error || mEstado.error || mReenviar.error)
  const meta = ESTADO_META[usuario.estado]
  const suspendida = usuario.estado === "SUSPENDIDA"
  const revocada = usuario.estado === "REVOCADA"
  const invitada = usuario.estado === "INVITADA"

  return (
    <>
      <SheetHeader className="gap-3 border-b pr-14">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <RiUserLine className="size-5" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <SheetTitle className="truncate">
                {usuario.nombreVisible}
              </SheetTitle>
              <span
                className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${meta.clase}`}
              >
                {meta.label}
              </span>
            </div>
            <SheetDescription className="flex items-center gap-1 truncate">
              {usuario.email}
              {usuario.vinculadoAGoogle ? (
                <RiGoogleFill className="size-3.5 shrink-0" />
              ) : null}
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="flex flex-1 flex-col gap-4 overflow-auto p-6">
        <Campo label="Acceso (roles)">
          <SelectorRoles
            roles={roles}
            sucursales={sucursales}
            valor={asignaciones}
            onChange={setAsignaciones}
          />
        </Campo>

        {invitada ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
            <div className="mb-1 flex items-center gap-2">
              <RiMailSendLine className="size-4 text-amber-600 dark:text-amber-400" />
              <p className="text-sm font-medium">Invitación pendiente</p>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Aún no ha ingresado. Si no le llegó el correo, reenvíalo.
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={mReenviar.isPending}
              onClick={() => mReenviar.mutate()}
            >
              <RiMailSendLine />
              {mReenviar.isPending ? "Enviando…" : "Reenviar invitación"}
            </Button>
            {mReenviar.data ? (
              <p
                className={`mt-2 text-xs ${
                  mReenviar.data.enviado
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {mReenviar.data.enviado
                  ? `Correo reenviado a ${mReenviar.data.correo}.`
                  : `No se pudo enviar: ${mReenviar.data.error ?? "revisa la configuración de correo (Resend)."}`}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="rounded-xl border p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Estado de la cuenta
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={suspendida || revocada ? "default" : "outline"}
              disabled={mEstado.isPending || usuario.estado === "ACTIVA"}
              onClick={() => mEstado.mutate("ACTIVA")}
            >
              Activar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={mEstado.isPending || suspendida}
              onClick={() => mEstado.mutate("SUSPENDIDA")}
            >
              Suspender
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={mEstado.isPending || revocada}
              onClick={() => mEstado.mutate("REVOCADA")}
            >
              Revocar acceso
            </Button>
          </div>
        </div>

        {err ? <ErrorLinea msg={err} /> : null}
      </div>

      <div className="flex justify-end gap-2 border-t p-4">
        <Button
          type="button"
          disabled={mGuardar.isPending}
          onClick={() => mGuardar.mutate()}
        >
          <RiCheckLine />
          {mGuardar.isPending ? "Guardando…" : "Guardar acceso"}
        </Button>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Primitivos locales                                                 */
/* ------------------------------------------------------------------ */

function Kpi({
  label,
  valor,
  sub,
}: {
  label: string
  valor: string
  sub?: string
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold leading-tight tabular-nums">
        {valor}
        {sub ? (
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
            {sub}
          </span>
        ) : null}
      </p>
    </div>
  )
}

function Campo({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

function ErrorLinea({ msg }: { msg: string }) {
  return (
    <p className="flex items-center gap-1.5 text-xs text-destructive">
      <RiErrorWarningLine className="size-4 shrink-0" />
      {msg}
    </p>
  )
}
