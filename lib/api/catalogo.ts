import { authedFetch } from "./authed"

export type Afectacion =
  | "GRAVADO"
  | "EXONERADO"
  | "INAFECTO"
  | "GRATUITO"
  | "EXPORTACION"

export type TipoProducto = "ESTANDAR" | "SERVICIO" | "PAQUETE"

export type UnidadMedida = {
  id: string
  codigo: string
  sunatCode: string
  nombre: string
  symbol: string
  decimals: number
}

export type Impuesto = {
  id: string
  codigo: string
  nombre: string
  sunatTributeCode?: string | null
  affectation: Afectacion
  rate: string | number
  includedInPrice: boolean
}

export type Categoria = {
  id: string
  codigo: string
  nombre: string
  descripcion?: string | null
  padreId?: string | null
  sortOrder?: number
}

export type Marca = {
  id: string
  codigo: string
  nombre: string
}

export type TipoCodigoBarras =
  | "EAN13"
  | "EAN8"
  | "UPC_A"
  | "CODIGO128"
  | "QR"
  | "PLU"
  | "INTERNO"

export type CodigoBarras = {
  id: string
  codigo: string
  tipo: TipoCodigoBarras
  isPrimary: boolean
}

export type PrecioItem = {
  id: string
  monto: string | number
  minQuantity: string | number
}

export type SaldoInventario = {
  id: string
  almacenId: string
  enStock: string | number
  available: string | number
  reserved: string | number
  warehouse?: { id: string; codigo: string; nombre: string }
}

export type VarianteProducto = {
  id: string
  sku: string
  nombre: string
  cost: string | number
  unidadMedidaId: string
  unitOfMeasure?: UnidadMedida
  taxes?: { tax: Impuesto }[]
  barcodigos?: CodigoBarras[]
  prices?: PrecioItem[]
  saldosInventario?: SaldoInventario[]
}

export type ComponenteCombo = {
  id: string
  componentVariantId: string
  cantidad: string | number
  componentVariant?: VarianteProducto
}

export type Producto = {
  id: string
  codigo: string
  nombre: string
  descripcion?: string | null
  imagenUrl?: string | null
  marcaId?: string | null
  brand?: Marca | null
  kind: TipoProducto
  categories?: { category: Categoria }[]
  variants: VarianteProducto[]
  bundleItems?: ComponenteCombo[]
}

// ---- DTOs de creación (espejo del backend) ----

export type CodigoBarrasDto = { codigo: string; tipo?: TipoCodigoBarras }

export type CrearVarianteDto = {
  unidadMedidaId: string
  /** Opcional: si se omite, el backend lo deriva del código del producto. */
  sku?: string
  nombre: string
  cost?: number
  /** Precio de venta al público. */
  precio?: number
  barcode?: string
  barcodeTipo?: TipoCodigoBarras
  /** Múltiples códigos de barras (el primero queda como principal). */
  barcodes?: CodigoBarrasDto[]
  atributos?: Record<string, string>
  stockInicial?: number
  isStockTracked?: boolean
  allowNegativeStock?: boolean
  impuestoIds?: string[]
}

export type ActualizarVarianteDto = {
  nombre?: string
  sku?: string
  unidadMedidaId?: string
  cost?: number
  precio?: number
  atributos?: Record<string, string>
  impuestoIds?: string[]
}

export const agregarVariante = (productoId: string, dto: CrearVarianteDto) =>
  authedFetch<Producto>(`/catalogo/productos/${productoId}/variantes`, {
    method: "POST",
    body: dto,
  })

export const actualizarVariante = (
  productoId: string,
  varianteId: string,
  dto: ActualizarVarianteDto
) =>
  authedFetch<Producto>(
    `/catalogo/productos/${productoId}/variantes/${varianteId}`,
    { method: "PATCH", body: dto }
  )

