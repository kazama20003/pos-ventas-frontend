"use client"

import * as React from "react"
import { toast } from "sonner"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  RiArrowDownLine,
  RiArrowUpLine,
  RiCashLine,
  RiCheckLine,
  RiErrorWarningLine,
  RiHandCoinLine,
  RiLockLine,
  RiStore2Line,
  RiTimeLine,
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
import {
  abrirCaja,
  cerrarCaja,
  listarSesiones,
  misCajas,
  movimientosCaja,
  registrarMovimiento,
  resumenCaja,
  sesionAbierta,
  type MovimientoCaja,
  type SesionAbierta,
  type SesionCajaResumen,
  type TipoMovimientoManual,
} from "@/lib/api/caja"
import { useSucursalActiva } from "@/hooks/use-sucursal-activa"
import { usePermisos } from "@/hooks/use-permisos"

const sol = (v: string | number) =>
  `S/ ${Number(v).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const fecha = (iso: string) =>
  new Date(iso).toLocaleString("es-PE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })

const MOV_LABEL: Record<string, string> = {
  FONDO_APERTURA: "Fondo de apertura",
  VENTA_EFECTIVO: "Venta (efectivo)",
  DEVOLUCION_EFECTIVO: "Devolución",
  INGRESO_EFECTIVO: "Ingreso",
  EGRESO_EFECTIVO: "Egreso",
  RETIRO: "Retiro",
  AJUSTE_CIERRE: "Ajuste de cierre",
}

function errMsg(e: unknown) {
  return (e as ApiError | Error | null)?.message ?? null
}

/* ------------------------------------------------------------------ */
/* Página                                                             */
/* ------------------------------------------------------------------ */

export default function CajaPage() {
  const { sucursalId, sucursal } = useSucursalActiva()

  const sesion = useQuery({
    queryKey: ["sesion-abierta", sucursalId],
    queryFn: () => sesionAbierta(sucursalId!),
    enabled: !!sucursalId,
  })

  return (
    <>
      <PageHeader
        title="Caja"
        description={
          sucursal
            ? `Turno de caja · ${sucursal.nombre}`
            : "Turno de caja y arqueo"
        }
      />

      <div className="flex-1 overflow-auto">
        <div className="flex w-full flex-col gap-6 p-5 md:p-6">
          {!sucursalId ? (
            <Aviso
              icon={RiStore2Line}
              titulo="Elige una sucursal"
              texto="Selecciona la sucursal activa en la barra lateral para operar la caja."
            />
          ) : (
            <>
              {sesion.isLoading ? (
                <Skeleton className="h-64 w-full rounded-xl" />
              ) : sesion.data ? (
                <CajaAbierta sesion={sesion.data} sucursalId={sucursalId} />
              ) : (
                <AbrirCaja sucursalId={sucursalId} />
              )}
              <HistorialTurnos sucursalId={sucursalId} />
            </>
          )}
        </div>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Abrir caja                                                         */
/* ------------------------------------------------------------------ */

function AbrirCaja({ sucursalId }: { sucursalId: string }) {
  const qc = useQueryClient()
  const { setSesionCaja } = useSucursalActiva()
  const { can } = usePermisos()
  const puede = can("caja.abrir")

  // Solo las cajas que este usuario puede abrir (asignadas, o todas si es admin).
  const cajas = useQuery({
    queryKey: ["mis-cajas", sucursalId],
    queryFn: () => misCajas(sucursalId),
  })
  const activas = cajas.data ?? []

  const [cajaId, setCajaId] = React.useState("")
  const [monto, setMonto] = React.useState("")

  const cajaEfectiva = cajaId || (activas.length === 1 ? activas[0].id : "")

  const m = useMutation({
    mutationFn: () =>
      abrirCaja({
        sucursalId,
        cajaId: cajaEfectiva,
        montoApertura: Number(monto || 0),
      }),
    onSuccess: (s) => {
      toast.success("Caja abierta", { description: "Turno iniciado." })
      setSesionCaja(s.id)
      qc.invalidateQueries({ queryKey: ["sesion-abierta", sucursalId] })
      qc.invalidateQueries({ queryKey: ["sesiones", sucursalId] })
    },
    onError: (e) =>
      toast.error("No se pudo abrir la caja", {
        description: errMsg(e) ?? undefined,
      }),
  })
  const err = errMsg(m.error)
  const montoValido = monto !== "" && Number(monto) >= 0

  if (!puede) {
    return (
      <Aviso
        icon={RiLockLine}
        titulo="Sin permiso"
        texto="Tu rol no permite abrir caja en esta sucursal."
      />
    )
  }

  if (cajas.isLoading) {
    return <Skeleton className="h-72 w-full rounded-xl" />
  }
  if (activas.length === 0) {
    return (
      <Aviso
        icon={RiErrorWarningLine}
        titulo="Sin cajas disponibles"
        texto="No tienes cajas asignadas en esta sucursal. Pide a un administrador que te asigne una en Usuarios."
      />
    )
  }

  return (
    <div className="grid items-start gap-5 lg:grid-cols-3">
      {/* Formulario */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm lg:col-span-2">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <RiCashLine className="size-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold">Abrir caja</h2>
            <p className="text-sm text-muted-foreground">
              Elige la caja e inicia el turno con el fondo de apertura.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="grid gap-2">
            <Label className="text-xs text-muted-foreground">Caja</Label>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {activas.map((c) => {
                const on = c.id === cajaEfectiva
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCajaId(c.id)}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                      on
                        ? "border-primary bg-primary/5"
                        : "hover:border-border hover:bg-muted/40"
                    }`}
                  >
                    <span
                      className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                        on
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <RiCashLine className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {c.nombre}
                      </div>
                      <div className="truncate font-mono text-xs text-muted-foreground">
                        {c.codigo}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid max-w-xs gap-1.5">
            <Label className="text-xs text-muted-foreground">
              Fondo de apertura (S/)
            </Label>
            <Input
              inputMode="decimal"
              value={monto}
              onChange={(e) => setMonto(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="0.00"
              className="h-12 text-xl tabular-nums"
            />
          </div>

          {err ? <ErrorLinea msg={err} /> : null}

          <div>
            <Button
              type="button"
              size="lg"
              disabled={!cajaEfectiva || !montoValido || m.isPending}
              onClick={() => m.mutate()}
            >
              <RiCashLine />
              {m.isPending ? "Abriendo…" : "Abrir caja"}
            </Button>
          </div>
        </div>
      </div>

      {/* Panel guía (mini-hero oscuro) */}
      <aside className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 p-6 text-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] ring-1 ring-white/10 lg:col-span-1">
        <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative">
          <h3 className="text-sm font-semibold">Cómo funciona</h3>
          <ol className="mt-4 flex flex-col gap-4">
            <PasoGuia n={1} texto="Abres el turno con el efectivo con que arranca el cajón (fondo)." />
            <PasoGuia n={2} texto="Las ventas en efectivo suman al esperado. Registras ingresos, egresos y retiros." />
            <PasoGuia n={3} texto="Al cerrar cuentas el efectivo real; el sistema calcula sobrante o faltante." />
          </ol>
          <p className="mt-5 border-t border-white/10 pt-4 text-xs text-white/50">
            {activas.length} caja{activas.length === 1 ? "" : "s"} activa
            {activas.length === 1 ? "" : "s"} en esta sucursal.
          </p>
        </div>
      </aside>
    </div>
  )
}

