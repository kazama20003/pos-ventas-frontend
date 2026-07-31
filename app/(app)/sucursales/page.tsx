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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ApiError } from "@/lib/api/client"
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

function EstadoBadge({ estado }: { estado: EstadoRegistro }) {
  const activo = estado === "ACTIVO"
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        activo
          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {activo ? "Activa" : estado === "ARCHIVADO" ? "Archivada" : estado}
    </span>
  )
}

export default function SucursalesPage() {
  const empresas = useQuery({ queryKey: ["empresas"], queryFn: listarEmpresas })
  const sucursales = useQuery({
    queryKey: ["sucursales"],
    queryFn: listarSucursales,
  })

  const [q, setQ] = React.useState("")
  const [seleccion, setSeleccion] = React.useState<string | null>(null)
  const [creando, setCreando] = React.useState(false)

  const data = React.useMemo(
    () => sucursales.data ?? [],
    [sucursales.data]
  )
  const lista = React.useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return data
    return data.filter(
      (s) =>
        s.nombre.toLowerCase().includes(term) ||
        s.codigo.toLowerCase().includes(term)
    )
  }, [data, q])

  // Selección efectiva: la elegida o la primera disponible (sin efecto).
  const efectiva =
    (seleccion && data.some((s) => s.id === seleccion) ? seleccion : null) ??
    data[0]?.id ??
    null
  const sucursalSel = data.find((s) => s.id === efectiva) ?? null

  // Totales para la barra de resumen.
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
        title="Sucursales y almacenes"
        description="Locales, depósitos y cajas de tu negocio."
        actions={
          <Button
            type="button"
            size="sm"
            variant={creando ? "secondary" : "default"}
            onClick={() => setCreando((v) => !v)}
          >
            {creando ? <RiCloseLine /> : <RiAddLine />}
            {creando ? "Cerrar" : "Nueva sucursal"}
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-4 md:p-6">
        {/* Barra de resumen */}
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ResumenChip
            icon={RiStore2Line}
            label="Sucursales"
            valor={sucursales.isLoading ? "—" : String(totales.sucursales)}
            sub={`${totales.activas} activas`}
          />
          <ResumenChip
            icon={RiBuilding2Line}
            label="Almacenes"
            valor={sucursales.isLoading ? "—" : String(totales.almacenes)}
          />
          <ResumenChip
            icon={RiWallet3Line}
            label="Cajas"
            valor={sucursales.isLoading ? "—" : String(totales.cajas)}
          />
          <ResumenChip
            icon={RiMapPin2Line}
            label="Empresas"
            valor={
              empresas.isLoading ? "—" : String((empresas.data ?? []).length)
            }
          />
        </div>

        {creando ? (
          <div className="mb-4">
            <NuevaSucursal
              empresas={empresas.data ?? []}
              cargandoEmpresas={empresas.isLoading}
              onCreada={(id) => {
                setSeleccion(id)
                setCreando(false)
              }}
              onCancelar={() => setCreando(false)}
            />
          </div>
        ) : null}

        <div className="grid w-full gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          {/* ---- Lista de sucursales ---- */}
          <section className="flex h-fit flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm ring-1 ring-foreground/5">
            <div className="relative">
              <RiSearchLine className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar sucursal…"
                className="h-9 pl-9"
              />
            </div>

            {sucursales.isLoading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
                ))}
              </div>
            ) : lista.length === 0 ? (
              <p className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                {q ? "Sin coincidencias." : "Sin sucursales. Crea la primera."}
              </p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {lista.map((s) => {
                  const on = s.id === efectiva
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSeleccion(s.id)}
                      className={`group rounded-xl border p-3 text-left transition-all ${
                        on
                          ? "border-primary/40 bg-primary/5 shadow-sm"
                          : "hover:border-border hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                            on
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                          }`}
                        >
                          <RiStore2Line className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-medium">
                              {s.nombre}
                            </span>
                            <EstadoBadge estado={s.estado} />
                          </div>
                          <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-mono">{s.codigo}</span>
                            <span aria-hidden>·</span>
                            <span className="inline-flex items-center gap-1">
                              <RiBuilding2Line className="size-3.5" />
                              {s._count?.almacenes ?? 0}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <RiWallet3Line className="size-3.5" />
                              {s._count?.cajas ?? 0}
                            </span>
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </section>

          {/* ---- Detalle ---- */}
          {sucursales.isLoading ? (
            <Skeleton className="h-96 w-full rounded-2xl" />
          ) : sucursalSel ? (
            <DetalleSucursal key={sucursalSel.id} sucursal={sucursalSel} />
          ) : (
            <section className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-card p-12 text-center">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <RiStore2Line className="size-6" />
              </span>
              <div>
                <p className="text-sm font-medium">Sin sucursales todavía</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Crea tu primera sucursal para gestionar almacenes y cajas.
                </p>
              </div>
              <Button type="button" size="sm" onClick={() => setCreando(true)}>
                <RiAddLine />
                Nueva sucursal
              </Button>
            </section>
          )}
        </div>
      </div>
    </>
  )
}

function ResumenChip({
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
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm ring-1 ring-foreground/5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold leading-tight tabular-nums">
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

function NuevaSucursal({
  empresas,
  cargandoEmpresas,
  onCreada,
  onCancelar,
}: {
  empresas: { id: string; razonSocial: string; ruc: string }[]
  cargandoEmpresas: boolean
  onCreada: (id: string) => void
  onCancelar: () => void
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
  const err = m.error as ApiError | Error | null

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm ring-1 ring-foreground/5">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <RiAddLine className="size-4" />
        </span>
        <h2 className="text-sm font-semibold">Nueva sucursal</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-1.5">
          <Label className="text-xs text-muted-foreground">Empresa</Label>
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
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs text-muted-foreground">Nombre</Label>
          <Input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Tienda Centro"
            className="h-10"
          />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs text-muted-foreground">Dirección</Label>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Av. / Jr. / Calle"
            className="h-10"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Teléfono</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Opcional"
              className="h-10"
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Ubigeo SUNAT</Label>
            <Input
              value={ubigeo}
              onChange={(e) =>
                setUbigeo(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="6 dígitos"
              className="h-10"
            />
          </div>
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
          disabled={
            !empresaId ||
            !nombre.trim() ||
            (ubigeo.length > 0 && ubigeo.length !== 6) ||
            m.isPending
          }
          onClick={() => m.mutate()}
        >
          <RiCheckLine />
          {m.isPending ? "Creando…" : "Crear sucursal"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancelar}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}

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

  const errSuc = (mGuardar.error || mEstado.error) as ApiError | Error | null
  const nAlm = almacenes.data?.length ?? 0
  const nCaj = cajas.data?.length ?? 0

  return (
    <section className="flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm ring-1 ring-foreground/5">
      {/* Encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b bg-muted/30 p-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <RiStore2Line className="size-5" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-lg font-semibold">
                {sucursal.nombre}
              </h2>
              <EstadoBadge estado={sucursal.estado} />
            </div>
            <p className="mt-0.5 flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <span>{sucursal.codigo}</span>
              <span aria-hidden>·</span>
              <span>{nAlm} almacén(es)</span>
              <span aria-hidden>·</span>
              <span>{nCaj} caja(s)</span>
            </p>
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
            variant={sucursal.estado === "ACTIVO" ? "outline" : "secondary"}
            disabled={mEstado.isPending}
            onClick={() => mEstado.mutate()}
          >
            {sucursal.estado === "ACTIVO" ? (
              <RiArchiveLine />
            ) : (
              <RiInboxUnarchiveLine />
            )}
            {sucursal.estado === "ACTIVO" ? "Archivar" : "Reactivar"}
          </Button>
        </div>
      </div>

      {/* Pestañas */}
      <div className="p-5">
        <Tabs value={tab} onValueChange={(v) => setTab(v as string)}>
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="almacenes">
              Almacenes
              <span className="ml-1 rounded-full bg-muted px-1.5 text-xs text-muted-foreground">
                {nAlm}
              </span>
            </TabsTrigger>
            <TabsTrigger value="cajas">
              Cajas
              <span className="ml-1 rounded-full bg-muted px-1.5 text-xs text-muted-foreground">
                {nCaj}
              </span>
            </TabsTrigger>
          </TabsList>

          {/* General */}
          <TabsContent value="general" className="pt-4">
            {editando ? (
              <div className="flex flex-col gap-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Nombre
                    </Label>
                    <Input
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Dirección
                    </Label>
                    <Input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Teléfono
                    </Label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Ubigeo SUNAT
                    </Label>
                    <Input
                      value={ubigeo}
                      onChange={(e) =>
                        setUbigeo(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      placeholder="6 dígitos"
                      className="h-10"
                    />
                  </div>
                </div>
                {errSuc ? (
                  <p className="flex items-center gap-1.5 text-xs text-destructive">
                    <RiErrorWarningLine className="size-4" />
                    {errSuc.message}
                  </p>
                ) : null}
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
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <DatoItem
                  icon={RiMapPin2Line}
                  label="Dirección"
                  valor={sucursal.address}
                />
                <DatoItem
                  icon={RiPhoneLine}
                  label="Teléfono"
                  valor={sucursal.phone}
                />
                <DatoItem
                  icon={RiMapPin2Line}
                  label="Ubigeo SUNAT"
                  valor={sucursal.sunatUbigeo}
                />
              </div>
            )}
          </TabsContent>

          {/* Almacenes */}
          <TabsContent value="almacenes" className="pt-4">
            <SubEntidad
              titulo="Almacenes"
              icon={RiBuilding2Line}
              ayuda="Depósitos donde vive el stock."
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
              sucursalId={sucursal.id}
              queryKey={["almacenes", sucursal.id]}
              conTipo
              onCrear={(nombre, tipo) =>
                crearAlmacen({
                  sucursalId: sucursal.id,
                  codigo: slug(nombre),
                  nombre,
                  tipo,
                })
              }
              onRenombrar={(id, nombre, tipo) =>
                actualizarAlmacen(id, { nombre, tipo })
              }
              onArchivar={archivarAlmacen}
              onReactivar={reactivarAlmacen}
              onPredeterminar={marcarAlmacenPredeterminado}
              placeholderNuevo="Nombre del almacén"
            />
          </TabsContent>

          {/* Cajas */}
          <TabsContent value="cajas" className="pt-4">
            <SubEntidad
              titulo="Cajas"
              icon={RiWallet3Line}
              ayuda="Terminales / puntos de cobro de la sucursal."
              cargando={cajas.isLoading}
              items={(cajas.data ?? []).map((c: Caja) => ({
                id: c.id,
                nombre: c.nombre,
                sub: c.codigo,
                codigo: c.codigo,
                estado: c.estado,
              }))}
              sucursalId={sucursal.id}
              queryKey={["cajas", sucursal.id]}
              onCrear={(nombre) =>
                crearCaja({
                  sucursalId: sucursal.id,
                  codigo: slug(nombre),
                  nombre,
                })
              }
              onRenombrar={(id, nombre) => actualizarCaja(id, { nombre })}
              onArchivar={archivarCaja}
              onReactivar={reactivarCaja}
              placeholderNuevo="Nombre de la caja"
            />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}

function DatoItem({
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

type ItemSub = {
  id: string
  nombre: string
  sub: string
  codigo: string
  estado: EstadoRegistro
  tipo?: TipoAlmacen
  predeterminado?: boolean
}

function SubEntidad({
  titulo,
  icon: Icon,
  ayuda,
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
}: {
  titulo: string
  icon: React.ComponentType<{ className?: string }>
  ayuda: string
  cargando: boolean
  items: ItemSub[]
  sucursalId: string
  queryKey: (string | undefined)[]
  onCrear: (nombre: string, tipo?: TipoAlmacen) => Promise<unknown>
  onRenombrar: (
    id: string,
    nombre: string,
    tipo?: TipoAlmacen
  ) => Promise<unknown>
  onArchivar: (id: string) => Promise<unknown>
  onReactivar: (id: string) => Promise<unknown>
  onPredeterminar?: (id: string) => Promise<unknown>
  placeholderNuevo: string
  conTipo?: boolean
}) {
  const qc = useQueryClient()
  const [nuevo, setNuevo] = React.useState("")
  const [tipoNuevo, setTipoNuevo] = React.useState<TipoAlmacen>("PRINCIPAL")
  const invalidar = () => qc.invalidateQueries({ queryKey })

  const mCrear = useMutation({
    mutationFn: (nombre: string) =>
      onCrear(nombre, conTipo ? tipoNuevo : undefined),
    onSuccess: () => {
      invalidar()
      setNuevo("")
      setTipoNuevo("PRINCIPAL")
    },
  })
  const err = mCrear.error as ApiError | Error | null

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="size-4 text-primary" />
        <h3 className="text-sm font-semibold">{titulo}</h3>
        <span className="ml-auto text-xs text-muted-foreground">{ayuda}</span>
      </div>

      <div className="mb-3 flex gap-2 rounded-xl bg-muted/40 p-2.5">
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

      {err ? (
        <p className="mb-2 flex items-center gap-1.5 text-xs text-destructive">
          <RiErrorWarningLine className="size-4" />
          {err.message}
        </p>
      ) : null}

      {cargando ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed px-3 py-8 text-center text-sm text-muted-foreground">
          Sin {titulo.toLowerCase()} todavía.
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
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
            />
          ))}
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
}: {
  item: ItemSub
  queryKey: (string | undefined)[]
  onRenombrar: (
    id: string,
    nombre: string,
    tipo?: TipoAlmacen
  ) => Promise<unknown>
  onArchivar: (id: string) => Promise<unknown>
  onReactivar: (id: string) => Promise<unknown>
  onPredeterminar?: (id: string) => Promise<unknown>
  conTipo?: boolean
}) {
  const qc = useQueryClient()
  const [editando, setEditando] = React.useState(false)
  const [nombre, setNombre] = React.useState(item.nombre)
  const [tipo, setTipo] = React.useState<TipoAlmacen>(item.tipo ?? "PRINCIPAL")
  const invalidar = () => qc.invalidateQueries({ queryKey })

  const mRenombrar = useMutation({
    mutationFn: () =>
      onRenombrar(item.id, nombre.trim(), conTipo ? tipo : undefined),
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
      <div className="flex items-center gap-2 rounded-xl border bg-muted/20 p-2.5">
        <Input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="h-8 flex-1 bg-background"
        />
        {conTipo ? (
          <Select
            value={tipo}
            onChange={(v) => setTipo(v as TipoAlmacen)}
            options={TIPOS_ALMACEN}
            className="w-32 shrink-0"
          />
        ) : null}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled={!nombre.trim() || mRenombrar.isPending}
          onClick={() => mRenombrar.mutate()}
        >
          <RiCheckLine />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => {
            setEditando(false)
            setNombre(item.nombre)
            setTipo(item.tipo ?? "PRINCIPAL")
          }}
        >
          <RiCloseLine />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border p-2.5 transition-colors hover:bg-muted/30">
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
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`truncate text-sm font-medium ${
              activo ? "" : "text-muted-foreground line-through"
            }`}
          >
            {item.nombre}
          </span>
          {conTipo ? (
            <span className="inline-flex shrink-0 items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {labelTipo(item.tipo)}
            </span>
          ) : null}
          {item.predeterminado ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
              <RiStarFill className="size-3" />
              Predeterminado
            </span>
          ) : null}
          {!activo ? <EstadoBadge estado={item.estado} /> : null}
        </div>
        <p className="truncate font-mono text-xs text-muted-foreground">
          {item.sub}
        </p>
      </div>
      {onPredeterminar && activo && !item.predeterminado ? (
        <Button
          type="button"
          size="icon"
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
        size="icon"
        variant="ghost"
        onClick={() => setEditando(true)}
      >
        <RiEditLine />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        disabled={mEstado.isPending}
        title={activo ? "Archivar" : "Reactivar"}
        onClick={() => mEstado.mutate()}
      >
        {activo ? <RiArchiveLine /> : <RiInboxUnarchiveLine />}
      </Button>
    </div>
  )
}