export const archivarVariante = (productoId: string, varianteId: string) =>
  authedFetch<{ id: string; estado: string }>(
    `/catalogo/productos/${productoId}/variantes/${varianteId}`,
    { method: "DELETE" }
  )

export const agregarBarcode = (varianteId: string, dto: CodigoBarrasDto) =>
  authedFetch<Producto>(`/catalogo/variantes/${varianteId}/barcodes`, {
    method: "POST",
    body: dto,
  })

export const quitarBarcode = (varianteId: string, barcodeId: string) =>
  authedFetch<Producto>(
    `/catalogo/variantes/${varianteId}/barcodes/${barcodeId}`,
    { method: "DELETE" }
  )

export type ComponenteComboDto = {
  varianteId: string
  cantidad: number
}

export type CrearProductoDto = {
  /** Opcional: si se omite, el backend genera uno único a partir del nombre. */
  codigo?: string
  nombre: string
  descripcion?: string
  kind?: TipoProducto
  marcaId?: string
  imagenUrl?: string
  categoriaIds?: string[]
  almacenId?: string
  componentes?: ComponenteComboDto[]
  variantes: CrearVarianteDto[]
}

export type CrearUnidadDto = {
  codigo: string
  sunatCode: string
  nombre: string
  symbol: string
  decimals?: number
}

// ---- Endpoints ----

export type ListarProductosParams = {
  q?: string
  categoriaId?: string
  marcaId?: string
  conStock?: boolean
  page?: number
  pageSize?: number
}

