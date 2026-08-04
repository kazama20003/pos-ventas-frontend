"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  RiAddLine,
  RiArchiveLine,
  RiBuilding2Line,
  RiCheckLine,
  RiCloseLine,
  RiEditLine,
  RiErrorWarningLine,
  RiInboxUnarchiveLine,
  RiMapPin2Line,
  RiPhoneLine,
  RiSearchLine,
  RiStarFill,
  RiStarLine,
  RiStore2Line,
  RiWallet3Line,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ApiError } from "@/lib/api/client"
import { usePermisos } from "@/hooks/use-permisos"
import {
  actualizarAlmacen,
  actualizarCaja,
  actualizarSucursal,
  archivarAlmacen,
  archivarCaja,
  archivarSucursal,
  crearAlmacen,
  crearCaja,
  crearSucursal,
  listarAlmacenes,
  listarCajas,
  listarEmpresas,
  listarSucursales,
  marcarAlmacenPredeterminado,
  reactivarAlmacen,
  reactivarCaja,
  reactivarSucursal,
  type Almacen,
  type Caja,
  type EstadoRegistro,
  type Sucursal,
  type TipoAlmacen,
} from "@/lib/api/organizacion"

const TIPOS_ALMACEN: { value: TipoAlmacen; label: string }[] = [
  { value: "PRINCIPAL", label: "Principal" },
  { value: "TRANSITO", label: "Tránsito" },
  { value: "MERMA", label: "Merma" },
  { value: "DEVOLUCIONES", label: "Devoluciones" },
]
const labelTipo = (t?: TipoAlmacen) =>
  TIPOS_ALMACEN.find((x) => x.value === t)?.label ?? "Principal"

function slug(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 20)
}

function errMsg(e: unknown) {
  return (e as ApiError | Error | null)?.message ?? null
}

function EstadoBadge({ estado }: { estado: EstadoRegistro }) {
  const activo = estado === "ACTIVO"
  return (
    <Badge variant={activo ? "outline" : "secondary"} className={activo ? "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10" : undefined}>
      {activo ? "Activa" : estado === "ARCHIVADO" ? "Archivada" : estado}
    </Badge>
  )
}

/* ------------------------------------------------------------------ */
/* Página                                                             */
/* ------------------------------------------------------------------ */

