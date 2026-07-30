"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  RiArrowLeftLine,
  RiBox3Line,
  RiCheckLine,
  RiErrorWarningLine,
  RiFolder3Line,
  RiPriceTag3Line,
  RiScales3Line,
  RiServiceLine,
  RiStackLine,
} from "@remixicon/react"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ApiError } from "@/lib/api/client"
import {
  crearCategoria,
  crearProducto,
  crearUnidad,
  listarCategorias,
  listarImpuestos,
  listarUnidades,
  type TipoProducto,
} from "@/lib/api/catalogo"
import { cn } from "@/lib/utils"

/**
 * Unidades de medida frecuentes con su código SUNAT. Sirven como atajos: el
 * usuario elige "Kilo" sin saber que por debajo existe una tabla de unidades.
 */
const UNIDADES_COMUNES = [
  { codigo: "UND", nombre: "Por unidad", symbol: "u", sunatCode: "NIU" },
  { codigo: "KGM", nombre: "Por kilo", symbol: "kg", sunatCode: "KGM" },
  { codigo: "GRM", nombre: "Por gramo", symbol: "g", sunatCode: "GRM" },
  { codigo: "LTR", nombre: "Por litro", symbol: "L", sunatCode: "LTR" },
  { codigo: "MTR", nombre: "Por metro", symbol: "m", sunatCode: "MTR" },
  { codigo: "CAJ", nombre: "Por caja", symbol: "caja", sunatCode: "BX" },
  { codigo: "PAQ", nombre: "Por paquete", symbol: "paq", sunatCode: "PK" },
  { codigo: "DOC", nombre: "Por docena", symbol: "doc", sunatCode: "DZN" },
] as const

const TIPOS: {
  value: TipoProducto
  titulo: string
  detalle: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  {
    value: "ESTANDAR",
    titulo: "Producto",
    detalle: "Algo físico que vendes: comida, bebida, mercadería.",
    icon: RiBox3Line,
  },
  {
    value: "SERVICIO",
    titulo: "Servicio",
    detalle: "Un trabajo, no un objeto: corte, reparación, asesoría.",
    icon: RiServiceLine,
  },
  {
    value: "PAQUETE",
    titulo: "Combo",
    detalle: "Varios productos vendidos juntos a un solo precio.",
    icon: RiStackLine,
  },
]

/** Deriva un código legible a partir del nombre: "Café Americano" → "CAFE-AMERICANO". */
function sugerirCodigo(nombre: string) {
  return nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24)
}

