"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  RiArrowLeftLine,
  RiBarcodeLine,
  RiBox3Line,
  RiErrorWarningLine,
  RiFolder3Line,
  RiImageLine,
  RiMoneyDollarCircleLine,
  RiPriceTag3Line,
  RiServiceLine,
  RiStackLine,
} from "@remixicon/react"

import { ImageUpload } from "@/components/productos/image-upload"
import { PageHeader } from "@/components/layout/page-header"
import { ContextualTour } from "@/components/onboarding/contextual-tour"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { ApiError } from "@/lib/api/client"
import {
  crearCategoria,
  crearMarca,
  crearProducto,
  crearUnidad,
  generarBarcodeInterno,
  listarCategorias,
  listarImpuestos,
  listarMarcas,
  listarProductos,
  listarUnidades,
  type ComponenteComboDto,
  type TipoCodigoBarras,
  type TipoProducto,
} from "@/lib/api/catalogo"
import { cn } from "@/lib/utils"

const UNIDADES_COMUNES = [
  { codigo: "UND", nombre: "Unidad", symbol: "u", sunatCode: "NIU" },
  { codigo: "KGM", nombre: "Kilo", symbol: "kg", sunatCode: "KGM" },
  { codigo: "GRM", nombre: "Gramo", symbol: "g", sunatCode: "GRM" },
  { codigo: "LTR", nombre: "Litro", symbol: "L", sunatCode: "LTR" },
  { codigo: "MTR", nombre: "Metro", symbol: "m", sunatCode: "MTR" },
  { codigo: "CAJ", nombre: "Caja", symbol: "caja", sunatCode: "BX" },
  { codigo: "PAQ", nombre: "Paquete", symbol: "paq", sunatCode: "PK" },
  { codigo: "DOC", nombre: "Docena", symbol: "doc", sunatCode: "DZN" },
] as const

// Unidad implícita para servicios (SUNAT ZZ). No se pregunta al usuario:
// un corte de cabello no se vende "por kilo"; se resuelve/crea sola.
const UNIDAD_SERVICIO = {
  codigo: "ZZ",
  nombre: "Servicio",
  symbol: "serv",
  sunatCode: "ZZ",
} as const

const TIPOS: {
  value: TipoProducto
  titulo: string
  detalle: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  {
    value: "ESTANDAR",
    titulo: "Producto",
    detalle: "Algo físico: comida, bebida, mercadería.",
    icon: RiBox3Line,
  },
  {
    value: "SERVICIO",
    titulo: "Servicio",
    detalle: "Un trabajo: corte, reparación, asesoría.",
    icon: RiServiceLine,
  },
  {
    value: "PAQUETE",
    titulo: "Combo",
    detalle: "Varios productos a un solo precio.",
    icon: RiStackLine,
  },
]

const CODIGO_BARRAS_TIPOS: { value: TipoCodigoBarras; label: string }[] = [
  { value: "INTERNO", label: "Interno" },
  { value: "EAN13", label: "EAN-13" },
  { value: "EAN8", label: "EAN-8" },
  { value: "UPC_A", label: "UPC-A" },
  { value: "CODIGO128", label: "Code 128" },
  { value: "QR", label: "QR" },
  { value: "PLU", label: "PLU (balanza)" },
]

function sugerirCodigo(nombre: string) {
  return nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24)
}

/** Tarjeta de sección con cabecera compacta (icono + título). */
function Card({
  titulo,
  ayuda,
  icon: Icon,
  children,
  className,
}: {
  titulo: string
  ayuda?: string
  icon?: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border bg-card p-5 shadow-sm ring-1 ring-foreground/5",
        className
      )}
    >
      <div className="mb-4 flex items-center gap-2.5">
        {Icon ? (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-4" />
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="text-sm font-semibold leading-tight">{titulo}</h2>
          {ayuda ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{ayuda}</p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  )
}

function Campo({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
        {hint ? <span className="ml-1 font-normal">· {hint}</span> : null}
      </Label>
      {children}
    </div>
  )
}

function MoneyInput({
  id,
  value,
  onChange,
  className,
}: {
  id: string
  value: string
  onChange: (v: string) => void
  className?: string
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        S/
      </span>
      <Input
        id={id}
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))}
        placeholder="0.00"
        className={cn("pl-9 tabular-nums", className)}
      />
    </div>
  )
}

