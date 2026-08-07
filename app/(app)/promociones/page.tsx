"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  RiAddLine,
  RiPauseCircleLine,
  RiPlayCircleLine,
  RiPriceTag3Line,
  RiSearchLine,
} from "@remixicon/react"

import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
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
import { listarEmpresas } from "@/lib/api/organizacion"
import { listarProductos } from "@/lib/api/catalogo"
import {
  cambiarEstadoPromocion,
  crearPromocion,
  listarPromociones,
  type EstadoPromocion,
  type PromocionLista,
  type TipoBeneficio,
} from "@/lib/api/promociones"

const TIPOS: { value: TipoBeneficio; label: string }[] = [
  { value: "PORCENTAJE", label: "% de descuento" },
  { value: "MONTO_FIJO", label: "Monto fijo por unidad" },
  { value: "PRECIO_FIJO", label: "Precio de oferta" },
  { value: "LLEVA_N_PAGA_M", label: "Lleva N paga M" },
]

const tipoLabel = (t: TipoBeneficio) =>
  TIPOS.find((x) => x.value === t)?.label ?? t

function errMsg(e: unknown) {
  return (e as ApiError | Error | null)?.message ?? null
}

function EstadoBadge({ estado }: { estado: EstadoPromocion }) {
  const cls =
    estado === "ACTIVA"
      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
      : estado === "PROGRAMADA"
        ? "bg-sky-500/15 text-sky-600 dark:text-sky-400"
        : estado === "PAUSADA"
          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
          : "bg-muted text-muted-foreground"
  return <Badge className={cls}>{estado}</Badge>
}

function beneficioTexto(p: PromocionLista) {
  if (p.tipoBeneficio === "PORCENTAJE") return `${p.valor ?? 0}%`
  if (p.tipoBeneficio === "MONTO_FIJO") return `S/ ${p.valor ?? 0} c/u`
  if (p.tipoBeneficio === "PRECIO_FIJO") return `S/ ${p.valor ?? 0}`
  return "Lleva N paga M"
}

