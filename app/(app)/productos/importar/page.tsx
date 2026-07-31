"use client"

import * as React from "react"
import Link from "next/link"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  RiArrowLeftLine,
  RiCheckLine,
  RiErrorWarningLine,
  RiFileList3Line,
  RiUploadCloud2Line,
} from "@remixicon/react"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api/client"
import {
  importarProductos,
  type ImportarProductoFila,
  type ImportarResultado,
} from "@/lib/api/catalogo"

/** Cabeceras aceptadas → campo interno. Se normalizan sin acentos/mayúsculas. */
const MAPA_COLUMNAS: Record<string, keyof ImportarProductoFila> = {
  nombre: "nombre",
  producto: "nombre",
  codigo: "codigo",
  sku: "codigo",
  precio: "precio",
  venta: "precio",
  costo: "costo",
  coste: "costo",
  stock: "stockInicial",
  cantidad: "stockInicial",
  existencia: "stockInicial",
  existencias: "stockInicial",
  barcode: "barcode",
  codigobarras: "barcode",
  ean: "barcode",
  unidad: "unidad",
  medida: "unidad",
  categoria: "categoria",
  grupo: "categoria",
  marca: "marca",
  impuesto: "impuesto",
  igv: "impuesto",
}

const NUMERICOS = new Set(["precio", "costo", "stockInicial"])

function normalizar(s: string) {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "")
}

/** Parser CSV mínimo con soporte de comillas y separador coma o punto y coma. */
function parseCSV(texto: string): string[][] {
  const filas: string[][] = []
  let campo = ""
  let fila: string[] = []
  let enComillas = false
  const sep = texto.split("\n")[0]?.includes(";") ? ";" : ","
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]
    if (enComillas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          campo += '"'
          i++
        } else enComillas = false
      } else campo += c
    } else if (c === '"') enComillas = true
    else if (c === sep) {
      fila.push(campo)
      campo = ""
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++
      fila.push(campo)
      if (fila.some((v) => v.trim() !== "")) filas.push(fila)
      fila = []
      campo = ""
    } else campo += c
  }
  if (campo !== "" || fila.length) {
    fila.push(campo)
    if (fila.some((v) => v.trim() !== "")) filas.push(fila)
  }
  return filas
}

function filasDesdeCSV(texto: string): ImportarProductoFila[] {
  const filas = parseCSV(texto)
  if (filas.length < 2) return []
  const cabecera = filas[0].map((h) => MAPA_COLUMNAS[normalizar(h)])
  return filas.slice(1).map((cols) => {
    const obj: Record<string, string | number> = {}
    cols.forEach((val, i) => {
      const campo = cabecera[i]
      if (!campo) return
      const v = val.trim()
      if (v === "") return
      if (NUMERICOS.has(campo)) {
        const n = parseFloat(v.replace(",", "."))
        if (Number.isFinite(n)) obj[campo] = n
      } else obj[campo] = v
    })
    return obj as unknown as ImportarProductoFila
  })
}

const PLANTILLA =
  "nombre,precio,costo,stock,barcode,unidad,categoria,marca,impuesto\n" +
  "Café americano,8.50,3.00,50,7501234567890,unidad,Bebidas,Juan Valdez,IGV\n" +
  "Agua 625ml,2.00,1.00,120,7509876543210,unidad,Bebidas,San Luis,IGV"

