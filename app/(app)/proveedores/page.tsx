"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  RiAddLine,
  RiCheckLine,
  RiCloseLine,
  RiErrorWarningLine,
  RiSearchLine,
  RiTruckLine,
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
  actualizarProveedor,
  crearProveedor,
  desactivarProveedor,
  listarProveedores,
  TIPOS_DOCUMENTO,
  type Proveedor,
  type TipoDocumento,
} from "@/lib/api/proveedores"
import { usePermisos } from "@/hooks/use-permisos"

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

export default function ProveedoresPage() {
  const { can } = usePermisos()
  const puedeCrear = can("proveedores.crear")

  const [q, setQ] = React.useState("")
  const [debounced, setDebounced] = React.useState("")
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300)
    return () => clearTimeout(t)
  }, [q])

  const [creando, setCreando] = React.useState(false)
  const [nonce, setNonce] = React.useState(0)
  const [editId, setEditId] = React.useState<string | null>(null)

  const proveedores = useQuery({
    queryKey: ["proveedores", debounced],
    queryFn: () => listarProveedores(debounced || undefined),
  })
  const data = proveedores.data ?? []
  const editando = data.find((p) => p.id === editId) ?? null

  const abrirCrear = () => {
    setNonce((n) => n + 1)
    setCreando(true)
  }

  return (
    <>
      <PageHeader
        title="Proveedores"
        description="Directorio de proveedores y condiciones de pago."
        actions={
          puedeCrear ? (
            <Button type="button" size="sm" onClick={abrirCrear}>
              <RiAddLine />
              Nuevo proveedor
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
                  placeholder="Buscar por nombre o código…"
                  className="h-9 pl-9"
                />
              </div>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {proveedores.isLoading ? "…" : `${data.length}`}
              </span>
            </div>

            {proveedores.isLoading ? (
              <div className="flex flex-col gap-2 p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : data.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <RiTruckLine className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-medium">
                    {debounced ? "Sin coincidencias" : "Sin proveedores"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {debounced
                      ? "Prueba con otro término."
                      : "Registra tu primer proveedor para gestionar compras."}
                  </p>
                </div>
                {!debounced && puedeCrear ? (
                  <Button type="button" size="sm" onClick={abrirCrear}>
                    <RiAddLine />
                    Nuevo proveedor
                  </Button>
                ) : null}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-5">Proveedor</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead className="text-right">Crédito</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((p) => (
                    <TableRow
                      key={p.id}
                      className="cursor-pointer"
                      onClick={() => setEditId(p.id)}
                    >
                      <TableCell className="pl-5">
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <RiTruckLine className="size-4" />
                          </span>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                              {p.razonSocial}
                            </div>
                            <div className="truncate font-mono text-xs text-muted-foreground">
                              {p.codigo}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.documentNumber || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.phone || p.email || "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                        {p.paymentTermDays > 0 ? `${p.paymentTermDays} días` : "Contado"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={p.estado === "ACTIVO" ? "outline" : "secondary"}
                          className={
                            p.estado === "ACTIVO"
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : undefined
                          }
                        >
                          {p.estado === "ACTIVO" ? "Activo" : "Inactivo"}
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

      <CrearProveedorSheet
        key={nonce}
        open={creando}
        onOpenChange={setCreando}
      />

      <Sheet
        open={editando != null}
        onOpenChange={(o) => {
          if (!o) setEditId(null)
        }}
      >
        <SheetContent className="w-full gap-0 p-0 sm:!max-w-md">
          {editando ? (
            <EditarProveedor key={editando.id} proveedor={editando} />
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Crear                                                              */
/* ------------------------------------------------------------------ */

function CrearProveedorSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const qc = useQueryClient()
  const [razonSocial, setRazonSocial] = React.useState("")
  const [tipoDoc, setTipoDoc] = React.useState<TipoDocumento>("RUC")
  const [numDoc, setNumDoc] = React.useState("")
  const [contacto, setContacto] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [dias, setDias] = React.useState("")

  const codigo = slug(razonSocial)

  const m = useMutation({
    mutationFn: () =>
      crearProveedor({
        codigo,
        razonSocial: razonSocial.trim(),
        documentType: numDoc.trim() ? tipoDoc : undefined,
        documentNumber: numDoc.trim() || undefined,
        contactName: contacto.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        paymentTermDays: dias ? Number(dias) : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["proveedores"] })
      onOpenChange(false)
    },
  })
  const err = errMsg(m.error)
  const valido = razonSocial.trim().length >= 2 && codigo.length >= 2

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:!max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>Nuevo proveedor</SheetTitle>
          <SheetDescription>Registra sus datos y condiciones.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-auto p-6">
          <Campo label="Razón social / Nombre">
            <Input
              value={razonSocial}
              onChange={(e) => setRazonSocial(e.target.value)}
              placeholder="Distribuidora ABC S.A.C."
              className="h-10"
            />
            {codigo ? (
              <p className="text-xs text-muted-foreground">
                Código: <span className="font-mono">{codigo}</span>
              </p>
            ) : null}
          </Campo>

          <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
            <Campo label="Tipo doc.">
              <Select
                value={tipoDoc}
                onChange={(v) => setTipoDoc(v as TipoDocumento)}
                options={TIPOS_DOCUMENTO}
              />
            </Campo>
            <Campo label="N° documento">
              <Input
                value={numDoc}
                onChange={(e) => setNumDoc(e.target.value.replace(/[^0-9A-Za-z]/g, ""))}
                placeholder="20481234567"
                className="h-10"
              />
            </Campo>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Contacto">
              <Input
                value={contacto}
                onChange={(e) => setContacto(e.target.value)}
                placeholder="Nombre"
                className="h-10"
              />
            </Campo>
            <Campo label="Teléfono">
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Opcional"
                className="h-10"
              />
            </Campo>
          </div>

          <Campo label="Correo">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Opcional"
              className="h-10"
            />
          </Campo>
          <Campo label="Dirección">
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Opcional"
              className="h-10"
            />
          </Campo>
          <Campo label="Días de crédito">
            <Input
              inputMode="numeric"
              value={dias}
              onChange={(e) => setDias(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="0 = al contado"
              className="h-10 max-w-[160px] tabular-nums"
            />
          </Campo>

          {err ? <ErrorLinea msg={err} /> : null}
        </div>

        <div className="flex justify-end gap-2 border-t p-4">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" disabled={!valido || m.isPending} onClick={() => m.mutate()}>
            <RiCheckLine />
            {m.isPending ? "Creando…" : "Crear proveedor"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/* ------------------------------------------------------------------ */
/* Editar                                                             */
/* ------------------------------------------------------------------ */

function EditarProveedor({ proveedor }: { proveedor: Proveedor }) {
  const qc = useQueryClient()
  const { can } = usePermisos()
  const puede = can("proveedores.actualizar")
  const [editando, setEditando] = React.useState(false)
  const [razonSocial, setRazonSocial] = React.useState(proveedor.razonSocial)
  const [contacto, setContacto] = React.useState(proveedor.contactName ?? "")
  const [email, setEmail] = React.useState(proveedor.email ?? "")
  const [phone, setPhone] = React.useState(proveedor.phone ?? "")
  const [dias, setDias] = React.useState(String(proveedor.paymentTermDays ?? 0))

  const invalidar = () => qc.invalidateQueries({ queryKey: ["proveedores"] })

  const mGuardar = useMutation({
    mutationFn: () =>
      actualizarProveedor(proveedor.id, {
        razonSocial: razonSocial.trim(),
        contactName: contacto.trim(),
        email: email.trim(),
        phone: phone.trim(),
        paymentTermDays: Number(dias) || 0,
      }),
    onSuccess: () => {
      invalidar()
      setEditando(false)
    },
  })
  const mEstado = useMutation({
    mutationFn: () => desactivarProveedor(proveedor.id),
    onSuccess: invalidar,
  })
  const err = errMsg(mGuardar.error || mEstado.error)
  const activo = proveedor.estado === "ACTIVO"

  return (
    <>
      <SheetHeader className="gap-3 border-b pr-14">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <RiTruckLine className="size-5" />
          </span>
          <div className="min-w-0">
            <SheetTitle className="truncate">{proveedor.razonSocial}</SheetTitle>
            <SheetDescription className="truncate font-mono text-xs">
              {proveedor.codigo}
              {proveedor.documentNumber ? ` · ${proveedor.documentNumber}` : ""}
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="flex flex-1 flex-col gap-4 overflow-auto p-6">
        {editando ? (
          <>
            <Campo label="Razón social">
              <Input
                value={razonSocial}
                onChange={(e) => setRazonSocial(e.target.value)}
                className="h-10"
              />
            </Campo>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo label="Contacto">
                <Input value={contacto} onChange={(e) => setContacto(e.target.value)} className="h-10" />
              </Campo>
              <Campo label="Teléfono">
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-10" />
              </Campo>
            </div>
            <Campo label="Correo">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-10" />
            </Campo>
            <Campo label="Días de crédito">
              <Input
                inputMode="numeric"
                value={dias}
                onChange={(e) => setDias(e.target.value.replace(/[^0-9]/g, ""))}
                className="h-10 max-w-[160px] tabular-nums"
              />
            </Campo>
          </>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <Dato label="Contacto" valor={proveedor.contactName} />
            <Dato label="Teléfono" valor={proveedor.phone} />
            <Dato label="Correo" valor={proveedor.email} />
            <Dato label="Dirección" valor={proveedor.address} />
            <Dato
              label="Crédito"
              valor={
                proveedor.paymentTermDays > 0
                  ? `${proveedor.paymentTermDays} días`
                  : "Al contado"
              }
            />
            <Dato label="Moneda" valor={proveedor.moneda ?? "PEN"} />
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
                  setRazonSocial(proveedor.razonSocial)
                  setContacto(proveedor.contactName ?? "")
                  setEmail(proveedor.email ?? "")
                  setPhone(proveedor.phone ?? "")
                  setDias(String(proveedor.paymentTermDays ?? 0))
                }}
              >
                Cancelar
              </Button>
              <Button type="button" disabled={mGuardar.isPending} onClick={() => mGuardar.mutate()}>
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
                <span className="text-xs text-muted-foreground">Proveedor inactivo</span>
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
/* Primitivos                                                         */
/* ------------------------------------------------------------------ */

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
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