export default function PromocionesPage() {
  const qc = useQueryClient()
  const empresas = useQuery({
    queryKey: ["empresas"],
    queryFn: listarEmpresas,
  })
  const [empresaId, setEmpresaId] = React.useState("")
  React.useEffect(() => {
    if (!empresaId && empresas.data?.[0]) setEmpresaId(empresas.data[0].id)
  }, [empresas.data, empresaId])

  const [estado, setEstado] = React.useState("")
  const [mostrarForm, setMostrarForm] = React.useState(false)

  const promos = useQuery({
    queryKey: ["promociones", empresaId, estado],
    queryFn: () =>
      listarPromociones({
        empresaId,
        estado: (estado || undefined) as EstadoPromocion | undefined,
      }),
    enabled: !!empresaId,
  })

  const mEstado = useMutation({
    mutationFn: ({ id, e }: { id: string; e: EstadoPromocion }) =>
      cambiarEstadoPromocion(id, e),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["promociones", empresaId] }),
  })

  const filas = promos.data?.items ?? []

  return (
    <>
      <PageHeader
        title="Promociones"
        description="Campañas de oferta por vigencia. En caja se aplican solas y el cajero confirma."
      />

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-5">
        {/* Barra superior: empresa + filtros + nueva */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Empresa</Label>
              <Select
                value={empresaId}
                onChange={setEmpresaId}
                options={(empresas.data ?? []).map((e) => ({
                  value: e.id,
                  label: e.razonSocial,
                }))}
                className="w-full sm:w-64"
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Estado</Label>
              <Select
                value={estado}
                onChange={setEstado}
                options={[
                  { value: "", label: "Todos" },
                  { value: "ACTIVA", label: "Activa" },
                  { value: "PROGRAMADA", label: "Programada" },
                  { value: "PAUSADA", label: "Pausada" },
                  { value: "EXPIRADA", label: "Expirada" },
                ]}
                className="w-full sm:w-44"
              />
            </div>
          </div>
          <Button type="button" onClick={() => setMostrarForm((v) => !v)}>
            <RiAddLine />
            Nueva promoción
          </Button>
        </div>

        {mostrarForm && empresaId ? (
          <FormNuevaPromocion
            empresaId={empresaId}
            onCreada={() => {
              setMostrarForm(false)
              qc.invalidateQueries({ queryKey: ["promociones", empresaId] })
            }}
          />
        ) : null}

        {/* Tabla */}
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Beneficio</TableHead>
                <TableHead>Vigencia</TableHead>
                <TableHead className="text-center">Productos</TableHead>
                <TableHead className="text-center">Uso</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promos.isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <div className="flex flex-col items-center gap-2 py-12 text-center">
                      <RiPriceTag3Line className="size-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Sin promociones. Crea la primera.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filas.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">
                      {p.codigo}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {p.nombre}
                    </TableCell>
                    <TableCell className="text-sm">
                      {tipoLabel(p.tipoBeneficio)}
                      <span className="ml-1 text-muted-foreground">
                        · {beneficioTexto(p)}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(p.iniciaEn).toLocaleDateString("es-PE")}
                      {p.terminaEn
                        ? ` → ${new Date(p.terminaEn).toLocaleDateString("es-PE")}`
                        : " → sin fin"}
                    </TableCell>
                    <TableCell className="text-center text-sm tabular-nums">
                      {p._count.scopes}
                    </TableCell>
                    <TableCell className="text-center text-sm tabular-nums">
                      {p.usoActual}
                      {p.usoMaximo ? `/${p.usoMaximo}` : ""}
                    </TableCell>
                    <TableCell>
                      <EstadoBadge estado={p.estadoEfectivo} />
                    </TableCell>
                    <TableCell className="text-right">
                      {p.estado === "ACTIVA" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={mEstado.isPending}
                          onClick={() =>
                            mEstado.mutate({ id: p.id, e: "PAUSADA" })
                          }
                        >
                          <RiPauseCircleLine className="size-4" />
                          Pausar
                        </Button>
                      ) : p.estado === "EXPIRADA" ? null : (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={mEstado.isPending}
                          onClick={() =>
                            mEstado.mutate({ id: p.id, e: "ACTIVA" })
                          }
                        >
                          <RiPlayCircleLine className="size-4" />
                          Activar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Formulario de alta                                                 */
/* ------------------------------------------------------------------ */

function FormNuevaPromocion({
  empresaId,
  onCreada,
}: {
  empresaId: string
  onCreada: () => void
}) {
  const [codigo, setCodigo] = React.useState("")
  const [nombre, setNombre] = React.useState("")
  const [tipo, setTipo] = React.useState<TipoBeneficio>("PORCENTAJE")
  const [valor, setValor] = React.useState("")
  const [compraN, setCompraN] = React.useState("")
  const [pagaM, setPagaM] = React.useState("")
  const [iniciaEn, setIniciaEn] = React.useState("")
  const [terminaEn, setTerminaEn] = React.useState("")
  const [prioridad, setPrioridad] = React.useState("")
  const [cantidadMinima, setCantidadMinima] = React.useState("")
  const [buscar, setBuscar] = React.useState("")
  const [seleccion, setSeleccion] = React.useState<Record<string, string>>({})

  const productos = useQuery({
    queryKey: ["prod-promo", buscar],
    queryFn: () => listarProductos({ q: buscar || undefined, pageSize: 20 }),
  })

  const esLleva = tipo === "LLEVA_N_PAGA_M"

  const mCrear = useMutation({
    mutationFn: () =>
      crearPromocion({
        empresaId,
        codigo: codigo.trim(),
        nombre: nombre.trim(),
        tipoBeneficio: tipo,
        valor: esLleva ? undefined : Number(valor),
        compraCantidad: esLleva ? Number(compraN) : undefined,
        pagaCantidad: esLleva ? Number(pagaM) : undefined,
        iniciaEn: new Date(iniciaEn).toISOString(),
        terminaEn: terminaEn ? new Date(terminaEn).toISOString() : undefined,
        prioridad: prioridad ? Number(prioridad) : undefined,
        cantidadMinima: cantidadMinima ? Number(cantidadMinima) : undefined,
        productoIds: Object.keys(seleccion),
      }),
    onSuccess: onCreada,
  })

  const nProductos = Object.keys(seleccion).length
  const valido =
    codigo.trim() &&
    nombre.trim() &&
    iniciaEn &&
    nProductos > 0 &&
    (esLleva ? Number(compraN) > Number(pagaM) : valor !== "")

  return (
    <div className="grid gap-4 rounded-xl border bg-muted/20 p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Campo label="Código">
          <Input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="VERANO25"
          />
        </Campo>
        <Campo label="Nombre">
          <Input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Descuento de verano"
          />
        </Campo>
        <Campo label="Beneficio">
          <Select
            value={tipo}
            onChange={(v) => setTipo(v as TipoBeneficio)}
            options={TIPOS}
          />
        </Campo>

        {esLleva ? (
          <>
            <Campo label="Lleva (N)">
              <Input
                type="number"
                min={1}
                value={compraN}
                onChange={(e) => setCompraN(e.target.value)}
                placeholder="2"
              />
            </Campo>
            <Campo label="Paga (M)">
              <Input
                type="number"
                min={0}
                value={pagaM}
                onChange={(e) => setPagaM(e.target.value)}
                placeholder="1"
              />
            </Campo>
          </>
        ) : (
          <Campo
            label={
              tipo === "PORCENTAJE"
                ? "Porcentaje (%)"
                : tipo === "MONTO_FIJO"
                  ? "Monto por unidad (S/)"
                  : "Precio de oferta (S/)"
            }
          >
            <Input
              type="number"
              min={0}
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
          </Campo>
        )}

        <Campo label="Inicia">
          <Input
            type="datetime-local"
            value={iniciaEn}
            onChange={(e) => setIniciaEn(e.target.value)}
          />
        </Campo>
        <Campo label="Termina (opcional)">
          <Input
            type="datetime-local"
            value={terminaEn}
            onChange={(e) => setTerminaEn(e.target.value)}
          />
        </Campo>
        <Campo label="Prioridad">
          <Input
            type="number"
            value={prioridad}
            onChange={(e) => setPrioridad(e.target.value)}
            placeholder="0"
          />
        </Campo>
        <Campo label="Cantidad mínima (opcional)">
          <Input
            type="number"
            min={0}
            value={cantidadMinima}
            onChange={(e) => setCantidadMinima(e.target.value)}
          />
        </Campo>
      </div>

      {/* Selector de productos */}
      <div className="grid gap-2">
        <Label className="text-xs text-muted-foreground">
          Productos en oferta ({nProductos})
        </Label>
        <div className="relative">
          <RiSearchLine className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            placeholder="Buscar producto…"
            className="pl-8"
          />
        </div>
        <div className="max-h-56 overflow-y-auto rounded-lg border">
          {(productos.data?.items ?? []).map((p) => {
            const marcado = !!seleccion[p.id]
            return (
              <button
                type="button"
                key={p.id}
                onClick={() =>
                  setSeleccion((s) => {
                    const n = { ...s }
                    if (n[p.id]) delete n[p.id]
                    else n[p.id] = p.nombre
                    return n
                  })
                }
                className={`flex w-full items-center gap-2 border-b px-3 py-2 text-left text-sm last:border-0 hover:bg-muted/50 ${
                  marcado ? "bg-primary/5" : ""
                }`}
              >
                <span
                  className={`flex size-4 items-center justify-center rounded border ${
                    marcado
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/40"
                  }`}
                >
                  {marcado ? "✓" : ""}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {p.codigo}
                </span>
                <span className="truncate">{p.nombre}</span>
              </button>
            )
          })}
          {productos.data && productos.data.items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Sin resultados.
            </p>
          ) : null}
        </div>
      </div>

      {mCrear.error ? (
        <p className="text-sm text-rose-600">{errMsg(mCrear.error)}</p>
      ) : null}

      <div className="flex items-center gap-2">
        <Button
          type="button"
          disabled={!valido || mCrear.isPending}
          onClick={() => mCrear.mutate()}
        >
          {mCrear.isPending ? "Creando…" : "Crear promoción"}
        </Button>
        <span className="text-xs text-muted-foreground">
          Se crea como PROGRAMADA. Actívala para que aplique en caja.
        </span>
      </div>
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
