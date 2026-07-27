import Link from "next/link"
import {
  RiShoppingCart2Line,
  RiArchiveLine,
  RiCashLine,
  RiFileTextLine,
  RiBarChart2Line,
  RiCloudLine,
  RiArrowRightLine,
} from "@remixicon/react"

import { siteConfig } from "@/lib/config/site"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const features = [
  { icon: RiShoppingCart2Line, title: "Ventas rápidas", desc: "Cobra en segundos con soporte para código de barras y venta por peso." },
  { icon: RiArchiveLine, title: "Inventario en tiempo real", desc: "Stock por sucursal, lotes, series y transferencias entre almacenes." },
  { icon: RiCashLine, title: "Control de caja", desc: "Apertura, cierre y arqueo con trazabilidad completa de cada turno." },
  { icon: RiFileTextLine, title: "Facturación electrónica", desc: "Boletas y facturas SUNAT listas para emitir, con series y certificados." },
  { icon: RiBarChart2Line, title: "Reportes claros", desc: "Analítica de ventas, márgenes y productos top exportable al instante." },
  { icon: RiCloudLine, title: "Multi-sucursal en la nube", desc: "Opera varias tiendas y terminales, incluso sin conexión." },
]

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section id="producto" className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.15] [background:radial-gradient(60%_50%_at_50%_0%,var(--color-primary),transparent)]"
        />
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <span className="inline-flex items-center rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
            Punto de venta para retail · Perú
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
            El punto de venta que hace crecer tu negocio
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            {siteConfig.description}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" render={<Link href="/register" />}>
              Empezar gratis
              <RiArrowRightLine />
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/dashboard" />}>
              Ver demo
            </Button>
          </div>
        </div>
      </section>

      {/* Funciones */}
      <section id="funciones" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold">Todo lo que tu tienda necesita</h2>
          <p className="mt-3 text-muted-foreground">
            Una sola plataforma para vender, controlar el stock y cumplir con SUNAT.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title}>
              <CardHeader>
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="size-6" />
                </div>
                <CardTitle className="mt-3">{f.title}</CardTitle>
                <CardDescription>{f.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="precios" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground sm:px-12">
          <h2 className="text-3xl font-semibold sm:text-4xl">
            Empieza a vender hoy mismo
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
            Prueba {siteConfig.name} sin tarjeta de crédito. Configúralo en minutos.
          </p>
          <div className="mt-8 flex justify-center" id="contacto">
            <Button
              size="lg"
              variant="secondary"
              render={<Link href="/register" />}
            >
              Crear mi cuenta
              <RiArrowRightLine />
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
