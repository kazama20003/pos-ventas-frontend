export const siteConfig = {
  name: "Gekko",
  shortName: "Gekko",
  version: "v1.0",
  description:
    "Punto de venta multi-sucursal para retail: ventas, inventario, caja y facturación electrónica SUNAT.",
  url: "https://gekko.pe",
} as const

export type SiteConfig = typeof siteConfig