function Seccion({
  paso,
  titulo,
  ayuda,
  icon: Icon,
  children,
}: {
  paso: number
  titulo: string
  ayuda: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <section className="rounded-3xl border bg-card p-5 shadow-sm ring-1 ring-foreground/5">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Paso {paso}
          </p>
          <h2 className="text-base font-semibold leading-tight">{titulo}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{ayuda}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

const selectCls =
  "h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"

export default function NuevoProductoPage() {
  const router = useRouter()
  const qc = useQueryClient()

  const unidades = useQuery({ queryKey: ["unidades"], queryFn: listarUnidades })
  const impuestos = useQuery({ queryKey: ["impuestos"], queryFn: listarImpuestos })
  const categorias = useQuery({ queryKey: ["categorias"], queryFn: listarCategorias })

  const [nombre, setNombre] = React.useState("")
  const [codigo, setCodigo] = React.useState("")
  const [codigoTocado, setCodigoTocado] = React.useState(false)
  const [tipo, setTipo] = React.useState<TipoProducto>("ESTANDAR")
  const [unidadCodigo, setUnidadCodigo] = React.useState<string>("UND")
  const [costo, setCosto] = React.useState("")
  const [categoriaId, setCategoriaId] = React.useState("")
  const [impuestoId, setImpuestoId] = React.useState("")

  // Sugerir código automáticamente mientras el usuario no lo edite a mano.
  const codigoMostrado = codigoTocado ? codigo : sugerirCodigo(nombre)

  const guardar = useMutation({
    mutationFn: async () => {
      // 1) Asegurar que la unidad elegida existe; si es un atajo, crearla.
      const preset = UNIDADES_COMUNES.find((u) => u.codigo === unidadCodigo)
      let unidadId = unidades.data?.find((u) => u.codigo === unidadCodigo)?.id
      if (!unidadId && preset) {
        const creada = await crearUnidad({
          codigo: preset.codigo,
          nombre: preset.nombre.replace(/^Por /, ""),
          symbol: preset.symbol,
          sunatCode: preset.sunatCode,
        })
        unidadId = creada.id
      }
      if (!unidadId) throw new Error("Selecciona cómo se vende el producto")

      const cod = (codigoTocado ? codigo : sugerirCodigo(nombre)).trim()
      return crearProducto({
        codigo: cod,
        nombre: nombre.trim(),
        kind: tipo,
        categoriaIds: categoriaId ? [categoriaId] : [],
        variantes: [
          {
            unidadMedidaId: unidadId,
            sku: cod,
            nombre: nombre.trim(),
            cost: costo ? parseFloat(costo) : undefined,
            impuestoIds: impuestoId ? [impuestoId] : [],
          },
        ],
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["productos"] })
      qc.invalidateQueries({ queryKey: ["unidades"] })
      router.push("/productos")
    },
  })

  // Crear categoría rápida sin salir de la página.
  const [nuevaCat, setNuevaCat] = React.useState(false)
  const [catNombre, setCatNombre] = React.useState("")
  const mCategoria = useMutation({
    mutationFn: () =>
      crearCategoria({
        codigo: sugerirCodigo(catNombre) || catNombre.trim(),
        nombre: catNombre.trim(),
      }),
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ["categorias"] })
      setCategoriaId(c.id)
      setNuevaCat(false)
      setCatNombre("")
    },
  })

  const valido = nombre.trim().length > 0 && codigoMostrado.length > 0
  const error = guardar.error as ApiError | Error | null

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (valido) guardar.mutate()
  }

  return (
    <>
      <PageHeader
        title="Nuevo producto"
        description="Completa los datos. Los pasos con “opcional” puedes dejarlos en blanco."
        actions={
          <Button variant="ghost" size="sm" onClick={() => router.push("/productos")}>
            <RiArrowLeftLine />
            Volver
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-4 md:p-6">
        <form onSubmit={enviar} className="mx-auto flex max-w-2xl flex-col gap-4 pb-24">
          {error ? (
            <div className="flex items-start gap-2 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <RiErrorWarningLine className="mt-0.5 size-4 shrink-0" />
              <span>{error.message}</span>
            </div>
          ) : null}

          {/* Paso 1 — Información básica */}
          <Seccion
            paso={1}
            titulo="¿Qué vas a vender?"
            ayuda="Escribe el nombre tal como quieres que aparezca en la boleta."
            icon={RiPriceTag3Line}
          >
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre del producto</Label>
                <Input
                  id="nombre"
                  autoFocus
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Café americano"
                  className="h-11 text-base"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="codigo">
                  Código{" "}
                  <span className="font-normal text-muted-foreground">
                    · lo usamos para identificarlo, puedes dejar el sugerido
                  </span>
                </Label>
                <Input
                  id="codigo"
                  value={codigoMostrado}
                  onChange={(e) => {
                    setCodigoTocado(true)
                    setCodigo(e.target.value)
                  }}
                  placeholder="CAFE-AMERICANO"
                  className="font-mono"
                />
              </div>
            </div>
          </Seccion>

          {/* Paso 2 — Tipo */}
          <Seccion
            paso={2}
            titulo="¿Qué tipo es?"
            ayuda="Elige la opción que mejor lo describa."
            icon={RiBox3Line}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              {TIPOS.map((t) => {
                const activo = tipo === t.value
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTipo(t.value)}
                    className={cn(
                      "flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-colors",
                      activo
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "hover:bg-muted/40"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-9 items-center justify-center rounded-xl",
                        activo
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <t.icon className="size-4" />
                    </span>
                    <span className="text-sm font-semibold">{t.titulo}</span>
                    <span className="text-xs leading-snug text-muted-foreground">
                      {t.detalle}
                    </span>
                  </button>
                )
              })}
            </div>
          </Seccion>

          {/* Paso 3 — Unidad de medida */}
          <Seccion
            paso={3}
            titulo="¿Cómo lo vendes?"
            ayuda="Selecciona la forma en que lo entregas al cliente."
            icon={RiScales3Line}
          >
            <div className="flex flex-wrap gap-2">
              {UNIDADES_COMUNES.map((u) => {
                const activo = unidadCodigo === u.codigo
                return (
                  <button
                    key={u.codigo}
                    type="button"
                    onClick={() => setUnidadCodigo(u.codigo)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-colors",
                      activo
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:bg-muted/50"
                    )}
                  >
                    {activo ? <RiCheckLine className="size-4" /> : null}
                    {u.nombre}
                  </button>
                )
              })}
            </div>
          </Seccion>

          {/* Paso 4 — Costo (opcional) */}
          <Seccion
            paso={4}
            titulo="Costo (opcional)"
            ayuda="Cuánto te cuesta a ti conseguirlo. Sirve para calcular tu ganancia."
            icon={RiPriceTag3Line}
          >
            <div className="grid gap-2 sm:max-w-xs">
              <Label htmlFor="costo">Costo por {UNIDADES_COMUNES.find((u) => u.codigo === unidadCodigo)?.symbol ?? "unidad"}</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  S/
                </span>
                <Input
                  id="costo"
                  inputMode="decimal"
                  value={costo}
                  onChange={(e) => setCosto(e.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="0.00"
                  className="pl-9 tabular-nums"
                />
              </div>
            </div>
          </Seccion>

          {/* Paso 5 — Organización (opcional) */}
          <Seccion
            paso={5}
            titulo="Grupo (opcional)"
            ayuda="Agrupa productos parecidos para encontrarlos más rápido. Ej: Bebidas, Snacks."
            icon={RiFolder3Line}
          >
            {nuevaCat ? (
              <div className="flex flex-col gap-3 rounded-2xl bg-muted/40 p-3 sm:flex-row sm:items-end">
                <div className="grid flex-1 gap-2">
                  <Label htmlFor="catNombre">Nombre del grupo</Label>
                  <Input
                    id="catNombre"
                    value={catNombre}
                    onChange={(e) => setCatNombre(e.target.value)}
                    placeholder="Ej: Bebidas"
                  />
                  {mCategoria.error ? (
                    <p className="text-xs text-destructive">
                      {(mCategoria.error as ApiError).message}
                    </p>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setNuevaCat(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={!catNombre.trim() || mCategoria.isPending}
                    onClick={() => mCategoria.mutate()}
                  >
                    {mCategoria.isPending ? "Creando…" : "Crear grupo"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <select
                  className={selectCls}
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                >
                  <option value="">Sin grupo</option>
                  {categorias.data?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => setNuevaCat(true)}
                >
                  + Nuevo grupo
                </Button>
              </div>
            )}
          </Seccion>

          {/* Paso 6 — Impuesto (opcional) */}
          <Seccion
            paso={6}
            titulo="Impuesto (opcional)"
            ayuda="Si este producto lleva IGV, selecciónalo. Si no estás seguro, déjalo en blanco."
            icon={RiPriceTag3Line}
          >
            <select
              className={selectCls}
              value={impuestoId}
              onChange={(e) => setImpuestoId(e.target.value)}
            >
              <option value="">Sin impuesto</option>
              {impuestos.data?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre} ({t.codigo})
                </option>
              ))}
            </select>
          </Seccion>
        </form>
      </div>

      {/* Barra de acción fija */}
      <div className="sticky bottom-0 z-10 flex items-center justify-end gap-2 border-t bg-background/80 px-4 py-3 backdrop-blur-md md:px-6">
        <Button variant="ghost" onClick={() => router.push("/productos")}>
          Cancelar
        </Button>
        <Button onClick={enviar} disabled={!valido || guardar.isPending}>
          {guardar.isPending ? "Guardando…" : "Guardar producto"}
        </Button>
      </div>
    </>
  )
}
