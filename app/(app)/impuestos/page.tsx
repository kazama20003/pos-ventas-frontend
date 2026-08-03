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

  const [nombre, setNombre] = React.useState("")
  const [codigo, setCodigo] = React.useState("")
  const [afectacion, setAfectacion] = React.useState<Afectacion>("GRAVADO")
  const [tasa, setTasa] = React.useState("")
  const [incluido, setIncluido] = React.useState(true)

  const mCrear = useMutation({
    mutationFn: (dto: CrearImpuestoDto) => crearImpuesto(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["impuestos"] })
      setNombre("")
      setCodigo("")
      setTasa("")
      setAfectacion("GRAVADO")
      setIncluido(true)
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
    })

  const puedeAgregar =
    nombre.trim().length >= 2 && codigo.trim().length >= 1 && tasa !== ""

  const crearCustom = () =>
    mCrear.mutate({
      codigo: codigo.trim().toUpperCase(),
      nombre: nombre.trim(),
      affectation: afectacion,
      rate: parseFloat(tasa) || 0,
      includedInPrice: incluido,
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
              {/* Atajo IGV: el caso 99% en Perú. */}
              {!hayIgv ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-primary/5 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">¿Vendes con IGV?</p>
                    <p className="text-xs text-muted-foreground">
                      Crea el IGV 18% (incluido en el precio) con un clic.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={mCrear.isPending}
                    onClick={crearIgv}
                  >
                    <RiAddLine />
                    Agregar IGV 18%
                  </Button>
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
                  <Label className="text-xs text-muted-foreground">Tasa (%)</Label>
                  <Input
                    inputMode="decimal"
                    value={tasa}
                    onChange={(e) =>
                      setTasa(e.target.value.replace(/[^\d.]/g, ""))
                    }
                    placeholder="18"
                    className="h-10 tabular-nums"
                  />
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={incluido}
                  onChange={(e) => setIncluido(e.target.checked)}
                  className="size-4 accent-[var(--primary)]"
                />
                El precio de venta ya incluye este impuesto
              </label>
              <p className="text-[11px] text-muted-foreground">
                {incluido
                  ? "El IGV se extrae del precio (precio con IGV). Es lo normal en retail peruano."
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
                        {Number(t.rate)}%
                      </TableCell>
                      <TableCell className="pr-5 text-right">
                        <Badge variant="secondary">
                          {t.includedInPrice ? "Incluido" : "Se suma"}
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
