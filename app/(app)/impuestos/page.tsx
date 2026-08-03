"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  RiAddLine,
  RiErrorWarningLine,
  RiPercentLine,
} from "@remixicon/react"

import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { ApiError } from "@/lib/api/client"
import {
  crearImpuesto,
  listarImpuestos,
  type Afectacion,
  type CrearImpuestoDto,
  type TipoCalculoImpuesto,
  type TipoTributo,
} from "@/lib/api/catalogo"
import { usePermisos } from "@/hooks/use-permisos"

function errMsg(e: unknown) {
  return (e as ApiError | Error | null)?.message ?? null
}

const AFECTACIONES: { value: Afectacion; label: string }[] = [
  { value: "GRAVADO", label: "Gravado (paga IGV)" },
  { value: "EXONERADO", label: "Exonerado" },
  { value: "INAFECTO", label: "Inafecto" },
  { value: "GRATUITO", label: "Gratuito" },
  { value: "EXPORTACION", label: "Exportación" },
]

const afectacionLabel = (a: Afectacion) =>
  AFECTACIONES.find((x) => x.value === a)?.label ?? a

const TIPOS_CALCULO: { value: TipoCalculoImpuesto; label: string }[] = [
  { value: "PORCENTAJE", label: "Porcentaje (%)" },
  { value: "MONTO_FIJO", label: "Monto fijo por unidad" },
]

const TIPOS_TRIBUTO: { value: TipoTributo; label: string }[] = [
  { value: "IGV", label: "IGV" },
  { value: "ISC", label: "ISC" },
  { value: "ICBPER", label: "ICBPER (bolsa)" },
  { value: "EXONERADO", label: "Exonerado" },
  { value: "INAFECTO", label: "Inafecto" },
  { value: "EXPORTACION", label: "Exportación" },
  { value: "OTRO", label: "Otro" },
]