export default function SucursalesPage() {
  const empresas = useQuery({ queryKey: ["empresas"], queryFn: listarEmpresas })
  const sucursales = useQuery({
    queryKey: ["sucursales"],
    queryFn: listarSucursales,
  })

  const [q, setQ] = React.useState("")
  const [creando, setCreando] = React.useState(false)
  const [nonceCrear, setNonceCrear] = React.useState(0)
  const [detalleId, setDetalleId] = React.useState<string | null>(null)

  // Cada apertura remonta el formulario de alta (estado fresco sin efectos).
  const abrirCrear = () => {
    setNonceCrear((n) => n + 1)
    setCreando(true)
  }

  const { can } = usePermisos()
  const puedeGestionar = can("sucursales.gestionar")

  const data = React.useMemo(() => sucursales.data ?? [], [sucursales.data])
  const lista = React.useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return data
    return data.filter(
      (s) =>
        s.nombre.toLowerCase().includes(term) ||
        s.codigo.toLowerCase().includes(term)
    )
  }, [data, q])

  const detalle = data.find((s) => s.id === detalleId) ?? null

  const totales = React.useMemo(() => {
    let almacenes = 0
    let cajas = 0
    let activas = 0
    for (const s of data) {
      almacenes += s._count?.almacenes ?? 0
      cajas += s._count?.cajas ?? 0
      if (s.estado === "ACTIVO") activas += 1
    }
    return { sucursales: data.length, activas, almacenes, cajas }
  }, [data])

  return (
    <>
      <PageHeader
        title="Organización"
        description="Sucursales, almacenes y cajas de tu negocio."
        actions={
          puedeGestionar ? (
            <Button type="button" size="sm" onClick={abrirCrear}>
              <RiAddLine />
              Nueva sucursal
            </Button>
          ) : null
        }
      />

      <div className="flex-1 overflow-auto">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 p-5 md:p-6">
          {/* KPIs */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi
              icon={RiStore2Line}
              label="Sucursales"
              valor={sucursales.isLoading ? "—" : String(totales.sucursales)}
              sub={
                sucursales.isLoading ? undefined : `${totales.activas} activas`
              }
            />
            <Kpi
              icon={RiBuilding2Line}
              label="Almacenes"
              valor={sucursales.isLoading ? "—" : String(totales.almacenes)}
            />
            <Kpi
              icon={RiWallet3Line}
              label="Cajas"
              valor={sucursales.isLoading ? "—" : String(totales.cajas)}
            />
            <Kpi
              icon={RiMapPin2Line}
              label="Empresas"
              valor={
                empresas.isLoading ? "—" : String((empresas.data ?? []).length)
              }
            />
          </div>

          {/* Tabla de sucursales */}
          <div className="rounded-xl border bg-card">
            <div className="flex items-center justify-between gap-3 border-b p-3">
              <div className="relative w-full max-w-xs">
                <RiSearchLine className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar sucursal…"
                  className="h-9 pl-9"
                />
              </div>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {sucursales.isLoading
                  ? "…"
                  : `${lista.length} de ${data.length}`}
              </span>
            </div>

            {sucursales.isLoading ? (
              <div className="flex flex-col gap-2 p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-11 w-full rounded-lg" />
                ))}
              </div>
            ) : lista.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <RiStore2Line className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-medium">
                    {q ? "Sin coincidencias" : "Sin sucursales todavía"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {q
                      ? "Prueba con otro término."
                      : "Crea tu primera sucursal para gestionar almacenes y cajas."}
                  </p>
                </div>
                {!q ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={abrirCrear}
                  >
                    <RiAddLine />
                    Nueva sucursal
                  </Button>
                ) : null}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Sucursal</TableHead>
                    <TableHead className="text-right">Almacenes</TableHead>
                    <TableHead className="text-right">Cajas</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-0" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lista.map((s) => (
                    <TableRow
                      key={s.id}
                      className="cursor-pointer"
                      onClick={() => setDetalleId(s.id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <RiStore2Line className="size-4" />
                          </span>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                              {s.nombre}
                            </div>
                            <div className="truncate font-mono text-xs text-muted-foreground">
                              {s.codigo}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                        {s._count?.almacenes ?? 0}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                        {s._count?.cajas ?? 0}
                      </TableCell>
                      <TableCell>
                        <EstadoBadge estado={s.estado} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          tabIndex={-1}
                          className="text-muted-foreground"
                        >
                          <RiEditLine />
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

      {/* Slide-over: crear */}
      <CrearSucursalSheet
        key={nonceCrear}
        open={creando}
        onOpenChange={setCreando}
        empresas={empresas.data ?? []}
        cargandoEmpresas={empresas.isLoading}
        onCreada={(id) => {
          setCreando(false)
          setDetalleId(id)
        }}
      />

      {/* Slide-over: detalle */}
      <Sheet
        open={detalle != null}
        onOpenChange={(o) => {
          if (!o) setDetalleId(null)
        }}
      >
        <SheetContent className="w-full gap-0 p-0 sm:!max-w-2xl">
          {detalle ? (
            <DetalleSucursal key={detalle.id} sucursal={detalle} />
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* KPI                                                                */
/* ------------------------------------------------------------------ */

function Kpi({
  icon: Icon,
  label,
  valor,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  valor: string
  sub?: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4.5" />
      </span>
      <div className="min-w-0">
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
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Crear sucursal (Sheet)                                             */
/* ------------------------------------------------------------------ */

function CrearSucursalSheet({
  open,
  onOpenChange,
  empresas,
  cargandoEmpresas,
  onCreada,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  empresas: { id: string; razonSocial: string; ruc: string }[]
  cargandoEmpresas: boolean
  onCreada: (id: string) => void
}) {
  const qc = useQueryClient()
  const [empresaId, setEmpresaId] = React.useState("")
  const [nombre, setNombre] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [ubigeo, setUbigeo] = React.useState("")

  const m = useMutation({
    mutationFn: () =>
      crearSucursal({
        empresaId,
        codigo: slug(nombre),
        nombre: nombre.trim(),
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        sunatUbigeo: ubigeo.trim() || undefined,
      }),
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: ["sucursales"] })
      onCreada(s.id)
    },
  })
  const err = errMsg(m.error)
  const invalido =
    !empresaId ||
    !nombre.trim() ||
    (ubigeo.length > 0 && ubigeo.length !== 6) ||
    m.isPending

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:!max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>Nueva sucursal</SheetTitle>
          <SheetDescription>
            Registra un local. Luego añades sus almacenes y cajas.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-auto p-6">
          <Campo label="Empresa">
            <Select
              value={empresaId}
              onChange={setEmpresaId}
              placeholder={cargandoEmpresas ? "Cargando…" : "Elige la empresa"}
              options={empresas.map((e) => ({
                value: e.id,
                label: e.razonSocial,
                hint: e.ruc,
              }))}
            />
          </Campo>
          <Campo label="Nombre">
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Tienda Centro"
              className="h-10"
            />
            {nombre.trim() ? (
              <p className="text-xs text-muted-foreground">
                Código: <span className="font-mono">{slug(nombre)}</span>
              </p>
            ) : null}
          </Campo>
          <Campo label="Dirección">
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Av. / Jr. / Calle"
              className="h-10"
            />
          </Campo>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Teléfono">
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Opcional"
                className="h-10"
              />
            </Campo>
            <Campo label="Ubigeo SUNAT">
              <Input
                value={ubigeo}
                onChange={(e) =>
                  setUbigeo(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="6 dígitos"
                className="h-10"
              />
            </Campo>
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
          <Button type="button" disabled={invalido} onClick={() => m.mutate()}>
            <RiCheckLine />
            {m.isPending ? "Creando…" : "Crear sucursal"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/* ------------------------------------------------------------------ */
/* Detalle sucursal                                                   */
/* ------------------------------------------------------------------ */

function DetalleSucursal({ sucursal }: { sucursal: Sucursal }) {
  const qc = useQueryClient()
  const almacenes = useQuery({
    queryKey: ["almacenes", sucursal.id],
    queryFn: () => listarAlmacenes(sucursal.id),
  })
  const cajas = useQuery({
    queryKey: ["cajas", sucursal.id],
    queryFn: () => listarCajas(sucursal.id),
  })

  const [tab, setTab] = React.useState("general")
  const [editando, setEditando] = React.useState(false)
  const [nombre, setNombre] = React.useState(sucursal.nombre)
  const [address, setAddress] = React.useState(sucursal.address ?? "")
  const [phone, setPhone] = React.useState(sucursal.phone ?? "")
  const [ubigeo, setUbigeo] = React.useState(sucursal.sunatUbigeo ?? "")

  const invalidarSuc = () => qc.invalidateQueries({ queryKey: ["sucursales"] })

  const mGuardar = useMutation({
    mutationFn: () =>
      actualizarSucursal(sucursal.id, {
        nombre: nombre.trim(),
        address: address.trim(),
        phone: phone.trim(),
        sunatUbigeo: ubigeo.trim(),
      }),
    onSuccess: () => {
      invalidarSuc()
      setEditando(false)
    },
  })
  const mEstado = useMutation({
    mutationFn: () =>
      sucursal.estado === "ACTIVO"
        ? archivarSucursal(sucursal.id)
        : reactivarSucursal(sucursal.id),
    onSuccess: invalidarSuc,
  })

  const errSuc = errMsg(mGuardar.error || mEstado.error)
  const nAlm = almacenes.data?.length ?? 0
  const nCaj = cajas.data?.length ?? 0
  const activa = sucursal.estado === "ACTIVO"

  return (
    <>
      {/* Encabezado */}
      <SheetHeader className="gap-3 border-b pr-14">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <RiStore2Line className="size-5" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <SheetTitle className="truncate">{sucursal.nombre}</SheetTitle>
              <EstadoBadge estado={sucursal.estado} />
            </div>
            <SheetDescription className="truncate font-mono text-xs">
              {sucursal.codigo} · {nAlm} almacén(es) · {nCaj} caja(s)
            </SheetDescription>
          </div>
        </div>
        <div className="flex gap-2">
          {!editando && tab === "general" ? (
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
          <Button
            type="button"
            size="sm"
            variant={activa ? "outline" : "secondary"}
            disabled={mEstado.isPending}
            onClick={() => mEstado.mutate()}
          >
            {activa ? <RiArchiveLine /> : <RiInboxUnarchiveLine />}
            {activa ? "Archivar" : "Reactivar"}
          </Button>
        </div>
      </SheetHeader>

      {/* Cuerpo */}
      <div className="flex flex-1 flex-col overflow-auto p-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as string)}>
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="almacenes">Almacenes ({nAlm})</TabsTrigger>
            <TabsTrigger value="cajas">Cajas ({nCaj})</TabsTrigger>
          </TabsList>

          {/* General */}
          <TabsContent value="general" className="pt-5">
            {editando ? (
              <div className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo label="Nombre">
                    <Input
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="h-10"
                    />
                  </Campo>
                  <Campo label="Dirección">
                    <Input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="h-10"
                    />
                  </Campo>
                  <Campo label="Teléfono">
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-10"
                    />
                  </Campo>
                  <Campo label="Ubigeo SUNAT">
                    <Input
                      value={ubigeo}
                      onChange={(e) =>
                        setUbigeo(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      placeholder="6 dígitos"
                      className="h-10"
                    />
                  </Campo>
                </div>
                {errSuc ? <ErrorLinea msg={errSuc} /> : null}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    disabled={
                      !nombre.trim() ||
                      (ubigeo.length > 0 && ubigeo.length !== 6) ||
                      mGuardar.isPending
                    }
                    onClick={() => mGuardar.mutate()}
                  >
                    <RiCheckLine />
                    {mGuardar.isPending ? "Guardando…" : "Guardar cambios"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setEditando(false)
                      setNombre(sucursal.nombre)
                      setAddress(sucursal.address ?? "")
                      setPhone(sucursal.phone ?? "")
                      setUbigeo(sucursal.sunatUbigeo ?? "")
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <Dato
                  icon={RiMapPin2Line}
                  label="Dirección"
                  valor={sucursal.address}
                />
                <Dato
                  icon={RiPhoneLine}
                  label="Teléfono"
                  valor={sucursal.phone}
                />
                <Dato
                  icon={RiMapPin2Line}
                  label="Ubigeo SUNAT"
                  valor={sucursal.sunatUbigeo}
                />
              </div>
            )}
          </TabsContent>

          {/* Almacenes */}
          <TabsContent value="almacenes" className="pt-5">
            <SubTabla
              titulo="almacenes"
              cargando={almacenes.isLoading}
              items={(almacenes.data ?? []).map((a: Almacen) => ({
                id: a.id,
                nombre: a.nombre,
                sub: a.address || a.codigo,
                codigo: a.codigo,
                estado: a.estado,
                tipo: a.tipo,
                predeterminado: a.esPredeterminado,
              }))}
              queryKey={["almacenes", sucursal.id]}
              conTipo
              onCrear={(nombre, opts) =>
                crearAlmacen({
                  sucursalId: sucursal.id,
                  codigo: slug(nombre),
                  nombre,
                  tipo: opts?.tipo,
                })
              }
              onRenombrar={(id, nombre, opts) =>
                actualizarAlmacen(id, { nombre, tipo: opts?.tipo })
              }
              onArchivar={archivarAlmacen}
              onReactivar={reactivarAlmacen}
              onPredeterminar={marcarAlmacenPredeterminado}
              placeholderNuevo="Nombre del almacén"
            />
          </TabsContent>

          {/* Cajas */}
          <TabsContent value="cajas" className="pt-5">
            <SubTabla
              titulo="cajas"
              cargando={cajas.isLoading}
              items={(cajas.data ?? []).map((c: Caja) => ({
                id: c.id,
                nombre: c.nombre,
                sub: c.almacenId
                  ? `${c.codigo} · ${
                      (almacenes.data ?? []).find(
                        (a: Almacen) => a.id === c.almacenId,
                      )?.nombre ?? "almacén"
                    }`
                  : `${c.codigo} · sin almacén`,
                codigo: c.codigo,
                estado: c.estado,
                almacenId: c.almacenId,
              }))}
              queryKey={["cajas", sucursal.id]}
              almacenes={(almacenes.data ?? [])
                .filter((a: Almacen) => a.estado === "ACTIVO")
                .map((a: Almacen) => ({ value: a.id, label: a.nombre }))}
              onCrear={(nombre, opts) =>
                crearCaja({
                  sucursalId: sucursal.id,
                  codigo: slug(nombre),
                  nombre,
                  almacenId: opts?.almacenId,
                })
              }
              onRenombrar={(id, nombre, opts) =>
                actualizarCaja(id, {
                  nombre,
                  almacenId: opts?.almacenId ?? null,
                })
              }
              onArchivar={archivarCaja}
              onReactivar={reactivarCaja}
              placeholderNuevo="Nombre de la caja"
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Sub-tabla (almacenes / cajas)                                      */
/* ------------------------------------------------------------------ */

type ItemSub = {
  id: string
  nombre: string
  sub: string
  codigo: string
  estado: EstadoRegistro
  tipo?: TipoAlmacen
  predeterminado?: boolean
  almacenId?: string | null
}

type OpcionesCrear = { tipo?: TipoAlmacen; almacenId?: string }

function SubTabla({
  titulo,
  cargando,
  items,
  queryKey,
  onCrear,
  onRenombrar,
  onArchivar,
  onReactivar,
  onPredeterminar,
  placeholderNuevo,
  conTipo,
  almacenes,
}: {
  titulo: string
  cargando: boolean
  items: ItemSub[]
  queryKey: (string | undefined)[]
  onCrear: (nombre: string, opts?: OpcionesCrear) => Promise<unknown>
  onRenombrar: (
    id: string,
    nombre: string,
    opts?: OpcionesCrear,
  ) => Promise<unknown>
  onArchivar: (id: string) => Promise<unknown>
  onReactivar: (id: string) => Promise<unknown>
  onPredeterminar?: (id: string) => Promise<unknown>
  placeholderNuevo: string
  conTipo?: boolean
  /** Si se pasa, la fila ofrece elegir el almacén de origen (modo cajas). */
  almacenes?: { value: string; label: string }[]
}) {
  const qc = useQueryClient()
  const [nuevo, setNuevo] = React.useState("")
  const [tipoNuevo, setTipoNuevo] = React.useState<TipoAlmacen>("PRINCIPAL")
  const [almacenNuevo, setAlmacenNuevo] = React.useState("")
  const invalidar = () => qc.invalidateQueries({ queryKey })

  const mCrear = useMutation({
    mutationFn: (nombre: string) =>
      onCrear(nombre, {
        ...(conTipo ? { tipo: tipoNuevo } : {}),
        ...(almacenes ? { almacenId: almacenNuevo || undefined } : {}),
      }),
    onSuccess: () => {
      invalidar()
      setNuevo("")
      setTipoNuevo("PRINCIPAL")
      setAlmacenNuevo("")
    },
  })
  const err = errMsg(mCrear.error)

  return (
    <div className="flex flex-col gap-3">
      {/* Alta rápida */}
      <div className="flex gap-2 rounded-xl border bg-muted/30 p-2">
        <Input
          value={nuevo}
          onChange={(e) => setNuevo(e.target.value)}
          placeholder={placeholderNuevo}
          className="h-9 bg-background"
          onKeyDown={(e) => {
            if (e.key === "Enter" && nuevo.trim() && !mCrear.isPending) {
              mCrear.mutate(nuevo.trim())
            }
          }}
        />
        {conTipo ? (
          <Select
            value={tipoNuevo}
            onChange={(v) => setTipoNuevo(v as TipoAlmacen)}
            options={TIPOS_ALMACEN}
            className="w-40 shrink-0"
          />
        ) : null}
        {almacenes ? (
          <Select
            value={almacenNuevo}
            onChange={setAlmacenNuevo}
            options={[{ value: "", label: "Sin almacén" }, ...almacenes]}
            placeholder="Almacén"
            className="w-44 shrink-0"
          />
        ) : null}
        <Button
          type="button"
          size="sm"
          disabled={!nuevo.trim() || mCrear.isPending}
          onClick={() => mCrear.mutate(nuevo.trim())}
        >
          <RiAddLine />
          {mCrear.isPending ? "…" : "Agregar"}
        </Button>
      </div>

      {err ? <ErrorLinea msg={err} /> : null}

      {cargando ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed px-3 py-10 text-center text-sm text-muted-foreground">
          Sin {titulo} todavía.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableBody>
              {items.map((it) => (
                <FilaSub
                  key={it.id}
                  item={it}
                  queryKey={queryKey}
                  onRenombrar={onRenombrar}
                  onArchivar={onArchivar}
                  onReactivar={onReactivar}
                  onPredeterminar={onPredeterminar}
                  conTipo={conTipo}
                  almacenes={almacenes}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

function FilaSub({
  item,
  queryKey,
  onRenombrar,
  onArchivar,
  onReactivar,
  onPredeterminar,
  conTipo,
  almacenes,
}: {
  item: ItemSub
  queryKey: (string | undefined)[]
  onRenombrar: (
    id: string,
    nombre: string,
    opts?: OpcionesCrear,
  ) => Promise<unknown>
  onArchivar: (id: string) => Promise<unknown>
  onReactivar: (id: string) => Promise<unknown>
  onPredeterminar?: (id: string) => Promise<unknown>
  conTipo?: boolean
  almacenes?: { value: string; label: string }[]
}) {
  const qc = useQueryClient()
  const [editando, setEditando] = React.useState(false)
  const [nombre, setNombre] = React.useState(item.nombre)
  const [tipo, setTipo] = React.useState<TipoAlmacen>(item.tipo ?? "PRINCIPAL")
  const [almacenSel, setAlmacenSel] = React.useState(item.almacenId ?? "")
  const invalidar = () => qc.invalidateQueries({ queryKey })

  const mRenombrar = useMutation({
    mutationFn: () =>
      onRenombrar(item.id, nombre.trim(), {
        ...(conTipo ? { tipo } : {}),
        ...(almacenes ? { almacenId: almacenSel || undefined } : {}),
      }),
    onSuccess: () => {
      invalidar()
      setEditando(false)
    },
  })
  const mEstado = useMutation({
    mutationFn: () =>
      item.estado === "ACTIVO" ? onArchivar(item.id) : onReactivar(item.id),
    onSuccess: invalidar,
  })
  const mPredeterminar = useMutation({
    mutationFn: () => onPredeterminar!(item.id),
    onSuccess: invalidar,
  })

  const activo = item.estado === "ACTIVO"

  if (editando) {
    return (
      <TableRow className="hover:bg-transparent">
        <TableCell colSpan={2}>
          <div className="flex items-center gap-2">
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="h-9 flex-1"
              autoFocus
            />
            {conTipo ? (
              <Select
                value={tipo}
                onChange={(v) => setTipo(v as TipoAlmacen)}
                options={TIPOS_ALMACEN}
                className="w-36 shrink-0"
              />
            ) : null}
            {almacenes ? (
              <Select
                value={almacenSel}
                onChange={setAlmacenSel}
                options={[{ value: "", label: "Sin almacén" }, ...almacenes]}
                placeholder="Almacén"
                className="w-40 shrink-0"
              />
            ) : null}
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              disabled={!nombre.trim() || mRenombrar.isPending}
              onClick={() => mRenombrar.mutate()}
            >
              <RiCheckLine />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={() => {
                setEditando(false)
                setNombre(item.nombre)
                setTipo(item.tipo ?? "PRINCIPAL")
                setAlmacenSel(item.almacenId ?? "")
              }}
            >
              <RiCloseLine />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2.5">
          <span
            className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
              activo
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {conTipo ? (
              <RiBuilding2Line className="size-4" />
            ) : (
              <RiWallet3Line className="size-4" />
            )}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`truncate text-sm font-medium ${
                  activo ? "" : "text-muted-foreground line-through"
                }`}
              >
                {item.nombre}
              </span>
              {conTipo ? (
                <Badge variant="secondary">{labelTipo(item.tipo)}</Badge>
              ) : null}
              {item.predeterminado ? (
                <Badge className="gap-1 bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <RiStarFill className="size-3" />
                  Predet.
                </Badge>
              ) : null}
              {!activo ? <EstadoBadge estado={item.estado} /> : null}
            </div>
            <p className="truncate font-mono text-xs text-muted-foreground">
              {item.sub}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell className="w-0 whitespace-nowrap text-right">
        <div className="flex justify-end gap-0.5">
          {onPredeterminar && activo && !item.predeterminado ? (
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              disabled={mPredeterminar.isPending}
              title="Marcar como predeterminado"
              onClick={() => mPredeterminar.mutate()}
            >
              <RiStarLine />
            </Button>
          ) : null}
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            title="Renombrar"
            onClick={() => setEditando(true)}
          >
            <RiEditLine />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            disabled={mEstado.isPending}
            title={activo ? "Archivar" : "Reactivar"}
            onClick={() => mEstado.mutate()}
          >
            {activo ? <RiArchiveLine /> : <RiInboxUnarchiveLine />}
          </Button>
        </div>
      </TableCell>
    </TableRow>
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

function Dato({
  icon: Icon,
  label,
  valor,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  valor?: string | null
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border bg-muted/20 p-3.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{valor || "—"}</p>
      </div>
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
