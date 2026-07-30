import Link from "next/link"

import { siteConfig } from "@/lib/config/site"
import { GekkoMark } from "@/components/brand/gekko-logo"
import { RedirectIfAuthed } from "@/components/auth/session-guards"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RedirectIfAuthed>
      <div className="flex min-h-svh flex-col bg-muted/40 px-6 py-8">
        {/* Marca centrada arriba */}
        <header className="flex justify-center">
          <Link href="/" className="flex items-center gap-2">
            <GekkoMark className="size-7" />
            <span className="text-xl font-semibold tracking-tight">
              {siteConfig.name}
            </span>
          </Link>
        </header>

        {/* Contenido centrado */}
        <main className="flex flex-1 items-center justify-center py-16">
          <div className="w-full max-w-sm">{children}</div>
        </main>

        <footer className="flex justify-center">
          <Link
            href="/privacidad"
            className="text-sm text-primary hover:underline"
          >
            Política de privacidad
          </Link>
        </footer>
      </div>
    </RedirectIfAuthed>
  )
}
