import Link from "next/link"

import { marketingNav } from "@/lib/config/navigation"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { GekkoLogo } from "@/components/brand/gekko-logo"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" aria-label="Inicio">
          <GekkoLogo />
        </Link>

        <nav className="hidden flex-1 items-center gap-6 md:flex">
          {marketingNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.title}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" render={<Link href="/login" />}>
            Ingresar
          </Button>
          <Button size="sm" render={<Link href="/register" />}>
            Empezar gratis
          </Button>
        </div>
      </div>
    </header>
  )
}