export default function ImportarProductosPage() {
  const qc = useQueryClient()
  const [texto, setTexto] = React.useState("")
  const [resultado, setResultado] = React.useState<ImportarResultado | null>(null)

  const filas = React.useMemo(() => filasDesdeCSV(texto), [texto])
  const validas = filas.filter((f) => f.nombre?.trim())

  const importar = useMutation({
    mutationFn: () => importarProductos({ filas: validas }),
    onSuccess: (r) => {
      setResultado(r)
      qc.invalidateQueries({ queryKey: ["productos"] })
    },
  })

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setTexto(String(reader.result ?? ""))
    reader.readAsText(file)
  }

  const error = importar.error as ApiError | Error | null

  return (
    <>
      <PageHeader
        title="Importar productos"
        description="Carga tu catálogo desde un archivo CSV. Ideal para migrar de otro sistema."
        actions={
          <Button variant="ghost" size="sm" render={<Link href="/productos" />}>
            <RiArrowLeftLine />
            Volver
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 pb-24">
          {error ? (
            <div className="flex items-start gap-2 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <RiErrorWarningLine className="mt-0.5 size-4 shrink-0" />
              <span>{error.message}</span>
            </div>
          ) : null}

          {/* Resultado */}
          {resultado ? (
            <section className="rounded-3xl border bg-card p-5 shadow-sm ring-1 ring-foreground/5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <RiCheckLine className="size-5" />
                </span>
                <div>
                  <h2 className="text-base font-semibold">
                    {resultado.creados} de {resultado.total} productos importados
                  </h2>
                  {resultado.errores.length > 0 ? (
                    <p className="text-sm text-destructive">
                      {resultado.errores.length} fila(s) con error
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin errores 🎉</p>
                  )}
                </div>
              </div>
              {resultado.errores.length > 0 ? (
                <div className="mt-4 flex flex-col gap-1.5">
                  {resultado.errores.map((e) => (
                    <div
                      key={e.fila}
                      className="flex items-start gap-2 rounded-xl bg-destructive/5 px-3 py-2 text-sm"
                    >
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        Fila {e.fila}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="font-medium">{e.nombre || "—"}</span>:{" "}
                        <span className="text-destructive">{e.error}</span>
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="mt-4 flex gap-2">
                <Button render={<Link href="/productos" />}>Ver productos</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setResultado(null)
                    setTexto("")
                  }}
                >
                  Importar más
                </Button>
              </div>
            </section>
          ) : (
            <>
              {/* Carga */}
              <section className="rounded-3xl border bg-card p-5 shadow-sm ring-1 ring-foreground/5">
                <div className="mb-4 flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <RiUploadCloud2Line className="size-5" />
                  </span>
                  <div>
                    <h2 className="text-base font-semibold leading-tight">
                      Tu archivo CSV
                    </h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Sube el archivo o pega el contenido. La primera fila son los
                      títulos de columna.
                    </p>
                  </div>
                </div>

                <label className="mb-3 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed py-6 text-sm text-muted-foreground transition-colors hover:bg-muted/40">
                  <RiUploadCloud2Line className="size-5" />
                  Elegir archivo .csv
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={onFile}
                  />
                </label>

                <textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  rows={8}
                  placeholder={PLANTILLA}
                  className="w-full rounded-xl border bg-background px-3 py-2 font-mono text-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
                />

                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    Columnas: nombre (obligatoria), precio, costo, stock, barcode,
                    unidad, categoria, marca, impuesto.
                  </p>
                  <button
                    type="button"
                    onClick={() => setTexto(PLANTILLA)}
                    className="shrink-0 text-xs font-medium text-primary underline-offset-2 hover:underline"
                  >
                    Usar ejemplo
                  </button>
                </div>
              </section>

              {/* Vista previa */}
              {validas.length > 0 ? (
                <section className="rounded-3xl border bg-card p-5 shadow-sm ring-1 ring-foreground/5">
                  <div className="mb-3 flex items-center gap-2">
                    <RiFileList3Line className="size-5 text-muted-foreground" />
                    <h2 className="text-base font-semibold">
                      Vista previa · {validas.length} producto(s)
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                          <th className="py-2 pr-3">Nombre</th>
                          <th className="py-2 pr-3">Precio</th>
                          <th className="py-2 pr-3">Stock</th>
                          <th className="py-2 pr-3">Categoría</th>
                          <th className="py-2">Marca</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validas.slice(0, 20).map((f, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-2 pr-3 font-medium">{f.nombre}</td>
                            <td className="py-2 pr-3 tabular-nums">
                              {f.precio != null ? `S/ ${f.precio}` : "—"}
                            </td>
                            <td className="py-2 pr-3 tabular-nums">
                              {f.stockInicial ?? "—"}
                            </td>
                            <td className="py-2 pr-3">{f.categoria ?? "—"}</td>
                            <td className="py-2">{f.marca ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {validas.length > 20 ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        … y {validas.length - 20} más.
                      </p>
                    ) : null}
                  </div>
                </section>
              ) : texto.trim() ? (
                <p className="rounded-2xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                  No se detectaron filas válidas. Revisa que exista la columna
                  “nombre”.
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>

      {/* Barra de acción */}
      {!resultado ? (
        <div className="sticky bottom-0 z-10 flex items-center justify-end gap-2 border-t bg-background/80 px-4 py-3 backdrop-blur-md md:px-6">
          <Button variant="ghost" render={<Link href="/productos" />}>
            Cancelar
          </Button>
          <Button
            onClick={() => importar.mutate()}
            disabled={validas.length === 0 || importar.isPending}
          >
            {importar.isPending
              ? "Importando…"
              : `Importar ${validas.length || ""} producto(s)`}
          </Button>
        </div>
      ) : null}
    </>
  )
}
