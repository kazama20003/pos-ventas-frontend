import { authedFetch } from "./authed"
import type { EstadoRegistro } from "./organizacion"

/* ------------------------------------------------------------------ */
/* Tipos + API                                                        */
/* ------------------------------------------------------------------ */

export type RolFull = {
  id: string
  codigo: string
  nombre: string
  estado: EstadoRegistro
  permisos: string[]
}

/** GET /roles — incluye estado y claves de permiso asignadas. */
export const listarRolesDetalle = () => authedFetch<RolFull[]>("/roles")

export type CrearRolDto = {
  codigo: string
  nombre: string
  descripcion?: string
  permisos?: string[]
}

export const crearRol = (dto: CrearRolDto) =>
  authedFetch<{ id: string; codigo: string; nombre: string; permisos: string[] }>(
    "/roles",
    { method: "POST", body: dto }
  )

/** PUT /roles/:rolId/permisos — reemplaza el set completo de permisos. */
export const asignarPermisos = (rolId: string, permisos: string[]) =>
  authedFetch<{ id: string; permisos: string[] }>(
    `/roles/${rolId}/permisos`,
    { method: "PUT", body: { permisos } }
  )

/* ------------------------------------------------------------------ */
/* Presentación del catálogo de permisos.                             */
/* Los DATOS (claves + descripciones) vienen del backend vía          */
/* GET /roles/catalogo-permisos. Aquí solo vive el LAYOUT: en qué     */
/* orden se muestran los módulos, sus etiquetas legibles y qué claves */
/* de operador se ocultan al tenant. Cero datos de permisos.          */
/* ------------------------------------------------------------------ */

export type PermisoDef = { clave: string; descripcion: string }

/** Shape del catálogo que devuelve el backend (GET /roles/catalogo-permisos). */
export type PermisoCatalogo = {
  clave: string
  resource: string
  action: string
  descripcion: string
}

export const listarCatalogoPermisos = () =>
  authedFetch<PermisoCatalogo[]>("/roles/catalogo-permisos")

/** Permisos de operador/infra SaaS — no relevantes para el tenant. */
const OCULTOS = new Set(["plataforma.gestionar", "uso.registrar", "webhooks.gestionar"])

export type GrupoPermisos = {
  resource: string
  label: string
  permisos: PermisoDef[]
}

/** Módulos en orden de negocio (POS primero). El resto se anexa al final. */
const ORDEN_MODULOS: { resource: string; label: string }[] = [
  { resource: "ventas", label: "Ventas" },
  { resource: "caja", label: "Caja" },
  { resource: "catalogo", label: "Productos y catálogo" },
  { resource: "inventario", label: "Inventario" },
  { resource: "clientes", label: "Clientes" },
  { resource: "cobros", label: "Cobros" },
  { resource: "proveedores", label: "Proveedores" },
  { resource: "compras", label: "Compras" },
  { resource: "facturacion", label: "Facturación" },
  { resource: "pagos", label: "Pagos" },
  { resource: "reportes", label: "Reportes" },
  { resource: "empresas", label: "Empresas" },
  { resource: "sucursales", label: "Sucursales" },
  { resource: "usuarios", label: "Usuarios" },
  { resource: "roles", label: "Roles" },
  { resource: "notificaciones", label: "Notificaciones" },
  { resource: "archivos", label: "Archivos" },
  { resource: "suscripcion", label: "Suscripción" },
]

/**
 * Agrupa el catálogo del backend por módulo, en orden de negocio y sin las
 * claves de operador/infra. Los módulos no listados en ORDEN_MODULOS se anexan
 * al final con su `resource` como etiqueta (para no perder permisos nuevos).
 */
export function agruparPermisos(entradas: PermisoCatalogo[]): GrupoPermisos[] {
  const visibles = entradas.filter((p) => !OCULTOS.has(p.clave))
  const resources = [...new Set(visibles.map((p) => p.resource))]
  const orden = [
    ...ORDEN_MODULOS,
    ...resources
      .filter((r) => !ORDEN_MODULOS.some((m) => m.resource === r))
      .map((r) => ({ resource: r, label: r })),
  ]
  return orden
    .map((m) => ({
      resource: m.resource,
      label: m.label,
      permisos: visibles
        .filter((p) => p.resource === m.resource)
        .map((p) => ({ clave: p.clave, descripcion: p.descripcion })),
    }))
    .filter((g) => g.permisos.length > 0)
}

export const clavesVisiblesDe = (grupos: GrupoPermisos[]) =>
  grupos.flatMap((g) => g.permisos.map((p) => p.clave))
