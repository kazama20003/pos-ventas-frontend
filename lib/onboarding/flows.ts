import {
  RiBillLine,
  RiCashLine,
  RiCommunityLine,
  RiPriceTag3Line,
  RiSafe2Line,
  RiShoppingCart2Line,
  RiStore2Line,
  RiTruckLine,
  type RemixiconComponentType,
} from "@remixicon/react"

/**
 * Config declarativa (frontend) de los flujos de onboarding contextual.
 * El backend deriva el estado por eventos reales; aquí solo vive la capa
 * de presentación: textos orientados a acción, icono, CTA y coach-mark.
 *
 * Para agregar un paso nuevo: definirlo en el backend (definiciones+hechos)
 * y añadir su entrada aquí bajo el flowKey correspondiente.
 */

export type ConfigPaso = {
  /** Título humano, corto y orientado a acción. */
  titulo: string
  /** Descripción de una línea. */
  descripcion: string
  /** Texto del botón de acción. */
  cta: string
  icono: RemixiconComponentType
  /** Ruta a la que lleva el CTA (fallback si el backend no manda `vista`). */
  vista?: string
  /** Selector CSS para el coach-mark contextual (driver.js), opcional. */
  tourSelector?: string
}

export type ConfigFlujo = {
  titulo: string
  pasos: Record<string, ConfigPaso>
}

export const FLUJOS_CONFIG: Record<string, ConfigFlujo> = {
  "puesta-en-marcha": {
    titulo: "Puesta en marcha",
    pasos: {
      empresa: {
        titulo: "Completa los datos de tu empresa",
        descripcion: "RUC, razón social y logo para tus comprobantes.",
        cta: "Configurar empresa",
        icono: RiCommunityLine,
        vista: "/configuracion",
        tourSelector: "#seccion-empresa",
      },
      sucursal: {
        titulo: "Crea tu primera sucursal",
        descripcion: "El local desde donde vas a vender.",
        cta: "Crear sucursal",
        icono: RiStore2Line,
        vista: "/sucursales",
        tourSelector: "#btn-nueva-sucursal",
      },
      caja: {
        titulo: "Registra una caja",
        descripcion: "El punto de cobro de tu sucursal.",
        cta: "Registrar caja",
        icono: RiCashLine,
        vista: "/sucursales",
        tourSelector: "#lista-sucursales",
      },
      producto: {
        titulo: "Crea tu primer producto",
        descripcion: "Un producto o servicio para empezar a vender.",
        cta: "Crear producto",
        icono: RiPriceTag3Line,
        vista: "/productos/nuevo",
        tourSelector: "#btn-guardar-producto",
      },
    },
  },
  "primera-venta": {
    titulo: "Tu primera venta",
    pasos: {
      // Solo aparece si el negocio vende producto físico (el backend arma el
      // flujo según el tipo de negocio; servicios no pasan por aquí).
      stock: {
        titulo: "Dale stock a tu producto",
        descripcion: "Registra a tu proveedor y una compra para tener inventario.",
        cta: "Registrar compra",
        icono: RiTruckLine,
        vista: "/compras",
        tourSelector: "#campo-proveedor",
      },
      "abrir-caja": {
        titulo: "Abre tu caja",
        descripcion: "Inicia el turno con tu fondo para poder cobrar.",
        cta: "Abrir caja",
        icono: RiSafe2Line,
        vista: "/caja",
        tourSelector: "#selector-caja",
      },
      vender: {
        titulo: "Haz tu primera venta",
        descripcion: "Agrega productos, cobra y listo.",
        cta: "Ir a vender",
        icono: RiShoppingCart2Line,
        vista: "/ventas",
        tourSelector: "#buscador-productos",
      },
      comprobante: {
        titulo: "Emite tu primer comprobante electrónico",
        descripcion: "Envía una boleta o factura a SUNAT.",
        cta: "Ir a facturación",
        icono: RiBillLine,
        vista: "/facturacion",
        tourSelector: "#btn-nueva-serie",
      },
    },
  },
}

/** Config de presentación de un paso; null si no está declarado aquí. */
export function configDePaso(
  flowKey: string,
  stepKey: string,
): ConfigPaso | null {
  return FLUJOS_CONFIG[flowKey]?.pasos[stepKey] ?? null
}

/** Título humano de un flujo (fallback al del backend si no existe). */
export function tituloDeFlujo(flowKey: string): string | null {
  return FLUJOS_CONFIG[flowKey]?.titulo ?? null
}
