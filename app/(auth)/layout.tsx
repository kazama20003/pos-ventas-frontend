import Link from "next/link"

import { siteConfig } from "@/lib/config/site"
import { GekkoMark } from "@/components/brand/gekko-logo"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Panel de marca */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div
          aria-hidden
          className="absolute inset-0 opacity-20 [background:radial-gradient(circle_at_20%_20%,white,transparent_40%),radial-gradient(circle_at_80%_60%,white,transparent_35%)]"
        />
        <Link href="/" className="relative flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <GekkoMark className="size-5" />
          </span>
          <span className="text-lg font-semibold">{siteConfig.name}</span>
        </Link>
        <div className="relative space-y-3">
          <h2 className="text-3xl font-semibold leading-tight">
            Vende más rápido, controla todo tu negocio.
          </h2>
          <p className="max-w-md text-primary-foreground/80">
            {siteConfig.description}
          </p>
        </div>
        <p className="relative text-sm text-primary-foreground/60">
          © {siteConfig.name} — Todos los derechos reservados.
        </p>
      </div>

      {/* Formulario */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-10">
        <Link
          href="/"
          className="mb-8 flex items-center gap-2 lg:hidden"
        >
          <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GekkoMark className="size-5" />
          </span>
          <span className="text-lg font-semibold">{siteConfig.name}</span>
        </Link>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}