export default function NuevoProductoPage() {
  const router = useRouter()
  const qc = useQueryClient()

  const unidades = useQuery({ queryKey: ["unidades"], queryFn: listarUnidades })
  const impuestos = useQuery({ queryKey: ["impuestos"], queryFn: listarImpuestos })
  const categorias = useQuery({ queryKey: ["categorias"], queryFn: listarCategorias })
  const marcas = useQuery({ queryKey: ["marcas"], queryFn: listarMarcas })
  const productos = useQuery({
    queryKey: ["productos", "combo"],
    queryFn: () => listarProductos({ pageSize: 100 }),
  })

  const [nombre, setNombre] = React.useState("")
  const [codigo, setCodigo] = React.useState("")
  const [mostrarCodigo, setMostrarCodigo] = React.useState(false)
  const [descripcion, setDescripcion] = React.useState("")
  const [imagenUrl, setImagenUrl] = React.useState("")
  const [tipo, setTipo] = React.useState<TipoProducto>("ESTANDAR")
  const [unidadCodigo, setUnidadCodigo] = React.useState<string>("UND")
  const [precio, setPrecio] = React.useState("")
  const [barcode, setBarcode] = React.useState("")
  const [barcodeTipo, setBarcodeTipo] = React.useState<TipoCodigoBarras>("INTERNO")
  const [categoriaId, setCategoriaId] = React.useState("")
  const [impuestoId, setImpuestoId] = React.useState("")
  const [sunatProductCode, setSunatProductCode] = React.useState("")
  const [marcaId, setMarcaId] = React.useState("")
  const [combo, setCombo] = React.useState<Record<string, number>>({})

  const genBarcode = useMutation({
    mutationFn: generarBarcodeInterno,
    onSuccess: (r) => {
      setBarcode(r.codigo)
      setBarcodeTipo(r.tipo)
    },
  })

  const codigoPreview = sugerirCodigo(nombre) || "PROD"
  const esServicio = tipo === "SERVICIO"
  const esCombo = tipo === "PAQUETE"

  const guardar = useMutation({
    mutationFn: async () => {
      // Servicios: unidad implícita ZZ, sin preguntar en la vista.
      const codigoUnidad = esServicio ? UNIDAD_SERVICIO.codigo : unidadCodigo
      const preset = esServicio
        ? UNIDAD_SERVICIO
        : UNIDADES_COMUNES.find((u) => u.codigo === unidadCodigo)
      let unidadId = unidades.data?.find((u) => u.codigo === codigoUnidad)?.id
      if (!unidadId && preset) {
        const creada = await crearUnidad({
          codigo: preset.codigo,
          nombre: preset.nombre,
          symbol: preset.symbol,
          sunatCode: preset.sunatCode,
        })
        unidadId = creada.id
      }
      if (!unidadId) throw new Error("Selecciona cómo se vende el producto")

      const codManual = mostrarCodigo ? codigo.trim() : ""
      const componentes: ComponenteComboDto[] = Object.entries(combo)
        .filter(([, cant]) => cant > 0)
        .map(([varianteId, cantidad]) => ({ varianteId, cantidad }))

      return crearProducto({
        codigo: codManual || undefined,
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        kind: tipo,
        marcaId: marcaId || undefined,
        imagenUrl: imagenUrl.trim() || undefined,
        categoriaIds: categoriaId ? [categoriaId] : [],
        componentes: esCombo && componentes.length ? componentes : undefined,
        variantes: [
          {
            unidadMedidaId: unidadId,
            sku: codManual || undefined,
            sunatProductCode: sunatProductCode.trim() || undefined,
            nombre: nombre.trim(),
            precio: precio ? parseFloat(precio) : undefined,
            barcode: barcode.trim() || undefined,
            barcodeTipo: barcode.trim() ? barcodeTipo : undefined,
            isStockTracked: !esServicio,
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

  const [nuevaMarca, setNuevaMarca] = React.useState(false)
  const [marcaNombre, setMarcaNombre] = React.useState("")
  const mMarca = useMutation({
    mutationFn: () => crearMarca({ nombre: marcaNombre.trim() }),
    onSuccess: (m) => {
      qc.invalidateQueries({ queryKey: ["marcas"] })
      setMarcaId(m.id)
      setNuevaMarca(false)
      setMarcaNombre("")
    },
  })

  const valido = nombre.trim().length > 0
  const error = guardar.error as ApiError | Error | null

  const variantesDisponibles = React.useMemo(
    () =>
      (productos.data?.items ?? []).flatMap((p) =>
        p.variants.map((v) => ({
          id: v.id,
          etiqueta: `${p.nombre}${v.nombre && v.nombre !== p.nombre ? ` · ${v.nombre}` : ""}`,
          sku: v.sku,
        }))
      ),
    [productos.data]
  )

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (valido) guardar.mutate()
  }

  return (
    <>
      <ContextualTour
        flowKey="puesta-en-marcha"
        stepKey="producto"
        pasos={[
          {
            selector: "#campo-nombre-producto",
            titulo: "Escribe el nombre",
            descripcion: "Cómo aparecerá en la boleta. Ej: Café americano.",
          },
          {
            selector: "#precio",
            titulo: "Pon el precio de venta",
            descripcion: "Lo que cobra tu caja. Podrás cambiarlo cuando quieras.",
          },
          {
            selector: "#btn-guardar-producto",
            titulo: "Guarda tu producto",
            descripcion: "Y listo: ya puedes venderlo.",
          },
        ]}
      />
      <PageHeader
        title="Nuevo producto"
        description="Completa los datos. Lo marcado como opcional puedes dejarlo en blanco."
        actions={
          <Button variant="ghost" size="sm" onClick={() => router.push("/productos")}>
            <RiArrowLeftLine />
            Volver
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-4 md:p-6">
        <form onSubmit={enviar} className="w-full pb-24">
          {error ? (
            <div className="mb-4 flex items-start gap-2 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <RiErrorWarningLine className="mt-0.5 size-4 shrink-0" />
              <span>{error.message}</span>
            </div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            {/* ===== Columna principal ===== */}
            <div className="flex min-w-0 flex-col gap-4">
              <Card
                titulo="Información básica"
                ayuda="Cómo aparece en la boleta."
                icon={RiPriceTag3Line}
              >
                <div className="grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Campo label="Nombre del producto">
                      <Input
                        id="campo-nombre-producto"
                        autoFocus
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Ej: Café americano"
                        className="h-11 text-base"
                      />
                    </Campo>
                    <Campo label="Código" hint="se genera solo">
                      {mostrarCodigo ? (
                        <div className="flex gap-2">
                          <Input
                            value={codigo}
                            onChange={(e) => setCodigo(e.target.value)}
                            placeholder={codigoPreview}
                            className="h-11 min-w-0 font-mono"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="h-11 shrink-0"
                            onClick={() => {
                              setMostrarCodigo(false)
                              setCodigo("")
                            }}
                          >
                            Auto
                          </Button>
                        </div>
                      ) : (
                        <div className="flex h-11 items-center justify-between gap-3 rounded-xl bg-muted/40 px-3">
                          <span className="truncate font-mono text-sm font-medium">
                            {codigoPreview}
                          </span>
                          <button
                            type="button"
                            onClick={() => setMostrarCodigo(true)}
                            className="shrink-0 text-xs font-medium text-primary underline-offset-2 hover:underline"
                          >
                            Personalizar
                          </button>
                        </div>
                      )}
                    </Campo>
                  </div>

                  <Campo label="Descripción" hint="opcional">
                    <textarea
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      rows={2}
                      placeholder="Detalle visible en cotizaciones/tickets…"
                      className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
                    />
                  </Campo>

                  <Campo label="Tipo de producto">
                    <div className="grid gap-2 sm:grid-cols-3">
                      {TIPOS.map((t) => {
                        const activo = tipo === t.value
                        return (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => setTipo(t.value)}
                            className={cn(
                              "flex items-start gap-2.5 rounded-xl border p-3 text-left transition-colors",
                              activo
                                ? "border-primary bg-primary/5 ring-1 ring-primary"
                                : "hover:bg-muted/40"
                            )}
                          >
                            <span
                              className={cn(
                                "flex size-8 shrink-0 items-center justify-center rounded-lg",
                                activo
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              <t.icon className="size-4" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold">
                                {t.titulo}
                              </span>
                              <span className="block text-xs leading-snug text-muted-foreground">
                                {t.detalle}
                              </span>
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </Campo>
                </div>
              </Card>

              <Card
                titulo="Precio y venta"
                ayuda="El precio se guarda en la lista de precios general. Podrás crear más listas (mayorista, por temporada) desde Precios."
                icon={RiMoneyDollarCircleLine}
              >
                <div className="grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Campo label="Precio de venta" hint="lista general">
                      <MoneyInput
                        id="precio"
                        value={precio}
                        onChange={setPrecio}
                        className="h-11 text-base"
                      />
                    </Campo>
                    {!esServicio ? (
                      <Campo label="Unidad">
                        <Select
                          value={unidadCodigo}
                          onChange={setUnidadCodigo}
                          options={UNIDADES_COMUNES.map((u) => ({
                            value: u.codigo,
                            label: `${u.nombre} (${u.symbol})`,
                          }))}
                        />
                      </Campo>
                    ) : null}
                  </div>

                  {!esServicio ? (
                    <p className="flex items-start gap-2 rounded-xl border bg-muted/30 p-3 text-xs text-muted-foreground">
                      <RiBox3Line className="mt-0.5 size-4 shrink-0" />
                      El <span className="font-medium text-foreground">stock</span> y el{" "}
                      <span className="font-medium text-foreground">costo</span> se cargan
                      al recibir mercadería en{" "}
                      <span className="font-medium text-foreground">Compras</span> (el costo
                      se promedia solo). El producto es solo el catálogo.
                    </p>
                  ) : null}

                  <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                    <Campo label="Código de barras" hint="opcional">
                      <div className="flex gap-2">
                        <div className="relative min-w-0 flex-1">
                          <RiBarcodeLine className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            value={barcode}
                            onChange={(e) => setBarcode(e.target.value)}
                            placeholder="7501234567890"
                            className="pl-9 font-mono"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="shrink-0"
                          disabled={genBarcode.isPending}
                          onClick={() => genBarcode.mutate()}
                          title="Generar código de barras interno (EAN-13)"
                        >
                          {genBarcode.isPending ? "…" : "Generar"}
                        </Button>
                      </div>
                    </Campo>
                    <Campo label="Tipo de código">
                      <Select
                        value={barcodeTipo}
                        onChange={(v) => setBarcodeTipo(v as TipoCodigoBarras)}
                        options={CODIGO_BARRAS_TIPOS.map((t) => ({
                          value: t.value,
                          label: t.label,
                        }))}
                      />
                    </Campo>
                  </div>
                </div>
              </Card>

              {esCombo ? (
                <Card
                  titulo="¿Qué incluye el combo?"
                  ayuda="Elige los productos y su cantidad."
                  icon={RiStackLine}
                >
                  {variantesDisponibles.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Primero crea productos sueltos para armar el combo.
                    </p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {variantesDisponibles.map((v) => {
                        const cant = combo[v.id] ?? 0
                        return (
                          <div
                            key={v.id}
                            className={cn(
                              "flex items-center gap-3 rounded-xl border p-2.5 transition-colors",
                              cant > 0 ? "border-primary bg-primary/5" : ""
                            )}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{v.etiqueta}</p>
                              <p className="font-mono text-xs text-muted-foreground">
                                {v.sku}
                              </p>
                            </div>
                            <Input
                              inputMode="decimal"
                              value={cant ? String(cant) : ""}
                              onChange={(e) => {
                                const n = parseFloat(e.target.value.replace(/[^\d.]/g, ""))
                                setCombo((prev) => ({
                                  ...prev,
                                  [v.id]: Number.isFinite(n) ? n : 0,
                                }))
                              }}
                              placeholder="0"
                              className="h-9 w-16 tabular-nums"
                            />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </Card>
              ) : null}
            </div>

            {/* ===== Panel lateral ===== */}
            <div className="flex flex-col gap-4">
              <Card titulo="Foto" ayuda="Se reconoce rápido en caja." icon={RiImageLine}>
                <ImageUpload value={imagenUrl} onChange={setImagenUrl} />
              </Card>

              <Card titulo="Organización" ayuda="Opcional." icon={RiFolder3Line}>
                <div className="grid gap-4">
                  <Campo label="Marca">
                    {nuevaMarca ? (
                      <QuickCreate
                        value={marcaNombre}
                        onChange={setMarcaNombre}
                        placeholder="Ej: Coca-Cola"
                        pending={mMarca.isPending}
                        error={(mMarca.error as ApiError)?.message}
                        onCancel={() => setNuevaMarca(false)}
                        onCreate={() => mMarca.mutate()}
                      />
                    ) : (
                      <SelectConAgregar
                        value={marcaId}
                        onChange={setMarcaId}
                        onAdd={() => setNuevaMarca(true)}
                        placeholder="Sin marca"
                        options={(marcas.data ?? []).map((m) => ({
                          value: m.id,
                          label: m.nombre,
                        }))}
                      />
                    )}
                  </Campo>

                  <Campo label="Grupo / categoría">
                    {nuevaCat ? (
                      <QuickCreate
                        value={catNombre}
                        onChange={setCatNombre}
                        placeholder="Ej: Bebidas"
                        pending={mCategoria.isPending}
                        error={(mCategoria.error as ApiError)?.message}
                        onCancel={() => setNuevaCat(false)}
                        onCreate={() => mCategoria.mutate()}
                      />
                    ) : (
                      <SelectConAgregar
                        value={categoriaId}
                        onChange={setCategoriaId}
                        onAdd={() => setNuevaCat(true)}
                        placeholder="Sin grupo"
                        options={(categorias.data ?? []).map((c) => ({
                          value: c.id,
                          label: c.nombre,
                        }))}
                      />
                    )}
                  </Campo>

                  <Campo
                    label="Impuesto"
                    hint={
                      (impuestos.data ?? []).length
                        ? "Normalmente IGV. Sin impuesto = venta sin IGV."
                        : "No hay impuestos. Créalos en Productos → Impuestos."
                    }
                  >
                    <Select
                      value={impuestoId}
                      onChange={setImpuestoId}
                      placeholder="Sin impuesto"
                      options={[
                        { value: "", label: "Sin impuesto" },
                        ...(impuestos.data ?? []).map((t) => ({
                          value: t.id,
                          label: `${t.nombre} (${t.codigo})`,
                        })),
                      ]}
                    />
                  </Campo>
                  <Campo
                    label="Código SUNAT del producto"
                    hint="Opcional (UNSPSC, Catálogo 25). Solo si emites factura y SUNAT te lo exige."
                  >
                    <Input
                      value={sunatProductCode}
                      onChange={(e) => setSunatProductCode(e.target.value)}
                      placeholder="Ej: 50202301"
                      className="h-11 font-mono"
                    />
                  </Campo>
                </div>
              </Card>
            </div>
          </div>
        </form>
      </div>

      <div className="sticky bottom-0 z-10 flex items-center justify-end gap-2 border-t bg-background/80 px-4 py-3 backdrop-blur-md md:px-6">
        <Button variant="ghost" onClick={() => router.push("/productos")}>
          Cancelar
        </Button>
        <Button
          id="btn-guardar-producto"
          onClick={enviar}
          disabled={!valido || guardar.isPending}
        >
          {guardar.isPending ? "Guardando…" : "Guardar producto"}
        </Button>
      </div>
    </>
  )
}

function SelectConAgregar({
  value,
  onChange,
  onAdd,
  placeholder,
  options,
}: {
  value: string
  onChange: (v: string) => void
  onAdd: () => void
  placeholder: string
  options: { value: string; label: string }[]
}) {
  return (
    <div className="flex gap-2">
      <Select
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        options={[{ value: "", label: placeholder }, ...options]}
      />
      <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={onAdd}>
        +
      </Button>
    </div>
  )
}

function QuickCreate({
  value,
  onChange,
  placeholder,
  pending,
  error,
  onCancel,
  onCreate,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  pending: boolean
  error?: string
  onCancel: () => void
  onCreate: () => void
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-muted/40 p-3">
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!value.trim() || pending}
          onClick={onCreate}
        >
          {pending ? "Creando…" : "Crear"}
        </Button>
      </div>
    </div>
  )
}
