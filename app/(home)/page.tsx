import Link from "next/link"
import Image from "next/image"
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
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HeroVideoCard } from "@/components/marketing/hero-video-card"
import { MotionIntro } from "@/components/marketing/motion-intro"

const features = [
  { icon: RiShoppingCart2Line, title: "Ventas rapidas", desc: "Cobra en segundos con soporte para codigo de barras y venta por peso." },
  { icon: RiArchiveLine, title: "Inventario en tiempo real", desc: "Stock por sucursal, lotes, series y transferencias entre almacenes." },
  { icon: RiCashLine, title: "Control de caja", desc: "Apertura, cierre y arqueo con trazabilidad completa de cada turno." },
  { icon: RiFileTextLine, title: "Facturacion electronica", desc: "Boletas y facturas SUNAT listas para emitir, con series y certificados." },
  { icon: RiBarChart2Line, title: "Reportes claros", desc: "Analitica de ventas, margenes y productos top exportable al instante." },
  { icon: RiCloudLine, title: "Multi-sucursal en la nube", desc: "Opera varias tiendas y terminales, incluso sin conexion." },
]

export default function LandingPage() {
  return (
    <>
      <section id="producto" className="relative isolate h-[118svh] min-h-[708px] overflow-hidden bg-[#111] text-white">
        <Image
          src="/gekko-hero.jpg"
          alt="Venta en una tienda utilizando un punto de venta digital"
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-center"
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-black/25" />

        <div className="absolute inset-x-0 top-0 flex h-svh min-h-[600px] items-end px-4 pb-6 sm:px-8 sm:pb-7 lg:px-12">
          <h1 className="max-w-[820px] text-[clamp(2.5rem,4.15vw,4.9rem)] font-normal leading-[1.02] tracking-[-0.045em] text-white 2xl:max-w-[900px]">
            Hacemos cada venta visible, medible y rentable. Tu tienda crece con decisiones claras.
          </h1>
          <HeroVideoCard />
        </div>
      </section>

      <MotionIntro />

      <section className="relative z-20 mx-auto max-w-6xl bg-background px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold">Todo lo que tu tienda necesita</h2>
          <p className="mt-3 text-muted-foreground">
            Una sola plataforma para vender, controlar el stock y cumplir con SUNAT.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <feature.icon className="size-6" />
                </div>
                <CardTitle className="mt-3">{feature.title}</CardTitle>
                <CardDescription>{feature.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section id="precios" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground sm:px-12">
          <h2 className="text-3xl font-semibold sm:text-4xl">Empieza a vender hoy mismo</h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
            Prueba {siteConfig.name} sin tarjeta de credito. Configuralo en minutos.
          </p>
          <div className="mt-8 flex justify-center" id="contacto">
            <Button size="lg" variant="secondary" render={<Link href="/register" />}>
              Crear mi cuenta
              <RiArrowRightLine />
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