export type ListaProductos = {
  items: Producto[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export const listarProductos = (params: ListarProductosParams = {}) => {
  const qs = new URLSearchParams()
  if (params.q) qs.set("q", params.q)
  if (params.categoriaId) qs.set("categoriaId", params.categoriaId)
  if (params.marcaId) qs.set("marcaId", params.marcaId)
  if (params.conStock) qs.set("conStock", "true")
  if (params.page) qs.set("page", String(params.page))
  if (params.pageSize) qs.set("pageSize", String(params.pageSize))
  const s = qs.toString()
  return authedFetch<ListaProductos>(
    `/catalogo/productos${s ? `?${s}` : ""}`
  )
}

export const obtenerProducto = (id: string) =>
  authedFetch<Producto>(`/catalogo/productos/${id}`)

export const buscarProductoPorBarcode = (codigo: string) =>
  authedFetch<Producto>(`/catalogo/productos/barcode/${encodeURIComponent(codigo)}`)

export const generarBarcodeInterno = () =>
  authedFetch<{ codigo: string; tipo: TipoCodigoBarras }>(
    "/catalogo/barcode-interno"
  )

export const crearProducto = (dto: CrearProductoDto) =>
  authedFetch<Producto>("/catalogo/productos", { method: "POST", body: dto })

export type ActualizarProductoDto = {
  codigo?: string
  nombre?: string
  descripcion?: string
  kind?: TipoProducto
  marcaId?: string
  imagenUrl?: string
  categoriaIds?: string[]
  componentes?: ComponenteComboDto[]
  unidadMedidaId?: string
  cost?: number
  precio?: number
  barcode?: string
  barcodeTipo?: TipoCodigoBarras
  impuestoIds?: string[]
}

export const actualizarProducto = (id: string, dto: ActualizarProductoDto) =>
  authedFetch<Producto>(`/catalogo/productos/${id}`, { method: "PATCH", body: dto })

export const archivarProducto = (id: string) =>
  authedFetch<{ id: string; estado: string }>(`/catalogo/productos/${id}`, {
    method: "DELETE",
  })

// ---- Importación masiva ----

export type ImportarProductoFila = {
  nombre: string
  codigo?: string
  precio?: number
  costo?: number
  stockInicial?: number
  barcode?: string
  unidad?: string
  categoria?: string
  marca?: string
  impuesto?: string
}

export type ImportarProductosDto = {
  filas: ImportarProductoFila[]
  almacenId?: string
}

export type ImportarResultado = {
  total: number
  creados: number
  errores: { fila: number; nombre: string; error: string }[]
}

export const importarProductos = (dto: ImportarProductosDto) =>
  authedFetch<ImportarResultado>("/catalogo/productos/importar", {
    method: "POST",
    body: dto,
  })

export const listarUnidades = () =>
  authedFetch<UnidadMedida[]>("/catalogo/unidades-medida")

export const crearUnidad = (dto: CrearUnidadDto) =>
  authedFetch<UnidadMedida>("/catalogo/unidades-medida", { method: "POST", body: dto })

export const listarImpuestos = () =>
  authedFetch<Impuesto[]>("/catalogo/impuestos")

export type CrearCategoriaDto = {
  codigo: string
  nombre: string
  descripcion?: string
  padreId?: string
  sortOrder?: number
}

export const listarCategorias = () =>
  authedFetch<Categoria[]>("/catalogo/categorias")

export const crearCategoria = (dto: CrearCategoriaDto) =>
  authedFetch<Categoria>("/catalogo/categorias", { method: "POST", body: dto })

export type ActualizarCategoriaDto = {
  codigo?: string
  nombre?: string
  descripcion?: string
  padreId?: string
  sortOrder?: number
}

export const actualizarCategoria = (id: string, dto: ActualizarCategoriaDto) =>
  authedFetch<Categoria>(`/catalogo/categorias/${id}`, { method: "PATCH", body: dto })

export const archivarCategoria = (id: string) =>
  authedFetch<{ id: string; estado: string }>(`/catalogo/categorias/${id}`, {
    method: "DELETE",
  })

export type ActualizarUnidadDto = {
  nombre?: string
  symbol?: string
  decimals?: number
}

export const actualizarUnidad = (id: string, dto: ActualizarUnidadDto) =>
  authedFetch<UnidadMedida>(`/catalogo/unidades-medida/${id}`, {
    method: "PATCH",
    body: dto,
  })

export const archivarUnidad = (id: string) =>
  authedFetch<{ id: string; estado: string }>(`/catalogo/unidades-medida/${id}`, {
    method: "DELETE",
  })

// ---- Inventario: ajuste de stock + kardex ----

export type TipoAjusteStock = "ENTRADA" | "SALIDA"

export type AjustarStockDto = {
  almacenId: string
  varianteId: string
  tipo: TipoAjusteStock
  cantidad: number
  costoUnitario?: number
  motivo?: string
}

export const ajustarStock = (dto: AjustarStockDto) =>
  authedFetch<{ id: string; enStock: string | number; available: string | number }>(
    "/inventario/ajustes",
    { method: "POST", body: dto }
  )

export type MovimientoKardex = {
  id: string
  movementType: string
  cantidad: string | number
  costoUnitario?: string | number | null
  referenciaType: string
  notas?: string | null
  occurredAt: string
  warehouse?: { id: string; codigo: string; nombre: string }
}

export const obtenerKardex = (varianteId: string, almacenId?: string) => {
  const qs = almacenId ? `?almacenId=${encodeURIComponent(almacenId)}` : ""
  return authedFetch<MovimientoKardex[]>(
    `/inventario/kardex/${varianteId}${qs}`
  )
}

// ---- Marcas ----

export const listarMarcas = () => authedFetch<Marca[]>("/catalogo/marcas")

export type CrearMarcaDto = { codigo?: string; nombre: string }

export const crearMarca = (dto: CrearMarcaDto) =>
  authedFetch<Marca>("/catalogo/marcas", { method: "POST", body: dto })

export const actualizarMarca = (id: string, nombre: string) =>
  authedFetch<Marca>(`/catalogo/marcas/${id}`, {
    method: "PATCH",
    body: { nombre },
  })

export const archivarMarca = (id: string) =>
  authedFetch<{ id: string; estado: string }>(`/catalogo/marcas/${id}`, {
    method: "DELETE",
  })
