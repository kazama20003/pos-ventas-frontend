"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  RiAddLine,
  RiCheckLine,
  RiCloseLine,
  RiErrorWarningLine,
  RiSearchLine,
  RiUser3Line,
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
import {
  actualizarCliente,
  crearCliente,
  desactivarCliente,
  listarClientes,
  TIPOS_DOCUMENTO,
  type Cliente,
  type TipoCliente,
  type TipoDocumento,
} from "@/lib/api/clientes"
import { usePermisos } from "@/hooks/use-permisos"
import {
  hintDocumento,
  limpiarDocumento,
  maxLargoDocumento,
  validarDocumento,
  validarEmail,
  validarTelefono,
} from "@/lib/validaciones"

function errMsg(e: unknown) {
  return (e as ApiError | Error | null)?.message ?? null
}

function slug(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 20)
}

const TIPOS_CLIENTE: { value: TipoCliente; label: string }[] = [
  { value: "PERSONA", label: "Persona" },
  { value: "EMPRESA", label: "Empresa" },
]

export default function ClientesPage() {
  const { can } = usePermisos()
  const puedeCrear = can("clientes.crear")

  const [q, setQ] = React.useState("")
  const [debounced, setDebounced] = React.useState("")
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300)
    return () => clearTimeout(t)
  }, [q])

  const [creando, setCreando] = React.useState(false)
  const [nonce, setNonce] = React.useState(0)
  const [editId, setEditId] = React.useState<string | null>(null)

  const clientes = useQuery({
    queryKey: ["clientes", debounced],
    queryFn: () => listarClientes(debounced || undefined),
  })
  const data = clientes.data ?? []
  const editando = data.find((c) => c.id === editId) ?? null

  const abrirCrear = () => {
    setNonce((n) => n + 1)
    setCreando(true)
  }

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Directorio de clientes y cuentas de crédito."
        actions={
          puedeCrear ? (
            <Button type="button" size="sm" onClick={abrirCrear}>
              <RiAddLine />
              Nuevo cliente
            </Button>
          ) : null
        }
      />

      <div className="flex-1 overflow-auto">
        <div className="mx-auto flex max-w-5xl flex-col gap-5 p-5 md:p-6">
          <div className="rounded-xl border bg-card">
            <div className="flex items-center justify-between gap-3 border-b p-3">
              <div className="relative w-full max-w-xs">
                <RiSearchLine className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar por nombre o documento…"
                  className="h-9 pl-9"
                />
              </div>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {clientes.isLoading ? "…" : `${data.length}`}
              </span>
            </div>

            {clientes.isLoading ? (
              <div className="flex flex-col gap-2 p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : data.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <RiUser3Line className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-medium">
                    {debounced ? "Sin coincidencias" : "Sin clientes"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {debounced
                      ? "Prueba con otro término."
                      : "Registra tu primer cliente para agilizar la venta."}
                  </p>
                </div>
                {!debounced && puedeCrear ? (
                  <Button type="button" size="sm" onClick={abrirCrear}>
                    <RiAddLine />
                    Nuevo cliente
                  </Button>
                ) : null}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-5">Cliente</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((c) => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer"
                      onClick={() => setEditId(c.id)}
                    >
                      <TableCell className="pl-5">
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <RiUser3Line className="size-4" />
                          </span>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                              {c.razonSocial}
                            </div>
                            <div className="truncate font-mono text-xs text-muted-foreground">
                              {c.codigo}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.documentNumber || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.tipo === "EMPRESA" ? "Empresa" : "Persona"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.phone || c.email || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={c.estado === "ACTIVO" ? "outline" : "secondary"}
                          className={
                            c.estado === "ACTIVO"
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : undefined
                          }
                        >
                          {c.estado === "ACTIVO" ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>

      <CrearCliente
        key={nonce}
        open={creando}
        onOpenChange={setCreando}
      />

      <Sheet
        open={Boolean(editId)}
        onOpenChange={(o) => !o && setEditId(null)}
      >
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:!max-w-md">
          {editando ? <EditarCliente cliente={editando} /> : null}
        </SheetContent>
      </Sheet>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Crear                                                              */
/* ------------------------------------------------------------------ */

function CrearCliente({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const qc = useQueryClient()
  const [tipo, setTipo] = React.useState<TipoCliente>("PERSONA")
  const [razonSocial, setRazonSocial] = React.useState("")
  const [nombreComercial, setNombreComercial] = React.useState("")
  const [tipoDoc, setTipoDoc] = React.useState<TipoDocumento>("DNI")
  const [numDoc, setNumDoc] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [phone, setPhone] = React.useState("")

  const codigo = slug(razonSocial)

  // Al cambiar el tipo de cliente, sugiere el documento típico.
  const cambiarTipo = (t: TipoCliente) => {
    setTipo(t)
    setTipoDoc(t === "EMPRESA" ? "RUC" : "DNI")
  }

  const m = useMutation({
    mutationFn: () =>
      crearCliente({
        codigo,
        tipo,
        razonSocial: razonSocial.trim(),
        nombreComercial: nombreComercial.trim() || undefined,
        documentType: numDoc.trim() ? tipoDoc : undefined,
        documentNumber: numDoc.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clientes"] })
      onOpenChange(false)
    },
  })

  const err = errMsg(m.error)
  const errorDoc = validarDocumento(tipoDoc, numDoc)
  const errorEmail = validarEmail(email)
  const errorPhone = validarTelefono(phone)
  const valido =
    razonSocial.trim().length >= 2 &&
    codigo.length >= 2 &&
    !errorDoc &&
    !errorEmail &&
    !errorPhone

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:!max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>Nuevo cliente</SheetTitle>
          <SheetDescription>Registra sus datos de contacto.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-auto p-6">
          <Grupo titulo="Identificación" />
          <Campo label="Tipo de cliente">
            <div className="flex gap-2">
              {TIPOS_CLIENTE.map((t) => {
                const activo = tipo === t.value
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => cambiarTipo(t.value)}
                    className={
                      "flex-1 rounded-lg border px-3 py-2 text-sm transition-colors " +
                      (activo
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:bg-muted/50")
                    }
                  >
                    {t.label}
                  </button>
                )
              })}
            </div>
          </Campo>

          <Campo
            label={tipo === "EMPRESA" ? "Razón social" : "Nombre completo"}
            hint={codigo ? undefined : "Como figura en su documento."}
          >
            <Input
              value={razonSocial}
              onChange={(e) => setRazonSocial(e.target.value)}
              placeholder={
                tipo === "EMPRESA" ? "Comercial XYZ S.A.C." : "Juan Pérez"
              }
              className="h-10"
            />
            {codigo ? (
              <p className="text-xs text-muted-foreground">
                Código: <span className="font-mono">{codigo}</span>
              </p>
            ) : null}
          </Campo>

          {tipo === "EMPRESA" ? (
            <Campo label="Nombre comercial" hint="Opcional.">
              <Input
                value={nombreComercial}
                onChange={(e) => setNombreComercial(e.target.value)}
                placeholder="Opcional"
                className="h-10"
              />
            </Campo>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
            <Campo label="Tipo doc.">
              <Select
                value={tipoDoc}
                onChange={(v) => setTipoDoc(v as TipoDocumento)}
                options={TIPOS_DOCUMENTO}
              />
            </Campo>
            <Campo
              label="N° documento"
              hint={errorDoc ? undefined : hintDocumento(tipoDoc)}
            >
              <Input
                value={numDoc}
                inputMode={
                  tipoDoc === "RUC" || tipoDoc === "DNI" ? "numeric" : "text"
                }
                maxLength={maxLargoDocumento(tipoDoc)}
                onChange={(e) =>
                  setNumDoc(limpiarDocumento(tipoDoc, e.target.value))
                }
                placeholder={
                  tipoDoc === "RUC"
                    ? "20481234567"
                    : tipoDoc === "DNI"
                      ? "12345678"
                      : "N° documento"
                }
                className="h-10"
                aria-invalid={Boolean(errorDoc)}
              />
              {errorDoc ? (
                <p className="text-xs text-destructive">{errorDoc}</p>
              ) : null}
            </Campo>
          </div>

          <Grupo titulo="Contacto" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Teléfono">
              <Input
                value={phone}
                inputMode="numeric"
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="Opcional"
                className="h-10 tabular-nums"
                aria-invalid={Boolean(errorPhone)}
              />
              {errorPhone ? (
                <p className="text-xs text-destructive">{errorPhone}</p>
              ) : null}
            </Campo>
            <Campo label="Correo">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Opcional"
                className="h-10"
                aria-invalid={Boolean(errorEmail)}
              />
              {errorEmail ? (
                <p className="text-xs text-destructive">{errorEmail}</p>
              ) : null}
            </Campo>
          </div>

          {err ? <ErrorLinea msg={err} /> : null}
        </div>

        <div className="flex justify-end gap-2 border-t p-4">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!valido || m.isPending}
            onClick={() => m.mutate()}
          >
            <RiCheckLine />
            {m.isPending ? "Creando…" : "Crear cliente"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/* ------------------------------------------------------------------ */
/* Editar                                                             */
/* ------------------------------------------------------------------ */

function EditarCliente({ cliente }: { cliente: Cliente }) {
  const qc = useQueryClient()
  const { can } = usePermisos()
  const puede = can("clientes.actualizar")
  const [editando, setEditando] = React.useState(false)
  const [razonSocial, setRazonSocial] = React.useState(cliente.razonSocial)
  const [nombreComercial, setNombreComercial] = React.useState(
    cliente.nombreComercial ?? ""
  )
  const [email, setEmail] = React.useState(cliente.email ?? "")
  const [phone, setPhone] = React.useState(cliente.phone ?? "")

  const invalidar = () => qc.invalidateQueries({ queryKey: ["clientes"] })

  const mGuardar = useMutation({
    mutationFn: () =>
      actualizarCliente(cliente.id, {
        razonSocial: razonSocial.trim(),
        nombreComercial: nombreComercial.trim(),
        email: email.trim(),
        phone: phone.trim(),
      }),
    onSuccess: () => {
      invalidar()
      setEditando(false)
    },
  })
  const mEstado = useMutation({
    mutationFn: () => desactivarCliente(cliente.id),
    onSuccess: invalidar,
  })
  const err = errMsg(mGuardar.error || mEstado.error)
  const errorEmail = validarEmail(email)
  const errorPhone = validarTelefono(phone)
  const puedeGuardar =
    razonSocial.trim().length >= 2 && !errorEmail && !errorPhone
  const activo = cliente.estado === "ACTIVO"

  return (
    <>
      <SheetHeader className="gap-3 border-b pr-14">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <RiUser3Line className="size-5" />
          </span>
          <div className="min-w-0">
            <SheetTitle className="truncate">{cliente.razonSocial}</SheetTitle>
            <SheetDescription className="truncate font-mono text-xs">
              {cliente.codigo}
              {cliente.documentNumber ? ` · ${cliente.documentNumber}` : ""}
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="flex flex-1 flex-col gap-4 overflow-auto p-6">
        {editando ? (
          <>
            <Campo label="Nombre / Razón social">
              <Input
                value={razonSocial}
                onChange={(e) => setRazonSocial(e.target.value)}
                className="h-10"
              />
            </Campo>
            <Campo label="Nombre comercial" hint="Opcional.">
              <Input
                value={nombreComercial}
                onChange={(e) => setNombreComercial(e.target.value)}
                className="h-10"
              />
            </Campo>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo label="Teléfono">
                <Input
                  value={phone}
                  inputMode="numeric"
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  className="h-10 tabular-nums"
                  aria-invalid={Boolean(errorPhone)}
                />
                {errorPhone ? (
                  <p className="text-xs text-destructive">{errorPhone}</p>
                ) : null}
              </Campo>
              <Campo label="Correo">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10"
                  aria-invalid={Boolean(errorEmail)}
                />
                {errorEmail ? (
                  <p className="text-xs text-destructive">{errorEmail}</p>
                ) : null}
              </Campo>
            </div>
          </>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <Dato label="Tipo" valor={cliente.tipo === "EMPRESA" ? "Empresa" : "Persona"} />
            <Dato label="Documento" valor={cliente.documentNumber} />
            <Dato label="Nombre comercial" valor={cliente.nombreComercial} />
            <Dato label="Teléfono" valor={cliente.phone} />
            <Dato label="Correo" valor={cliente.email} />
          </div>
        )}

        {err ? <ErrorLinea msg={err} /> : null}
      </div>

      {puede ? (
        <div className="flex justify-between gap-2 border-t p-4">
          {editando ? (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditando(false)
                  setRazonSocial(cliente.razonSocial)
                  setNombreComercial(cliente.nombreComercial ?? "")
                  setEmail(cliente.email ?? "")
                  setPhone(cliente.phone ?? "")
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={!puedeGuardar || mGuardar.isPending}
                onClick={() => mGuardar.mutate()}
              >
                <RiCheckLine />
                {mGuardar.isPending ? "Guardando…" : "Guardar"}
              </Button>
            </>
          ) : (
            <>
              {activo ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive"
                  disabled={mEstado.isPending}
                  onClick={() => mEstado.mutate()}
                >
                  <RiCloseLine />
                  Desactivar
                </Button>
              ) : (
                <span />
              )}
              <Button type="button" onClick={() => setEditando(true)}>
                Editar
              </Button>
            </>
          )}
        </div>
      ) : null}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Piezas de UI                                                       */
/* ------------------------------------------------------------------ */

function Campo({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function Grupo({ titulo }: { titulo: string }) {
  return (
    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
      {titulo}
    </p>
  )
}

function Dato({ label, valor }: { label: string; valor?: string | null }) {
  return (
    <div className="rounded-xl border bg-muted/20 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-medium">{valor || "—"}</p>
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
