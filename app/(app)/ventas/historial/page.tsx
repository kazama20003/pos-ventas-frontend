"use client"

import * as React from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiFileList3Line,
  RiSearchLine,
  RiStore2Line,
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
import {
  listarVentas,
  type EstadoVenta,
  type VentaListada,
} from "@/lib/api/ventas"
import { useSucursalActiva } from "@/hooks/use-sucursal-activa"

const sol = (v: string | number) =>
  `S/ ${Number(v).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const fecha = (iso: string) =>
  new Date(iso).toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

const ESTADOS: { value: string; label: string }[] = [
  { value: "", label: "Todos los estados" },
  { value: "PAGADA", label: "Pagada" },
  { value: "COMPLETADA", label: "Completada" },
  { value: "PENDIENTE_PAGO", label: "Pendiente de pago" },
  { value: "PAGADA_PARCIALMENTE", label: "Pagada parcial" },
  { value: "DEVUELTA_PARCIALMENTE", label: "Devuelta parcial" },
  { value: "DEVUELTA", label: "Devuelta" },
  { value: "ANULADA", label: "Anulada" },
  { value: "VENCIDA", label: "Vencida" },
  { value: "BORRADOR", label: "Borrador" },
]

const ESTADO_LABEL: Record<EstadoVenta, string> = {
  BORRADOR: "Borrador",
  PENDIENTE_PAGO: "Pendiente",
  PAGADA_PARCIALMENTE: "Pago parcial",
  PAGADA: "Pagada",
  COMPLETADA: "Completada",
  ANULADA: "Anulada",
  DEVUELTA_PARCIALMENTE: "Devuelta parcial",
  DEVUELTA: "Devuelta",
  VENCIDA: "Vencida",
}

function EstadoBadge({ estado }: { estado: EstadoVenta }) {
  const verde = estado === "PAGADA" || estado === "COMPLETADA"
  const ambar =
    estado === "PENDIENTE_PAGO" ||
    estado === "PAGADA_PARCIALMENTE" ||
    estado === "VENCIDA"
  const rojo =
    estado === "ANULADA" ||
    estado === "DEVUELTA" ||
    estado === "DEVUELTA_PARCIALMENTE"
  const cls = verde
    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
    : ambar
      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
      : rojo
        ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
        : "bg-muted text-muted-foreground"
  return <Badge className={cls}>{ESTADO_LABEL[estado]}</Badge>
}

/** Debounce simple para no disparar una búsqueda por cada tecla. */
function useDebounce<T>(valor: T, ms = 350): T {
  const [v, setV] = React.useState(valor)
  React.useEffect(() => {
    const t = setTimeout(() => setV(valor), ms)
    return () => clearTimeout(t)
  }, [valor, ms])
  return v
}

export default function HistorialVentasPage() {
  const { sucursalId, sucursal } = useSucursalActiva()

  const [q, setQ] = React.useState("")
  const [estado, setEstado] = React.useState("")
  const [desde, setDesde] = React.useState("")
  const [hasta, setHasta] = React.useState("")
  const [page, setPage] = React.useState(1)

  const qDebounced = useDebounce(q)

  // Al cambiar cualquier filtro se vuelve a la primera página.
  React.useEffect(() => {
    setPage(1)
  }, [qDebounced, estado, desde, hasta, sucursalId])

  const ventas = useQuery({
    queryKey: [
      "ventas-historial",
      sucursalId,
      qDebounced,
      estado,
      desde,
      hasta,
      page,
    ],
    queryFn: () =>
      listarVentas({
        sucursalId: sucursalId!,
        q: qDebounced || undefined,
        estado: (estado || undefined) as EstadoVenta | undefined,
        desde: desde || undefined,
        hasta: hasta || undefined,
        page,
        pageSize: 20,
      }),
    enabled: !!sucursalId,
    placeholderData: keepPreviousData,
  })

  const data = ventas.data
  const filas: VentaListada[] = data?.items ?? []

  return (
    <>
      <PageHeader
        title="Ventas realizadas"
        description={
          sucursal
            ? `Historial · ${sucursal.nombre}`
            : "Historial de ventas"
        }
      />

      {!sucursalId ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-16 text-center">
          <RiStore2Line className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Elige una sucursal activa para ver sus ventas.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Filtros */}
          <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-muted/30 p-3">
            <div className="grid min-w-[220px] flex-1 gap-1.5">
              <Label className="text-xs text-muted-foreground">Buscar</Label>
              <div className="relative">
                <RiSearchLine className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="N.º de comprobante o cliente"
                  className="h-9 bg-background pl-8"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Estado</Label>
              <Select
                value={estado}
                onChange={setEstado}
                options={ESTADOS}
                className="w-48"
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Desde</Label>
              <Input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="h-9 w-40 bg-background"
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Hasta</Label>
              <Input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="h-9 w-40 bg-background"
              />
            </div>
            {(q || estado || desde || hasta) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQ("")
                  setEstado("")
                  setDesde("")
                  setHasta("")
                }}
              >
                Limpiar
              </Button>
            )}
          </div>

          {/* Tabla */}
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Comprobante</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Cajero</TableHead>
                  <TableHead className="text-center">Ítems</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ventas.isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div className="flex flex-col items-center gap-2 py-14 text-center">
                        <RiFileList3Line className="size-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          No hay ventas con esos filtros.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filas.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-mono text-xs font-medium">
                        {v.number}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {fecha(v.creadoEn)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {v.cliente ? (
                          <div className="min-w-0">
                            <div className="truncate">
                              {v.cliente.razonSocial}
                            </div>
                            {v.cliente.documentNumber ? (
                              <div className="font-mono text-xs text-muted-foreground">
                                {v.cliente.documentNumber}
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            Sin cliente
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{v.cajero.nombre}</TableCell>
                      <TableCell className="text-center text-sm tabular-nums">
                        {v.items}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {sol(v.total)}
                      </TableCell>
                      <TableCell className="text-right">
                        <EstadoBadge estado={v.estado} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {data ? (
                <>
                  {data.total} venta{data.total === 1 ? "" : "s"} · página{" "}
                  {data.page} de {data.totalPages}
                </>
              ) : (
                "—"
              )}
            </span>
            <div className="flex gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1 || ventas.isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <RiArrowLeftSLine className="size-4" />
                Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!data || page >= data.totalPages || ventas.isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
                <RiArrowRightSLine className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
