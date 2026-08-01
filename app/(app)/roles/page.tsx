"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  RiAddLine,
  RiCheckLine,
  RiErrorWarningLine,
  RiInformationLine,
  RiShieldCheckLine,
  RiShieldUserLine,
} from "@remixicon/react"

import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { usePermisos } from "@/hooks/use-permisos"
import {
  agruparPermisos,
  asignarPermisos,
  clavesVisiblesDe,
  crearRol,
  listarCatalogoPermisos,
  listarRolesDetalle,
  type GrupoPermisos,
  type RolFull,
} from "@/lib/api/roles"

type CatalogoState = {
  grupos: GrupoPermisos[]
  isLoading: boolean
  error: string | null
}

/** Hook: catálogo de permisos agrupado, 100% desde el backend. */
function useGruposPermisos(): CatalogoState {
  const catalogo = useQuery({
    queryKey: ["catalogo-permisos"],
    queryFn: listarCatalogoPermisos,
    staleTime: 1000 * 60 * 60,
  })
  const grupos = React.useMemo<GrupoPermisos[]>(
    () => (catalogo.data ? agruparPermisos(catalogo.data) : []),
    [catalogo.data]
  )
  return { grupos, isLoading: catalogo.isLoading, error: errMsg(catalogo.error) }
}

const esAdmin = (r: { codigo: string }) => r.codigo.toUpperCase() === "ADMIN"

function errMsg(e: unknown) {
  return (e as ApiError | Error | null)?.message ?? null
}

function codigoDesde(nombre: string) {
  return nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40)
}

/* Presets rápidos para arrancar sin marcar 40 casillas a mano. */
const PRESETS: { label: string; permisos: string[] }[] = [
  {
    label: "Vendedor",
    permisos: [
      "ventas.crear",
      "ventas.devolver",
      "catalogo.listar",
      "inventario.listar",
      "clientes.crear",
      "clientes.listar",
      "caja.abrir",
      "caja.cerrar",
    ],
  },
  {
    label: "Supervisor de tienda",
    permisos: [
      "ventas.crear",
      "ventas.devolver",
      "catalogo.listar",
      "catalogo.editar",
      "inventario.listar",
      "inventario.ajustar",
      "inventario.transferir",
      "clientes.crear",
      "clientes.listar",
      "clientes.actualizar",
      "cobros.registrar",
      "caja.abrir",
      "caja.cerrar",
      "reportes.leer",
    ],
  },
]

/* ------------------------------------------------------------------ */
/* Página                                                             */
/* ------------------------------------------------------------------ */

