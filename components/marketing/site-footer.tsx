import Link from "next/link"

import { siteConfig } from "@/lib/config/site"
import { GekkoLogo } from "@/components/brand/gekko-logo"

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <Link href="/" aria-label="Inicio">
          <GekkoLogo />
        </Link>
        <p className="text-xs text-muted-foreground">
          © {siteConfig.name} · Punto de venta para retail en Perú.
        </p>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <Link href="#" className="hover:text-foreground">Términos</Link>
          <Link href="#" className="hover:text-foreground">Privacidad</Link>
        </div>
      </div>
    </footer>
  )
}
