"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  RiAddLine,
  RiCheckLine,
  RiCloseLine,
  RiCornerDownRightLine,
  RiDeleteBinLine,
  RiEditLine,
  RiErrorWarningLine,
  RiPriceTag3Line,
} from "@remixicon/react"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { ApiError } from "@/lib/api/client"
import {
  actualizarCategoria,
  archivarCategoria,
  crearCategoria,
  listarCategorias,
  type Categoria,
} from "@/lib/api/catalogo"
import { usePermisos } from "@/hooks/use-permisos"

function errMsg(e: unknown) {
  return (e as ApiError | Error | null)?.message ?? null
}

function slug(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30)
}

/** Ordena las categorías como árbol: cada padre seguido de sus hijos. */
function ordenarJerarquia(
  cats: Categoria[]
): { cat: Categoria; nivel: number }[] {
  const hijos = new Map<string | null, Categoria[]>()
  for (const c of cats) {
    const key = c.padreId ?? null
    const lista = hijos.get(key) ?? []
    lista.push(c)
    hijos.set(key, lista)
  }
  const salida: { cat: Categoria; nivel: number }[] = []
  const visitar = (padreId: string | null, nivel: number) => {
    for (const c of hijos.get(padreId) ?? []) {
      salida.push({ cat: c, nivel })
      visitar(c.id, nivel + 1)
    }
  }
  visitar(null, 0)
  // Categorías huérfanas (padre archivado): añádelas al final por si acaso.
  const vistas = new Set(salida.map((s) => s.cat.id))
  for (const c of cats) if (!vistas.has(c.id)) salida.push({ cat: c, nivel: 0 })
  return salida
}