export default function RolesPage() {
  const roles = useQuery({
    queryKey: ["roles-detalle"],
    queryFn: listarRolesDetalle,
  })

  const catalogo = useGruposPermisos()
  const { can } = usePermisos()
  const puedeCrear = can("roles.crear")

  const [creando, setCreando] = React.useState(false)
  const [nonce, setNonce] = React.useState(0)
  const [editId, setEditId] = React.useState<string | null>(null)

  const abrirCrear = () => {
    setNonce((n) => n + 1)
    setCreando(true)
  }

  const data = roles.data ?? []
  const rolEdit = data.find((r) => r.id === editId) ?? null

  return (
    <>
      <PageHeader
        title="Roles y permisos"
        description="Define qué puede hacer cada tipo de usuario."
        actions={
          puedeCrear ? (
            <Button type="button" size="sm" onClick={abrirCrear}>
              <RiAddLine />
              Nuevo rol
            </Button>
          ) : null
        }
      />

      <div className="flex-1 overflow-auto">
        <div className="mx-auto flex max-w-4xl flex-col gap-5 p-5 md:p-6">
          <div className="flex items-start gap-2.5 rounded-xl border bg-muted/30 p-3.5 text-sm">
            <RiInformationLine className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p className="text-muted-foreground">
              Un rol es un paquete de permisos. Créalo aquí y luego asígnalo a
              empleados desde{" "}
              <span className="font-medium text-foreground">Usuarios</span>,
              indicando en qué sucursal aplica.
            </p>
          </div>

          <div className="rounded-xl border bg-card">
            {roles.isLoading ? (
              <div className="flex flex-col gap-2 p-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : roles.error ? (
              <div className="p-4">
                <ErrorLinea msg={errMsg(roles.error) ?? "Error"} />
              </div>
            ) : data.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <RiShieldUserLine className="size-5" />
                </span>
                <p className="text-sm font-medium">Sin roles todavía</p>
                {puedeCrear ? (
                  <Button type="button" size="sm" onClick={abrirCrear}>
                    <RiAddLine />
                    Nuevo rol
                  </Button>
                ) : null}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Rol</TableHead>
                    <TableHead className="text-right">Permisos</TableHead>
                    <TableHead className="w-0" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((r) => {
                    const admin = esAdmin(r)
                    return (
                      <TableRow
                        key={r.id}
                        className="cursor-pointer"
                        onClick={() => setEditId(r.id)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                                admin
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-primary/10 text-primary"
                              }`}
                            >
                              {admin ? (
                                <RiShieldCheckLine className="size-4" />
                              ) : (
                                <RiShieldUserLine className="size-4" />
                              )}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-sm font-medium">
                                  {r.nombre}
                                </span>
                                {admin ? (
                                  <Badge variant="secondary">Sistema</Badge>
                                ) : null}
                              </div>
                              <div className="truncate font-mono text-xs text-muted-foreground">
                                {r.codigo}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                          {admin ? "Todos" : r.permisos.length}
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
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>

      {/* Crear */}
      <CrearRolSheet
        key={nonce}
        open={creando}
        onOpenChange={setCreando}
        catalogo={catalogo}
      />

      {/* Editar permisos */}
      <Sheet
        open={rolEdit != null}
        onOpenChange={(o) => {
          if (!o) setEditId(null)
        }}
      >
        <SheetContent className="w-full gap-0 p-0 sm:!max-w-lg">
          {rolEdit ? (
            <EditarRol key={rolEdit.id} rol={rolEdit} catalogo={catalogo} />
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Selector de permisos                                               */
/* ------------------------------------------------------------------ */

/** Envuelve el selector con los estados de carga/error del catálogo backend. */
function CatalogoPermisos({
  catalogo,
  valor,
  onChange,
}: {
  catalogo: CatalogoState
  valor: Set<string>
  onChange: (v: Set<string>) => void
}) {
  if (catalogo.isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    )
  }
  if (catalogo.error) {
    return (
      <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
        No se pudo cargar el catálogo de permisos del servidor:{" "}
        {catalogo.error}
      </p>
    )
  }
  if (catalogo.grupos.length === 0) {
    return (
      <p className="rounded-xl border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
        El servidor no devolvió permisos.
      </p>
    )
  }
  return (
    <SelectorPermisos grupos={catalogo.grupos} valor={valor} onChange={onChange} />
  )
}

function SelectorPermisos({
  grupos,
  valor,
  onChange,
  disabled,
}: {
  grupos: GrupoPermisos[]
  valor: Set<string>
  onChange: (v: Set<string>) => void
  disabled?: boolean
}) {
  const toggle = (clave: string) => {
    const next = new Set(valor)
    if (next.has(clave)) next.delete(clave)
    else next.add(clave)
    onChange(next)
  }
  const toggleGrupo = (claves: string[], todos: boolean) => {
    const next = new Set(valor)
    if (todos) claves.forEach((c) => next.delete(c))
    else claves.forEach((c) => next.add(c))
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-3">
      {grupos.map((g) => {
        const claves = g.permisos.map((p) => p.clave)
        const marcados = claves.filter((c) => valor.has(c)).length
        const todos = marcados === claves.length
        return (
          <div key={g.resource} className="overflow-hidden rounded-xl border">
            <div className="flex items-center justify-between gap-2 bg-muted/40 px-3 py-2">
              <span className="text-sm font-medium">{g.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {marcados}/{claves.length}
                </span>
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  disabled={disabled}
                  onClick={() => toggleGrupo(claves, todos)}
                >
                  {todos ? "Quitar" : "Todos"}
                </Button>
              </div>
            </div>
            <div className="divide-y">
              {g.permisos.map((p) => {
                const on = valor.has(p.clave)
                return (
                  <button
                    key={p.clave}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggle(p.clave)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-muted/30 disabled:opacity-60"
                  >
                    <span
                      className={`flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                        on
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background"
                      }`}
                    >
                      {on ? <RiCheckLine className="size-3.5" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">
                        {p.descripcion}
                      </span>
                      <span className="block truncate font-mono text-xs text-muted-foreground">
                        {p.clave}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Crear rol (Sheet)                                                  */
/* ------------------------------------------------------------------ */

function CrearRolSheet({
  open,
  onOpenChange,
  catalogo,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  catalogo: CatalogoState
}) {
  const qc = useQueryClient()
  const [nombre, setNombre] = React.useState("")
  const [descripcion, setDescripcion] = React.useState("")
  const [permisos, setPermisos] = React.useState<Set<string>>(new Set())

  const codigo = codigoDesde(nombre)
  const total = clavesVisiblesDe(catalogo.grupos).length
  const soloLectura = clavesVisiblesDe(catalogo.grupos).filter((c) =>
    /\.(listar|leer)$/.test(c)
  )

  const m = useMutation({
    mutationFn: () =>
      crearRol({
        codigo,
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        permisos: [...permisos],
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles-detalle"] })
      qc.invalidateQueries({ queryKey: ["roles"] })
      onOpenChange(false)
    },
  })
  const err = errMsg(m.error)
  const valido = nombre.trim().length >= 2 && codigo.length >= 2

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 p-0 sm:!max-w-lg">
        <SheetHeader className="border-b">
          <SheetTitle>Nuevo rol</SheetTitle>
          <SheetDescription>
            Ponle nombre y marca qué puede hacer.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-auto p-6">
          <Campo label="Nombre">
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Vendedor"
              className="h-10"
            />
            {codigo ? (
              <p className="text-xs text-muted-foreground">
                Código: <span className="font-mono">{codigo}</span>
              </p>
            ) : null}
          </Campo>
          <Campo label="Descripción (opcional)">
            <Input
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Para qué sirve este rol"
              className="h-10"
            />
          </Campo>

          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">
              Empezar desde una plantilla
            </Label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <Button
                  key={p.label}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setPermisos(new Set(p.permisos))}
                >
                  {p.label}
                </Button>
              ))}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setPermisos(new Set(soloLectura))}
              >
                Solo lectura
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setPermisos(new Set())}
              >
                Vaciar
              </Button>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">
              Permisos ({permisos.size}/{total})
            </Label>
            <CatalogoPermisos
              catalogo={catalogo}
              valor={permisos}
              onChange={setPermisos}
            />
          </div>

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
            <RiCheckLine />
            {m.isPending ? "Creando…" : "Crear rol"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/* ------------------------------------------------------------------ */
/* Editar permisos (Sheet)                                            */
/* ------------------------------------------------------------------ */

function EditarRol({
  rol,
  catalogo,
}: {
  rol: RolFull
  catalogo: CatalogoState
}) {
  const qc = useQueryClient()
  const admin = esAdmin(rol)
  const total = clavesVisiblesDe(catalogo.grupos).length
  const [permisos, setPermisos] = React.useState<Set<string>>(
    new Set(rol.permisos)
  )

  const m = useMutation({
    mutationFn: () => asignarPermisos(rol.id, [...permisos]),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles-detalle"] })
      qc.invalidateQueries({ queryKey: ["roles"] })
    },
  })
  const err = errMsg(m.error)

  return (
    <>
      <SheetHeader className="gap-3 border-b pr-14">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <RiShieldUserLine className="size-5" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <SheetTitle className="truncate">{rol.nombre}</SheetTitle>
              {admin ? <Badge variant="secondary">Sistema</Badge> : null}
            </div>
            <SheetDescription className="truncate font-mono text-xs">
              {rol.codigo}
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="flex flex-1 flex-col gap-4 overflow-auto p-6">
        {admin ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 text-sm">
            <RiInformationLine className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-muted-foreground">
              El rol Administrador es de sistema: tiene acceso total y no se
              edita. Crea otro rol para dar accesos limitados.
            </p>
          </div>
        ) : (
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">
              Permisos ({permisos.size}/{total})
            </Label>
            <CatalogoPermisos
              catalogo={catalogo}
              valor={permisos}
              onChange={setPermisos}
            />
          </div>
        )}

        {err ? <ErrorLinea msg={err} /> : null}
      </div>

      {!admin ? (
        <div className="flex justify-end gap-2 border-t p-4">
          <Button
            type="button"
            disabled={m.isPending}
            onClick={() => m.mutate()}
          >
            <RiCheckLine />
            {m.isPending ? "Guardando…" : "Guardar permisos"}
          </Button>
        </div>
      ) : null}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Primitivos locales                                                 */
/* ------------------------------------------------------------------ */

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
