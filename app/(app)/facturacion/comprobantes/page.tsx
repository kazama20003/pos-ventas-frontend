"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  RiFileList3Line,
  RiRefreshLine,
  RiSearchLine,
} from "@remixicon/react"

import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
  DOC_LABEL,
  ESTADO_LABEL,
  listarComprobantes,
  obtenerComprobante,
  reintentarComprobante,
  type ComprobanteResumen,
  type EstadoComprobante,
} from "@/lib/api/fiscal"
import { usePermisos } from "@/hooks/use-permisos"

const money = (v: string | number, moneda = "PEN") =>
  `${moneda === "PEN" ? "S/" : moneda} ${Number(v).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })

function estadoBadge(estado: EstadoComprobante) {
  const map: Record<EstadoComprobante, string> = {
    ACEPTADO: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    RECHAZADO: "border-destructive/30 bg-destructive/10 text-destructive",
    ERROR: "border-destructive/30 bg-destructive/10 text-destructive",
    OBSERVADO: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    ANULADO: "border-muted bg-muted text-muted-foreground",
    EN_COLA: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
    ENVIANDO: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
    BORRADOR: "border-muted bg-muted text-muted-foreground",
  }
  return map[estado]
}

const REINTENTABLES: EstadoComprobante[] = ["RECHAZADO", "ERROR", "OBSERVADO"]

export default function ComprobantesPage() {
  const [q, setQ] = React.useState("")
  const [detalleId, setDetalleId] = React.useState<string | null>(null)

  const comprobantes = useQuery({
    queryKey: ["comprobantes"],
    queryFn: () => listarComprobantes(),
    refetchInterval: 8000, // los estados cambian async (worker → SUNAT)
  })
  const data = comprobantes.data ?? []
  const filtrados = q.trim()
    ? data.filter((c) => {
        const t = q.trim().toLowerCase()
        return (
          `${c.series}-${c.number}`.toLowerCase().includes(t) ||
          (c.customerName ?? "").toLowerCase().includes(t)
        )
      })
    : data

  return (
    <>
      <PageHeader
        title="Comprobantes"
        description="Boletas y facturas electrónicas emitidas y su estado en SUNAT."
      />

      <div className="flex-1 overflow-auto">
        <div className="mx-auto flex max-w-4xl flex-col gap-5 p-5 md:p-6">
          <div className="rounded-xl border bg-card">
            <div className="flex items-center justify-between gap-3 border-b p-3">
              <div className="relative w-full max-w-xs">
                <RiSearchLine className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar por número o cliente…"
                  className="h-9 pl-9"
                />
              </div>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {comprobantes.isLoading ? "…" : `${filtrados.length}`}
              </span>
            </div>

            {comprobantes.isLoading ? (
              <div className="flex flex-col gap-2 p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : filtrados.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <RiFileList3Line className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-medium">
                    {q ? "Sin coincidencias" : "Sin comprobantes"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {q
                      ? "Prueba con otro término."
                      : "Emite una boleta o factura desde una venta para verla aquí."}
                  </p>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-5">Comprobante</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtrados.map((c) => (
                    <FilaComprobante
                      key={c.id}
                      c={c}
                      onClick={() => setDetalleId(c.id)}
                    />
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>

      <Sheet
        open={Boolean(detalleId)}
        onOpenChange={(o) => !o && setDetalleId(null)}
      >
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:!max-w-lg">
          {detalleId ? <DetalleComprobante id={detalleId} /> : null}
        </SheetContent>
      </Sheet>
    </>
  )
}

function FilaComprobante({
  c,
  onClick,
}: {
  c: ComprobanteResumen
  onClick: () => void
}) {
  return (
    <TableRow className="cursor-pointer" onClick={onClick}>
      <TableCell className="pl-5">
        <div className="text-sm font-medium tabular-nums">
          {c.series}-{String(c.number).padStart(8, "0")}
        </div>
        <div className="text-xs text-muted-foreground">
          {DOC_LABEL[c.documentType]}
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {c.customerName || "—"}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {fecha(c.issueDate)}
      </TableCell>
      <TableCell className="text-right text-sm font-medium tabular-nums">
        {money(c.total, c.moneda)}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={estadoBadge(c.estado)}>
          {ESTADO_LABEL[c.estado]}
        </Badge>
      </TableCell>
    </TableRow>
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
    <div className="flex items-center justify-between text-sm">
      <span className={fuerte ? "font-medium" : "text-muted-foreground"}>
        {label}
      </span>
      <span className={`tabular-nums ${fuerte ? "font-semibold" : ""}`}>
        {valor}
      </span>
    </div>
  )
}

function DetalleComprobante({ id }: { id: string }) {
  const { can } = usePermisos()
  const puedeEmitir = can("facturacion.emitir")
  const qc = useQueryClient()

  const doc = useQuery({
    queryKey: ["comprobante", id],
    queryFn: () => obtenerComprobante(id),
  })

  const reintentar = useMutation({
    mutationFn: () => reintentarComprobante(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comprobante", id] })
      qc.invalidateQueries({ queryKey: ["comprobantes"] })
    },
  })

  if (doc.isLoading || !doc.data) {
    return (
      <>
        <SheetHeader className="border-b">
          <SheetTitle>Comprobante</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-3 p-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </>
    )
  }

  const d = doc.data
  const m = d.moneda
  const conIcbper = Number(d.otrosTributos) > 0

  return (
    <>
      <SheetHeader className="gap-2 border-b pr-14">
        <SheetTitle className="tabular-nums">
          {d.series}-{String(d.number).padStart(8, "0")}
        </SheetTitle>
        <SheetDescription>
          {DOC_LABEL[d.documentType]} · {d.customerName || "Cliente varios"}
        </SheetDescription>
        <Badge variant="outline" className={`w-fit ${estadoBadge(d.estado)}`}>
          {ESTADO_LABEL[d.estado]}
        </Badge>
      </SheetHeader>

      <div className="flex flex-1 flex-col gap-5 overflow-auto p-6">
        {/* Items */}
        <div className="rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                <th className="p-2.5">Descripción</th>
                <th className="p-2.5 text-right">Cant.</th>
                <th className="p-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {d.articulos.map((a) => (
                <tr key={a.id} className="border-b last:border-0 align-top">
                  <td className="p-2.5">
                    {a.descripcion}
                    {Number(a.montoOtrosTributos) > 0 ? (
                      <span className="ml-1 text-xs text-amber-600 dark:text-amber-400">
                        (ICBPER {money(a.montoOtrosTributos, m)})
                      </span>
                    ) : null}
                  </td>
                  <td className="p-2.5 text-right tabular-nums">
                    {Number(a.cantidad)}
                  </td>
                  <td className="p-2.5 text-right tabular-nums">
                    {money(a.total, m)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <div className="flex flex-col gap-1.5 rounded-xl border bg-muted/30 p-4">
          <Linea label="Op. gravada" valor={money(d.taxableTotal, m)} />
          {Number(d.exemptTotal) > 0 ? (
            <Linea label="Op. exonerada" valor={money(d.exemptTotal, m)} />
          ) : null}
          {Number(d.unaffectedTotal) > 0 ? (
            <Linea label="Op. inafecta" valor={money(d.unaffectedTotal, m)} />
          ) : null}
          <Linea label="IGV (18%)" valor={money(d.totalImpuesto, m)} />
          {conIcbper ? (
            <Linea label="ICBPER (bolsas)" valor={money(d.otrosTributos, m)} />
          ) : null}
          <div className="my-1 border-t" />
          <Linea label="Total" valor={money(d.total, m)} fuerte />
        </div>

        {/* Respuesta SUNAT */}
        {d.sunatDescription || d.sunatTicket ? (
          <div className="rounded-xl border p-4 text-sm">
            <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
              Respuesta SUNAT
            </p>
            {d.sunatDescription ? <p>{d.sunatDescription}</p> : null}
            {d.sunatTicket ? (
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                Ticket: {d.sunatTicket}
              </p>
            ) : null}
          </div>
        ) : null}

        {/* Reintentar si falló */}
        {puedeEmitir && REINTENTABLES.includes(d.estado) ? (
          <Button
            type="button"
            variant="outline"
            disabled={reintentar.isPending}
            onClick={() => reintentar.mutate()}
          >
            <RiRefreshLine />
            {reintentar.isPending ? "Reintentando…" : "Reintentar envío"}
          </Button>
        ) : null}
      </div>
    </>
  )
}
