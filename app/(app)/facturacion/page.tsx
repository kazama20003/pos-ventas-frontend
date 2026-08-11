"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  RiAddLine,
  RiArchiveLine,
  RiCheckLine,
  RiErrorWarningLine,
  RiFileList3Line,
  RiInboxUnarchiveLine,
  RiInformationLine,
} from "@remixicon/react"

import { PageHeader } from "@/components/layout/page-header"
import { ContextualTour } from "@/components/onboarding/contextual-tour"
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
import { listarEmpresas } from "@/lib/api/organizacion"
import {
  activarSerie,
  archivarSerie,
  crearSerie,
  listarSeries,
  DOC_LABEL,
  type Serie,
  type TipoDocumento,
} from "@/lib/api/series"
import { usePermisos } from "@/hooks/use-permisos"

const TIPOS: { value: TipoDocumento; label: string; prefijo: string }[] = [
  { value: "BOLETA", label: "Boleta", prefijo: "B" },
  { value: "FACTURA", label: "Factura", prefijo: "F" },
  { value: "NOTA_CREDITO", label: "Nota de crédito", prefijo: "BC" },
  { value: "NOTA_DEBITO", label: "Nota de débito", prefijo: "BD" },
]

function errMsg(e: unknown) {
  return (e as ApiError | Error | null)?.message ?? null
}