export default function CategoriasPage() {
  const qc = useQueryClient()
  const { can } = usePermisos()
  const puedeCrear = can("catalogo.crear")

  const categorias = useQuery({
    queryKey: ["categorias"],
    queryFn: listarCategorias,
  })
  const data = categorias.data ?? []
  const arbol = React.useMemo(() => ordenarJerarquia(data), [data])

  const [nombre, setNombre] = React.useState("")
  const [descripcion, setDescripcion] = React.useState("")
  const [padreId, setPadreId] = React.useState("")
  const [sunatCode, setSunatCode] = React.useState("")

  const mCrear = useMutation({
    mutationFn: () =>
      crearCategoria({
        codigo: slug(nombre),
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        sunatProductCode: sunatCode.trim() || undefined,
        padreId: padreId || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categorias"] })
      setNombre("")
      setDescripcion("")
      setPadreId("")
      setSunatCode("")
    },
  })
  const err = errMsg(mCrear.error)
  const puedeAgregar = nombre.trim().length >= 2 && slug(nombre).length >= 2

  return (
    <>
      <PageHeader
        title="Categorías"
        description="Organiza tus productos en grupos y subgrupos."
      />

      <div className="flex-1 overflow-auto">
        <div className="mx-auto flex max-w-2xl flex-col gap-5 p-5 md:p-6">
          {/* Alta */}
          {puedeCrear ? (
            <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
              <p className="text-sm font-medium">Nueva categoría</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label className="text-xs text-muted-foreground">Nombre</Label>
                  <Input
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Bebidas"
                    className="h-10"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && puedeAgregar && !mCrear.isPending)
                        mCrear.mutate()
                    }}
                  />
                  {nombre.trim() ? (
                    <p className="text-[11px] text-muted-foreground">
                      Código: <span className="font-mono">{slug(nombre)}</span>
                    </p>
                  ) : null}
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Categoría padre
                  </Label>
                  <Select
                    value={padreId}
                    onChange={setPadreId}
                    placeholder="Ninguna (nivel principal)"
                    options={[
                      { value: "", label: "Ninguna (nivel principal)" },
                      ...data.map((c) => ({ value: c.id, label: c.nombre })),
                    ]}
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Descripción (opcional)
                  </Label>
                  <Input
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Para qué sirve este grupo"
                    className="h-10"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Código SUNAT (opcional)
                  </Label>
                  <Input
                    value={sunatCode}
                    onChange={(e) => setSunatCode(e.target.value)}
                    placeholder="UNSPSC, ej: 50202301"
                    className="h-10 font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Los productos de este grupo lo heredan para la factura.
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  disabled={!puedeAgregar || mCrear.isPending}
                  onClick={() => mCrear.mutate()}
                >
                  <RiAddLine />
                  {mCrear.isPending ? "Agregando…" : "Agregar"}
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

          {/* Lista */}
          <div className="rounded-xl border bg-card">
            {categorias.isLoading ? (
              <div className="flex flex-col gap-2 p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-11 w-full rounded-lg" />
                ))}
              </div>
            ) : data.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
                <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <RiPriceTag3Line className="size-5" />
                </span>
                <p className="text-sm font-medium">Sin categorías todavía</p>
                <p className="text-sm text-muted-foreground">
                  Crea grupos para ordenar tu catálogo.
                </p>
              </div>
            ) : (
              <Table>
                <TableBody>
                  {arbol.map(({ cat, nivel }) => (
                    <FilaCategoria
                      key={cat.id}
                      categoria={cat}
                      nivel={nivel}
                      todas={data}
                    />
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

function FilaCategoria({
  categoria,
  nivel,
  todas,
}: {
  categoria: Categoria
  nivel: number
  todas: Categoria[]
}) {
  const qc = useQueryClient()
  const { can } = usePermisos()
  const puedeEditar = can("catalogo.editar")
  const puedeEliminar = can("catalogo.eliminar")

  const [editando, setEditando] = React.useState(false)
  const [nombre, setNombre] = React.useState(categoria.nombre)
  const [descripcion, setDescripcion] = React.useState(
    categoria.descripcion ?? ""
  )
  const [padreId, setPadreId] = React.useState(categoria.padreId ?? "")
  const [sunatCode, setSunatCode] = React.useState(
    categoria.sunatProductCode ?? ""
  )

  const invalidar = () => qc.invalidateQueries({ queryKey: ["categorias"] })
  const mGuardar = useMutation({
    mutationFn: () =>
      actualizarCategoria(categoria.id, {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        sunatProductCode: sunatCode.trim(),
        padreId: padreId || undefined,
      }),
    onSuccess: () => {
      invalidar()
      setEditando(false)
    },
  })
  const mArchivar = useMutation({
    mutationFn: () => archivarCategoria(categoria.id),
    onSuccess: invalidar,
  })
  const err = errMsg(mGuardar.error || mArchivar.error)

  if (editando) {
    // Evita que una categoría se elija a sí misma como padre.
    const posiblesPadres = todas.filter((c) => c.id !== categoria.id)
    return (
      <TableRow className="hover:bg-transparent">
        <TableCell className="p-3">
          <div className="flex flex-col gap-2">
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="h-9"
              autoFocus
              placeholder="Nombre"
            />
            <Input
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="h-9"
              placeholder="Descripción (opcional)"
            />
            <Input
              value={sunatCode}
              onChange={(e) => setSunatCode(e.target.value)}
              className="h-9 font-mono"
              placeholder="Código SUNAT (opcional, UNSPSC)"
            />
            <Select
              value={padreId}
              onChange={setPadreId}
              placeholder="Sin categoría padre"
              options={[
                { value: "", label: "Ninguna (nivel principal)" },
                ...posiblesPadres.map((c) => ({ value: c.id, label: c.nombre })),
              ]}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditando(false)
                  setNombre(categoria.nombre)
                  setDescripcion(categoria.descripcion ?? "")
                  setPadreId(categoria.padreId ?? "")
                  setSunatCode(categoria.sunatProductCode ?? "")
                }}
              >
                <RiCloseLine />
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!nombre.trim() || mGuardar.isPending}
                onClick={() => mGuardar.mutate()}
              >
                <RiCheckLine />
                {mGuardar.isPending ? "…" : "Guardar"}
              </Button>
            </div>
            {err ? (
              <p className="text-xs text-destructive">{err}</p>
            ) : null}
          </div>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <TableRow>
      <TableCell className="pl-5">
        <div
          className="flex items-center gap-2.5"
          style={{ paddingLeft: nivel * 20 }}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {nivel > 0 ? (
              <RiCornerDownRightLine className="size-4" />
            ) : (
              <RiPriceTag3Line className="size-4" />
            )}
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{categoria.nombre}</div>
            <div className="truncate text-xs text-muted-foreground">
              <span className="font-mono">{categoria.codigo}</span>
              {categoria.descripcion ? ` · ${categoria.descripcion}` : ""}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="pr-5 text-right whitespace-nowrap">
        {err ? <span className="mr-2 text-xs text-destructive">{err}</span> : null}
        {puedeEditar ? (
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            title="Editar"
            onClick={() => setEditando(true)}
          >
            <RiEditLine />
          </Button>
        ) : null}
        {puedeEliminar ? (
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            title="Archivar"
            disabled={mArchivar.isPending}
            onClick={() => mArchivar.mutate()}
          >
            <RiDeleteBinLine />
          </Button>
        ) : null}
      </TableCell>
    </TableRow>
  )
}