export default function ImpuestosPage() {
  const qc = useQueryClient()
  const { can } = usePermisos()
  const puedeCrear = can("catalogo.crear")

  const impuestos = useQuery({
    queryKey: ["impuestos"],
    queryFn: listarImpuestos,
  })
  const data = impuestos.data ?? []
  const hayIgv = data.some((t) => t.codigo === "IGV")
  const hayIcbper = data.some((t) => t.codigo === "ICBPER")

  const [nombre, setNombre] = React.useState("")
  const [codigo, setCodigo] = React.useState("")
  const [afectacion, setAfectacion] = React.useState<Afectacion>("GRAVADO")
  const [tasa, setTasa] = React.useState("")
  const [incluido, setIncluido] = React.useState(true)
  const [tipoCalculo, setTipoCalculo] =
    React.useState<TipoCalculoImpuesto>("PORCENTAJE")
  const [tipoTributo, setTipoTributo] = React.useState<TipoTributo>("IGV")

  const mCrear = useMutation({
    mutationFn: (dto: CrearImpuestoDto) => crearImpuesto(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["impuestos"] })
      setNombre("")
      setCodigo("")
      setTasa("")
      setAfectacion("GRAVADO")
      setIncluido(true)
      setTipoCalculo("PORCENTAJE")
      setTipoTributo("IGV")
    },
  })
  const err = errMsg(mCrear.error)

  const crearIgv = () =>
    mCrear.mutate({
      codigo: "IGV",
      nombre: "IGV 18%",
      affectation: "GRAVADO",
      rate: 18,
      includedInPrice: true,
      sunatTributeCode: "1000",
      tipoCalculo: "PORCENTAJE",
      tipoTributo: "IGV",
    })

  const crearIcbper = () =>
    mCrear.mutate({
      codigo: "ICBPER",
      nombre: "ICBPER (bolsa plástica)",
      affectation: "GRAVADO",
      rate: 0.5,
      includedInPrice: false,
      sunatTributeCode: "7152",
      tipoCalculo: "MONTO_FIJO",
      tipoTributo: "ICBPER",
    })

  const esMontoFijo = tipoCalculo === "MONTO_FIJO"
  const puedeAgregar =
    nombre.trim().length >= 2 && codigo.trim().length >= 1 && tasa !== ""

  const crearCustom = () =>
    mCrear.mutate({
      codigo: codigo.trim().toUpperCase(),
      nombre: nombre.trim(),
      affectation: afectacion,
      rate: parseFloat(tasa) || 0,
      includedInPrice: esMontoFijo ? false : incluido,
      tipoCalculo,
      tipoTributo,
    })

  return (
    <>
      <PageHeader
        title="Impuestos"
        description="Define el IGV y otros tributos que aplican a tus productos."
      />

      <div className="flex-1 overflow-auto">
        <div className="mx-auto flex max-w-2xl flex-col gap-5 p-5 md:p-6">
          {puedeCrear ? (
            <div className="flex flex-col gap-4 rounded-xl border bg-card p-4">
              {/* Atajos: los tributos más comunes en Perú, de un clic. */}
              {!hayIgv || !hayIcbper ? (
                <div className="flex flex-col gap-2 rounded-lg bg-primary/5 p-3">
                  <p className="text-sm font-medium">Atajos frecuentes</p>
                  <div className="flex flex-wrap gap-2">
                    {!hayIgv ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled={mCrear.isPending}
                        onClick={crearIgv}
                      >
                        <RiAddLine />
                        IGV 18%
                      </Button>
                    ) : null}
                    {!hayIcbper ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={mCrear.isPending}
                        onClick={crearIcbper}
                      >
                        <RiAddLine />
                        ICBPER (S/ 0.50 por bolsa)
                      </Button>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    IGV: incluido en el precio. ICBPER: monto fijo por bolsa
                    plástica, se suma al total.
                  </p>
                </div>
              ) : null}

              <p className="text-sm font-medium">Nuevo impuesto</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label className="text-xs text-muted-foreground">Nombre</Label>
                  <Input
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: IGV 18%"
                    className="h-10"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs text-muted-foreground">Código</Label>
                  <Input
                    value={codigo}
                    onChange={(e) =>
                      setCodigo(e.target.value.toUpperCase().replace(/\s/g, ""))
                    }
                    placeholder="IGV"
                    className="h-10 font-mono"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs text-muted-foreground">Tributo</Label>
                  <Select
                    value={tipoTributo}
                    onChange={(v) => setTipoTributo(v as TipoTributo)}
                    options={TIPOS_TRIBUTO}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Tipo de cálculo
                  </Label>
                  <Select
                    value={tipoCalculo}
                    onChange={(v) => setTipoCalculo(v as TipoCalculoImpuesto)}
                    options={TIPOS_CALCULO}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Afectación
                  </Label>
                  <Select
                    value={afectacion}
                    onChange={(v) => setAfectacion(v as Afectacion)}
                    options={AFECTACIONES}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs text-muted-foreground">
                    {esMontoFijo ? "Monto (S/ por unidad)" : "Tasa (%)"}
                  </Label>
                  <Input
                    inputMode="decimal"
                    value={tasa}
                    onChange={(e) =>
                      setTasa(e.target.value.replace(/[^\d.]/g, ""))
                    }
                    placeholder={esMontoFijo ? "0.50" : "18"}
                    className="h-10 tabular-nums"
                  />
                </div>
              </div>
              {!esMontoFijo ? (
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={incluido}
                    onChange={(e) => setIncluido(e.target.checked)}
                    className="size-4 accent-[var(--primary)]"
                  />
                  El precio de venta ya incluye este impuesto
                </label>
              ) : null}
              <p className="text-[11px] text-muted-foreground">
                {esMontoFijo
                  ? "Monto fijo por unidad (ej. ICBPER S/ 0.50 por bolsa). Se suma al total al vender."
                  : incluido
                    ? "El impuesto se extrae del precio (precio con IGV). Normal en retail peruano."
                    : "El impuesto se suma al precio al vender (precio sin IGV)."}
              </p>
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!puedeAgregar || mCrear.isPending}
                  onClick={crearCustom}
                >
                  <RiAddLine />
                  {mCrear.isPending ? "Agregando…" : "Agregar impuesto"}
                </Button>
              </div>
              {err ? (
                <p className="flex items-center gap-1.5 text-xs text-destructive">
                  <RiErrorWarningLine className="size-4 shrink-0" />
                  {err}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-xl border bg-card">
            {impuestos.isLoading ? (
              <div className="flex flex-col gap-2 p-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-11 w-full rounded-lg" />
                ))}
              </div>
            ) : data.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
                <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <RiPercentLine className="size-5" />
                </span>
                <p className="text-sm font-medium">Sin impuestos todavía</p>
                <p className="text-sm text-muted-foreground">
                  Sin impuestos, tus productos se venden sin IGV.
                </p>
              </div>
            ) : (
              <Table>
                <TableBody>
                  {data.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="pl-5">
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <RiPercentLine className="size-4" />
                          </span>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                              {t.nombre}
                            </div>
                            <div className="truncate font-mono text-xs text-muted-foreground">
                              {t.codigo} · {afectacionLabel(t.affectation)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums font-medium">
                        {t.tipoCalculo === "MONTO_FIJO"
                          ? `S/ ${Number(t.rate).toFixed(2)}`
                          : `${Number(t.rate)}%`}
                      </TableCell>
                      <TableCell className="pr-5 text-right">
                        <Badge variant="secondary">
                          {t.tipoCalculo === "MONTO_FIJO"
                            ? "Por unidad"
                            : t.includedInPrice
                              ? "Incluido"
                              : "Se suma"}
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
    </>
  )
}