export default function FacturacionPage() {
  const { can } = usePermisos()
  const puedeEmitir = can("facturacion.emitir")

  const empresas = useQuery({ queryKey: ["empresas"], queryFn: listarEmpresas })
  const [empresaSel, setEmpresaSel] = React.useState("")
  const [creando, setCreando] = React.useState(false)
  const [nonce, setNonce] = React.useState(0)

  const lista = empresas.data ?? []
  const empresaId = empresaSel || lista[0]?.id || ""

  const series = useQuery({
    queryKey: ["series", empresaId],
    queryFn: () => listarSeries(empresaId),
    enabled: !!empresaId,
  })
  const data = series.data ?? []

  const abrirCrear = () => {
    setNonce((n) => n + 1)
    setCreando(true)
  }

  return (
    <>
      <ContextualTour
        flowKey="primera-venta"
        stepKey="comprobante"
        selector="#panel-comprobantes"
        titulo="Emite tu primer comprobante electrónico"
        descripcion="Crea una serie activa (ej. Boleta B001) y cobra una venta: se enviará a SUNAT."
      />
      <PageHeader
        title="Series de comprobante"
        description="Numeración SUNAT para boletas, facturas y notas."
        actions={
          puedeEmitir && empresaId ? (
            <Button type="button" size="sm" onClick={abrirCrear}>
              <RiAddLine />
              Nueva serie
            </Button>
          ) : null
        }
      />

      <div className="flex-1 overflow-auto">
        <div className="mx-auto flex max-w-4xl flex-col gap-5 p-5 md:p-6">
          <div className="flex items-start gap-2.5 rounded-xl border bg-muted/30 p-3.5 text-sm">
            <RiInformationLine className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p className="text-muted-foreground">
              Cada serie numera un tipo de comprobante (ej. boleta{" "}
              <span className="font-mono text-foreground">B001</span>). El punto
              de venta elige una al cobrar y el correlativo avanza solo. Necesitas
              al menos una <span className="font-medium text-foreground">Boleta</span>{" "}
              activa para vender.
            </p>
          </div>

          {/* Selector de empresa */}
          {lista.length > 1 ? (
            <div className="grid max-w-xs gap-1.5">
              <Label className="text-xs text-muted-foreground">Empresa</Label>
              <Select
                value={empresaId}
                onChange={setEmpresaSel}
                options={lista.map((e) => ({
                  value: e.id,
                  label: e.razonSocial,
                  hint: e.ruc,
                }))}
              />
            </div>
          ) : null}

          {/* Tabla */}
          <div id="panel-comprobantes" className="rounded-xl border bg-card">
            {empresas.isLoading || series.isLoading ? (
              <div className="flex flex-col gap-2 p-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : !empresaId ? (
              <Vacio texto="No hay empresas. Crea una en Organización → Empresas." />
            ) : data.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <RiFileList3Line className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-medium">Sin series todavía</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Crea la primera (ej. Boleta B001) para poder vender.
                  </p>
                </div>
                {puedeEmitir ? (
                  <Button type="button" size="sm" onClick={abrirCrear}>
                    <RiAddLine />
                    Nueva serie
                  </Button>
                ) : null}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-5">Comprobante</TableHead>
                    <TableHead>Serie</TableHead>
                    <TableHead className="text-right">Próximo N°</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-0" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((s) => (
                    <FilaSerie key={s.id} s={s} puedeEmitir={puedeEmitir} />
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>

      <CrearSerieSheet
        key={nonce}
        open={creando}
        onOpenChange={setCreando}
        empresaId={empresaId}
        existentes={data}
      />
    </>
  )
}

function FilaSerie({
  s,
  puedeEmitir,
}: {
  s: Serie
  puedeEmitir: boolean
}) {
  const qc = useQueryClient()
  const activo = s.estado === "ACTIVO"
  const m = useMutation({
    mutationFn: () => (activo ? archivarSerie(s.id) : activarSerie(s.id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["series", s.empresaId] }),
  })

  return (
    <TableRow>
      <TableCell className="pl-5">
        <span className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <RiFileList3Line className="size-4" />
          </span>
          <span className="text-sm font-medium">
            {DOC_LABEL[s.documentType] ?? s.documentType}
          </span>
        </span>
      </TableCell>
      <TableCell className="font-mono text-sm font-medium">{s.series}</TableCell>
      <TableCell className="text-right tabular-nums text-muted-foreground">
        {s.nextNumber}
      </TableCell>
      <TableCell>
        <Badge
          variant={activo ? "outline" : "secondary"}
          className={
            activo
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : undefined
          }
        >
          {activo ? "Activa" : "Archivada"}
        </Badge>
      </TableCell>
      <TableCell className="pr-5 text-right">
        {puedeEmitir ? (
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            disabled={m.isPending}
            title={activo ? "Archivar" : "Activar"}
            onClick={() => m.mutate()}
          >
            {activo ? <RiArchiveLine /> : <RiInboxUnarchiveLine />}
          </Button>
        ) : null}
      </TableCell>
    </TableRow>
  )
}

function CrearSerieSheet({
  open,
  onOpenChange,
  empresaId,
  existentes,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  empresaId: string
  existentes: Serie[]
}) {
  const qc = useQueryClient()
  const [tipo, setTipo] = React.useState<TipoDocumento>("BOLETA")
  const [serie, setSerie] = React.useState("B001")
  const [numero, setNumero] = React.useState("")

  const sugerirSerie = (t: TipoDocumento) => {
    const pref = TIPOS.find((x) => x.value === t)?.prefijo ?? "B"
    const n = existentes.filter((s) => s.documentType === t).length + 1
    return `${pref}${String(n).padStart(3, "0")}`
  }

  const m = useMutation({
    mutationFn: () =>
      crearSerie({
        empresaId,
        documentType: tipo,
        series: serie.trim().toUpperCase(),
        nextNumber: numero ? Number(numero) : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["series", empresaId] })
      onOpenChange(false)
    },
  })
  const err = errMsg(m.error)
  const valido = /^[A-Z][A-Z0-9]{1,7}$/.test(serie.trim().toUpperCase())

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:!max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>Nueva serie</SheetTitle>
          <SheetDescription>
            Define la numeración de un tipo de comprobante.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-auto p-6">
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">
              Tipo de comprobante
            </Label>
            <Select
              value={tipo}
              onChange={(v) => {
                const t = v as TipoDocumento
                setTipo(t)
                setSerie(sugerirSerie(t))
              }}
              options={TIPOS.map((t) => ({ value: t.value, label: t.label }))}
            />
          </div>

          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Serie</Label>
            <Input
              value={serie}
              onChange={(e) =>
                setSerie(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
              }
              placeholder="B001"
              className="h-11 font-mono text-lg"
              maxLength={8}
            />
            <p className="text-xs text-muted-foreground">
              Mayúsculas y números; empieza con letra (B001, F001).
            </p>
          </div>

          <div className="grid max-w-[180px] gap-1.5">
            <Label className="text-xs text-muted-foreground">
              Primer número (opcional)
            </Label>
            <Input
              inputMode="numeric"
              value={numero}
              onChange={(e) => setNumero(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="1"
              className="h-10 tabular-nums"
            />
          </div>

          {err ? (
            <p className="flex items-center gap-1.5 text-xs text-destructive">
              <RiErrorWarningLine className="size-4 shrink-0" />
              {err}
            </p>
          ) : null}
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
            {m.isPending ? "Creando…" : "Crear serie"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Vacio({ texto }: { texto: string }) {
  return (
    <p className="px-6 py-14 text-center text-sm text-muted-foreground">
      {texto}
    </p>
  )
}
