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
}

export type VarianteProducto = {
  id: string
  sku: string
  nombre: string
  cost: string | number
  unidadMedidaId: string
  unitOfMeasure?: UnidadMedida
  taxes?: { tax: Impuesto }[]
}

export type Producto = {
  id: string
  codigo: string
  nombre: string
  descripcion?: string | null
  kind: TipoProducto
  categories?: { category: Categoria }[]
  variants: VarianteProducto[]
}

// ---- DTOs de creación (espejo del backend) ----

export type CrearVarianteDto = {
  unidadMedidaId: string
  sku: string
  nombre: string
  cost?: number
  isStockTracked?: boolean
  allowNegativeStock?: boolean
  impuestoIds?: string[]
}

export type CrearProductoDto = {
  codigo: string
  nombre: string
  descripcion?: string
  kind?: TipoProducto
  categoriaIds?: string[]
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

export const listarProductos = () =>
  authedFetch<Producto[]>("/catalogo/productos")

export const crearProducto = (dto: CrearProductoDto) =>
  authedFetch<Producto>("/catalogo/productos", { method: "POST", body: dto })

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