function PasoGuia({ n, texto }: { n: number; texto: string }) {
  return (
    <li className="flex gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white ring-1 ring-white/15">
        {n}
      </span>
      <span className="text-sm leading-relaxed text-white/70">{texto}</span>
    </li>
  )
}

/* ------------------------------------------------------------------ */
/* Caja abierta                                                       */
/* ------------------------------------------------------------------ */

function CajaAbierta({
  sesion,
  sucursalId,
}: {
  sesion: NonNullable<SesionAbierta>
  sucursalId: string
}) {
  const qc = useQueryClient()
  const { can } = usePermisos()
  const [cerrando, setCerrando] = React.useState(false)
  const [movTipo, setMovTipo] = React.useState<TipoMovimientoManual | null>(
    null
  )

  const resumen = useQuery({
    queryKey: ["caja-resumen", sesion.id],
    queryFn: () => resumenCaja(sesion.id),
  })
  const movimientos = useQuery({
    queryKey: ["caja-movimientos", sesion.id],
    queryFn: () => movimientosCaja(sesion.id),
  })

  const esperado = resumen.data?.efectivoEsperado ?? "0.00"

  const invalidar = () => {
    qc.invalidateQueries({ queryKey: ["caja-resumen", sesion.id] })
    qc.invalidateQueries({ queryKey: ["caja-movimientos", sesion.id] })
  }

  const lista = movimientos.data ?? []

  return (
    <div className="flex flex-col gap-5">
      {/* HERO oscuro (Linear/Stripe) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 p-6 text-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] ring-1 ring-white/10 md:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 size-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-medium text-white/60">
              <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_10px_2px] shadow-emerald-400/50" />
              Caja abierta
              <span className="text-white/30">·</span>
              <span className="truncate">{sesion.cashRegister.nombre}</span>
              <span className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-white/70">
                {sesion.cashRegister.codigo}
              </span>
            </div>

            <p className="mt-5 text-sm text-white/50">Efectivo esperado</p>
            <p className="text-4xl font-semibold tracking-tight tabular-nums md:text-5xl">
              {resumen.isLoading ? "—" : sol(esperado)}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-white/45">
              <span className="inline-flex items-center gap-1.5">
                <RiTimeLine className="size-3.5" />
                Desde {fecha(sesion.abiertoEn)}
              </span>
              <span>
                Fondo{" "}
                <span className="font-medium text-white/70 tabular-nums">
                  {resumen.isLoading ? "—" : sol(resumen.data!.montoApertura)}
                </span>
              </span>
              <span>
                <span className="font-medium text-white/70 tabular-nums">
                  {movimientos.isLoading ? "—" : lista.length}
                </span>{" "}
                movimientos
              </span>
            </div>
          </div>

          {can("caja.cerrar") ? (
            <button
              type="button"
              onClick={() => setCerrando(true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white ring-1 ring-white/15 backdrop-blur transition-all hover:bg-white/20 hover:ring-white/25"
            >
              <RiLockLine className="size-4" />
              Cerrar y arquear
            </button>
          ) : null}
        </div>
      </div>

      {/* Dos columnas: historial | acciones */}
      <div className="grid items-start gap-5 lg:grid-cols-3">
        {/* Movimientos */}
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b px-5 py-3.5">
            <h3 className="text-sm font-semibold">Movimientos de efectivo</h3>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground tabular-nums">
              {movimientos.isLoading ? "…" : lista.length}
            </span>
          </div>
          {movimientos.isLoading ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          ) : lista.length === 0 ? (
            <p className="px-5 py-16 text-center text-sm text-muted-foreground">
              Sin movimientos todavía.
              <br />
              Las ventas en efectivo aparecerán aquí automáticamente.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5">Concepto</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead className="pr-5 text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lista.map((mv) => (
                  <FilaMovimiento key={mv.id} mv={mv} />
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Acciones */}
        <aside className="flex flex-col gap-5 lg:sticky lg:top-4">
          {can("caja.abrir") ? (
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <h3 className="mb-3.5 text-sm font-semibold">Registrar efectivo</h3>
              <div className="grid grid-cols-3 gap-2">
                <AccionMov
                  icon={RiArrowDownLine}
                  label="Ingreso"
                  activo={movTipo === "INGRESO_EFECTIVO"}
                  onClick={() =>
                    setMovTipo((t) =>
                      t === "INGRESO_EFECTIVO" ? null : "INGRESO_EFECTIVO"
                    )
                  }
                />
                <AccionMov
                  icon={RiArrowUpLine}
                  label="Egreso"
                  activo={movTipo === "EGRESO_EFECTIVO"}
                  onClick={() =>
                    setMovTipo((t) =>
                      t === "EGRESO_EFECTIVO" ? null : "EGRESO_EFECTIVO"
                    )
                  }
                />
                <AccionMov
                  icon={RiHandCoinLine}
                  label="Retiro"
                  activo={movTipo === "RETIRO"}
                  onClick={() =>
                    setMovTipo((t) => (t === "RETIRO" ? null : "RETIRO"))
                  }
                />
              </div>
              {movTipo ? (
                <div className="mt-3">
                  <FormMovimiento
                    sesionId={sesion.id}
                    tipo={movTipo}
                    onListo={() => {
                      setMovTipo(null)
                      invalidar()
                    }}
                    onCancelar={() => setMovTipo(null)}
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {can("caja.cerrar") ? (
            <div className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm">
              <h3 className="text-sm font-semibold">Cierre de turno</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Cuenta el efectivo del cajón y concílialo contra los{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {sol(esperado)}
                </span>{" "}
                esperados.
              </p>
              <Button
                type="button"
                className="mt-4 w-full"
                onClick={() => setCerrando(true)}
              >
                <RiLockLine />
                Cerrar y arquear
              </Button>
            </div>
          ) : null}
        </aside>
      </div>

      <CerrarCajaSheet
        open={cerrando}
        onOpenChange={setCerrando}
        sesionId={sesion.id}
        esperado={esperado}
        sucursalId={sucursalId}
      />
    </div>
  )
}

function AccionMov({
  icon: Icon,
  label,
  activo,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  activo: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all active:scale-[0.97] ${
        activo
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:-translate-y-0.5 hover:border-primary/40 hover:text-foreground hover:shadow-sm"
      }`}
    >
      <Icon className="size-5" />
      {label}
    </button>
  )
}

function FilaMovimiento({ mv }: { mv: MovimientoCaja }) {
  const positivo = mv.signo >= 0
  return (
    <TableRow>
      <TableCell className="pl-5">
        <div className="flex items-center gap-2.5">
          <span
            className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${
              positivo
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {positivo ? (
              <RiArrowDownLine className="size-3.5" />
            ) : (
              <RiArrowUpLine className="size-3.5" />
            )}
          </span>
          <div className="min-w-0">
            <span className="block text-sm font-medium">
              {MOV_LABEL[mv.tipo] ?? mv.tipo}
            </span>
            {mv.motivo ? (
              <span className="block truncate text-xs text-muted-foreground">
                {mv.motivo}
              </span>
            ) : null}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
        {fecha(mv.occurredAt)}
      </TableCell>
      <TableCell
        className={`pr-5 text-right font-semibold tabular-nums ${
          positivo
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-destructive"
        }`}
      >
        {positivo ? "+" : "−"} {sol(mv.monto)}
      </TableCell>
    </TableRow>
  )
}

function FormMovimiento({
  sesionId,
  tipo,
  onListo,
  onCancelar,
}: {
  sesionId: string
  tipo: TipoMovimientoManual
  onListo: () => void
  onCancelar: () => void
}) {
  const [monto, setMonto] = React.useState("")
  const [motivo, setMotivo] = React.useState("")

  const m = useMutation({
    mutationFn: () =>
      registrarMovimiento({
        sesionCajaId: sesionId,
        tipo,
        monto: Number(monto),
        motivo: motivo.trim() || undefined,
      }),
    onSuccess: onListo,
  })
  const err = errMsg(m.error)
  const valido = monto !== "" && Number(monto) > 0

  const titulo =
    tipo === "INGRESO_EFECTIVO"
      ? "Ingreso de efectivo"
      : tipo === "EGRESO_EFECTIVO"
        ? "Egreso de efectivo"
        : "Retiro de efectivo"

  return (
    <div className="mb-3 flex flex-col gap-3 rounded-xl border bg-muted/30 p-3">
      <p className="text-xs font-medium text-muted-foreground">{titulo}</p>
      <div className="flex flex-wrap gap-2">
        <Input
          inputMode="decimal"
          value={monto}
          onChange={(e) => setMonto(e.target.value.replace(/[^0-9.]/g, ""))}
          placeholder="Monto (S/)"
          className="h-9 w-32 bg-background tabular-nums"
        />
        <Input
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Motivo (opcional)"
          className="h-9 flex-1 bg-background"
        />
        <Button
          type="button"
          size="sm"
          disabled={!valido || m.isPending}
          onClick={() => m.mutate()}
        >
          <RiCheckLine />
          {m.isPending ? "…" : "Registrar"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancelar}>
          Cancelar
        </Button>
      </div>
      {err ? <ErrorLinea msg={err} /> : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Cerrar caja (Sheet)                                                */
/* ------------------------------------------------------------------ */

const DENOMINACIONES = [200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1]

function CerrarCajaSheet({
  open,
  onOpenChange,
  sesionId,
  esperado,
  sucursalId,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  sesionId: string
  esperado: string
  sucursalId: string
}) {
  const qc = useQueryClient()
  const { setSesionCaja } = useSucursalActiva()
  const [modo, setModo] = React.useState<"total" | "denominaciones">("total")
  const [declaradoManual, setDeclaradoManual] = React.useState("")
  const [cantidades, setCantidades] = React.useState<Record<number, string>>({})
  const [motivo, setMotivo] = React.useState("")

  const totalDenoms = DENOMINACIONES.reduce(
    (acc, d) => acc + d * (Number(cantidades[d]) || 0),
    0
  )
  const porDenoms = modo === "denominaciones"
  const declarado = porDenoms ? totalDenoms : Number(declaradoManual || 0)
  const declaradoTocado = porDenoms
    ? Object.values(cantidades).some((v) => v !== "" && v !== undefined)
    : declaradoManual !== ""

  const conteos = DENOMINACIONES.filter(
    (d) => (Number(cantidades[d]) || 0) > 0
  ).map((d) => ({ denominacion: d, cantidad: Number(cantidades[d]) }))

  const m = useMutation({
    mutationFn: () =>
      cerrarCaja({
        sesionCajaId: sesionId,
        montoDeclarado: declarado,
        motivo: motivo.trim() || undefined,
        conteos: porDenoms && conteos.length ? conteos : undefined,
      }),
    onSuccess: () => {
      toast.success("Caja cerrada", { description: "Arqueo registrado." })
      setSesionCaja(null)
      qc.invalidateQueries({ queryKey: ["sesion-abierta", sucursalId] })
      qc.invalidateQueries({ queryKey: ["sesiones", sucursalId] })
    },
    onError: (e) =>
      toast.error("No se pudo cerrar la caja", {
        description: errMsg(e) ?? undefined,
      }),
  })
  const err = errMsg(m.error)

  const diferencia = declarado - Number(esperado)
  const cerrada = m.data

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 p-0 sm:!max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>Cerrar y arquear</SheetTitle>
          <SheetDescription>
            Cuenta el efectivo del cajón y decláralo.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-auto p-6">
          {cerrada ? (
            <ResultadoCierre
              data={cerrada}
              onClose={() => onOpenChange(false)}
            />
          ) : (
            <>
              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground">
                  Efectivo esperado (sistema)
                </p>
                <p className="text-xl font-semibold tabular-nums">
                  {sol(esperado)}
                </p>
              </div>

              {/* Modo de conteo */}
              <div className="flex gap-1 rounded-xl bg-muted p-1">
                <button
                  type="button"
                  onClick={() => setModo("total")}
                  className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    modo === "total"
                      ? "bg-background shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  Total
                </button>
                <button
                  type="button"
                  onClick={() => setModo("denominaciones")}
                  className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    modo === "denominaciones"
                      ? "bg-background shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  Por billetes y monedas
                </button>
              </div>

              {modo === "total" ? (
                <div className="grid gap-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Efectivo contado (S/)
                  </Label>
                  <Input
                    inputMode="decimal"
                    value={declaradoManual}
                    onChange={(e) =>
                      setDeclaradoManual(e.target.value.replace(/[^0-9.]/g, ""))
                    }
                    placeholder="0.00"
                    className="h-11 text-lg tabular-nums"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="rounded-xl border">
                  {DENOMINACIONES.map((d) => {
                    const cant = Number(cantidades[d]) || 0
                    return (
                      <div
                        key={d}
                        className="flex items-center gap-3 border-b px-3 py-2 last:border-0"
                      >
                        <span className="w-16 text-sm font-medium tabular-nums">
                          {d >= 1 ? `S/ ${d}` : `${d * 100}¢`}
                        </span>
                        <span className="text-muted-foreground">×</span>
                        <Input
                          inputMode="numeric"
                          value={cantidades[d] ?? ""}
                          onChange={(e) =>
                            setCantidades((prev) => ({
                              ...prev,
                              [d]: e.target.value.replace(/[^0-9]/g, ""),
                            }))
                          }
                          placeholder="0"
                          className="h-8 w-20 bg-background tabular-nums"
                        />
                        <span className="ml-auto text-sm tabular-nums text-muted-foreground">
                          {sol(d * cant)}
                        </span>
                      </div>
                    )
                  })}
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <span className="text-sm font-medium">Total contado</span>
                    <span className="text-base font-semibold tabular-nums">
                      {sol(totalDenoms)}
                    </span>
                  </div>
                </div>
              )}

              {declaradoTocado ? (
                <div
                  className={`rounded-xl border p-4 ${
                    Math.abs(diferencia) < 0.005
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-amber-500/30 bg-amber-500/5"
                  }`}
                >
                  <p className="text-xs text-muted-foreground">Diferencia</p>
                  <p className="text-xl font-bold tabular-nums">
                    {diferencia > 0 ? "+" : ""}
                    {sol(diferencia)}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      {Math.abs(diferencia) < 0.005
                        ? "cuadra"
                        : diferencia > 0
                          ? "sobrante"
                          : "faltante"}
                    </span>
                  </p>
                </div>
              ) : null}

              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">
                  Motivo / observación (opcional)
                </Label>
                <Input
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej: faltante justificado"
                  className="h-10"
                />
              </div>

              {err ? <ErrorLinea msg={err} /> : null}
            </>
          )}
        </div>

        {!cerrada ? (
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
              variant="destructive"
              disabled={!declaradoTocado || m.isPending}
              onClick={() => m.mutate()}
            >
              <RiLockLine />
              {m.isPending ? "Cerrando…" : "Confirmar cierre"}
            </Button>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function ResultadoCierre({
  data,
  onClose,
}: {
  data: {
    efectivoEsperado: string
    montoDeclarado: string
    diferencia: string
  }
  onClose: () => void
}) {
  const dif = Number(data.diferencia)
  const cuadra = Math.abs(dif) < 0.005
  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <span
        className={`flex size-14 items-center justify-center rounded-2xl ${
          cuadra
            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
        }`}
      >
        <RiCheckLine className="size-7" />
      </span>
      <div>
        <p className="text-base font-semibold">Caja cerrada</p>
        <p className="text-sm text-muted-foreground">
          {cuadra
            ? "El arqueo cuadra perfecto."
            : dif > 0
              ? "Cerró con sobrante."
              : "Cerró con faltante."}
        </p>
      </div>
      <div className="w-full rounded-xl border">
        <Linea label="Esperado" valor={sol(data.efectivoEsperado)} />
        <Linea label="Contado" valor={sol(data.montoDeclarado)} />
        <Linea
          label="Diferencia"
          valor={`${dif > 0 ? "+" : ""}${sol(dif)}`}
          fuerte
        />
      </div>
      <Button type="button" className="w-full" onClick={onClose}>
        Listo
      </Button>
    </div>
  )
}

function Linea({
  label,
  valor,
  fuerte,
}: {
  label: string
  valor: string
  fuerte?: boolean
}) {
  return (
    <div className="flex items-center justify-between border-b px-4 py-2.5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`tabular-nums ${fuerte ? "font-bold" : "font-medium"}`}>
        {valor}
      </span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Historial de turnos                                                */
/* ------------------------------------------------------------------ */

function HistorialTurnos({ sucursalId }: { sucursalId: string }) {
  const q = useQuery({
    queryKey: ["sesiones", sucursalId],
    queryFn: () => listarSesiones(sucursalId, 30),
  })
  const sesiones = q.data ?? []

  if (q.isLoading) {
    return <Skeleton className="h-40 w-full rounded-xl" />
  }
  if (sesiones.length === 0) return null

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-5 py-3.5">
        <h3 className="text-sm font-semibold">Historial de caja</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground tabular-nums">
          {sesiones.length}
        </span>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">Caja</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Apertura</TableHead>
              <TableHead>Cierre</TableHead>
              <TableHead className="text-right">Esperado</TableHead>
              <TableHead className="text-right">Contado</TableHead>
              <TableHead className="pr-5 text-right">Diferencia</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sesiones.map((s) => (
              <FilaTurno key={s.id} s={s} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function FilaTurno({ s }: { s: SesionCajaResumen }) {
  const dif = s.diferencia != null ? Number(s.diferencia) : null
  const cuadra = dif != null && Math.abs(dif) < 0.005
  const abierta = s.estado === "ABIERTA"
  return (
    <TableRow>
      <TableCell className="pl-5">
        <div className="text-sm font-medium">{s.caja.nombre}</div>
        <div className="font-mono text-xs text-muted-foreground">
          {s.caja.codigo}
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant="secondary"
          className={
            abierta
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : "bg-muted text-muted-foreground"
          }
        >
          {abierta ? "Abierta" : "Cerrada"}
        </Badge>
      </TableCell>
      <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
        <div>{fecha(s.abiertoEn)}</div>
        <div>
          {s.abiertoPor ?? "—"} · {sol(s.montoApertura)}
        </div>
      </TableCell>
      <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
        {s.cerradoEn ? (
          <>
            <div>{fecha(s.cerradoEn)}</div>
            <div>{s.cerradoPor ?? "—"}</div>
          </>
        ) : (
          "En curso"
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {s.efectivoEsperado != null ? sol(s.efectivoEsperado) : "—"}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {s.montoDeclarado != null ? sol(s.montoDeclarado) : "—"}
      </TableCell>
      <TableCell className="pr-5 text-right">
        {dif == null ? (
          "—"
        ) : (
          <Badge
            variant="secondary"
            className={
              cuadra
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
            }
          >
            {dif > 0 ? "+" : ""}
            {sol(dif)}
          </Badge>
        )}
      </TableCell>
    </TableRow>
  )
}

/* ------------------------------------------------------------------ */
/* Auxiliares                                                         */
/* ------------------------------------------------------------------ */

function Aviso({
  icon: Icon,
  titulo,
  texto,
}: {
  icon: React.ComponentType<{ className?: string }>
  titulo: string
  texto: string
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card px-6 py-14 text-center">
      <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-sm font-medium">{titulo}</p>
        <p className="mt-1 text-sm text-muted-foreground">{texto}</p>
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
