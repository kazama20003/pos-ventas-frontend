"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  RiAddLine,
  RiCheckLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiEditLine,
  RiErrorWarningLine,
  RiPriceTag3Line,
} from "@remixicon/react"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table"
import { ApiError } from "@/lib/api/client"
import {
  actualizarMarca,
  archivarMarca,
  crearMarca,
  listarMarcas,
  type Marca,
} from "@/lib/api/catalogo"
import { usePermisos } from "@/hooks/use-permisos"

function errMsg(e: unknown) {
  return (e as ApiError | Error | null)?.message ?? null
}

export default function MarcasPage() {
  const qc = useQueryClient()
  const { can } = usePermisos()
  const puedeCrear = can("catalogo.crear")

  const marcas = useQuery({ queryKey: ["marcas"], queryFn: listarMarcas })
  const data = marcas.data ?? []

  const [nueva, setNueva] = React.useState("")
  const mCrear = useMutation({
    mutationFn: () => crearMarca({ nombre: nueva.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["marcas"] })
      setNueva("")
    },
  })
  const err = errMsg(mCrear.error)

  return (
    <>
      <PageHeader
        title="Marcas"
        description="Marcas de tus productos."
      />

      <div className="flex-1 overflow-auto">
        <div className="mx-auto flex max-w-2xl flex-col gap-5 p-5 md:p-6">
          {/* Alta rápida */}
          {puedeCrear ? (
            <div className="flex gap-2 rounded-xl border bg-card p-2">
              <Input
                value={nueva}
                onChange={(e) => setNueva(e.target.value)}
                placeholder="Nombre de la marca"
                className="h-10"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && nueva.trim() && !mCrear.isPending) {
                    mCrear.mutate()
                  }
                }}
              />
              <Button
                type="button"
                disabled={!nueva.trim() || mCrear.isPending}
                onClick={() => mCrear.mutate()}
              >
                <RiAddLine />
                {mCrear.isPending ? "…" : "Agregar"}
              </Button>
            </div>
          ) : null}

          {err ? (
            <p className="flex items-center gap-1.5 text-xs text-destructive">
              <RiErrorWarningLine className="size-4 shrink-0" />
              {err}
            </p>
          ) : null}

          {/* Lista */}
          <div className="rounded-xl border bg-card">
            {marcas.isLoading ? (
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
                <p className="text-sm font-medium">Sin marcas todavía</p>
              </div>
            ) : (
              <Table>
                <TableBody>
                  {data.map((m) => (
                    <FilaMarca key={m.id} marca={m} />
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

function FilaMarca({ marca }: { marca: Marca }) {
  const qc = useQueryClient()
  const { can } = usePermisos()
  const puedeEditar = can("catalogo.editar")
  const puedeEliminar = can("catalogo.eliminar")

  const [editando, setEditando] = React.useState(false)
  const [nombre, setNombre] = React.useState(marca.nombre)

  const invalidar = () => qc.invalidateQueries({ queryKey: ["marcas"] })
  const mGuardar = useMutation({
    mutationFn: () => actualizarMarca(marca.id, nombre.trim()),
    onSuccess: () => {
      invalidar()
      setEditando(false)
    },
  })
  const mArchivar = useMutation({
    mutationFn: () => archivarMarca(marca.id),
    onSuccess: invalidar,
  })
  const err = errMsg(mGuardar.error || mArchivar.error)

  if (editando) {
    return (
      <TableRow className="hover:bg-transparent">
        <TableCell className="pl-5">
          <div className="flex items-center gap-2">
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="h-9"
              autoFocus
            />
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              disabled={!nombre.trim() || mGuardar.isPending}
              onClick={() => mGuardar.mutate()}
            >
              <RiCheckLine />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={() => {
                setEditando(false)
                setNombre(marca.nombre)
              }}
            >
              <RiCloseLine />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <TableRow>
      <TableCell className="pl-5">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <RiPriceTag3Line className="size-4" />
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{marca.nombre}</div>
            <div className="truncate font-mono text-xs text-muted-foreground">
              {marca.codigo}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="pr-5 text-right whitespace-nowrap">
        {err ? (
          <span className="mr-2 text-xs text-destructive">{err}</span>
        ) : null}
        {puedeEditar ? (
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            title="Renombrar"
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
