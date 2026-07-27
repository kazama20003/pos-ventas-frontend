"use client"

import * as React from "react"
import { useTheme } from "next-themes"

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

type CredentialResponse = { credential?: string }

type GsiButtonConfig = {
  type?: "standard" | "icon"
  theme?: "outline" | "filled_blue" | "filled_black"
  size?: "large" | "medium" | "small"
  text?: "signin_with" | "signup_with" | "continue_with"
  shape?: "rectangular" | "pill"
  width?: number
  logo_alignment?: "left" | "center"
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (res: CredentialResponse) => void
            use_fedcm_for_prompt?: boolean
          }) => void
          renderButton: (parent: HTMLElement, options: GsiButtonConfig) => void
          prompt: () => void
        }
      }
    }
  }
}

const GSI_SRC = "https://accounts.google.com/gsi/client"

function cargarGsi(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve()
    const existente = document.querySelector<HTMLScriptElement>(
      `script[src="${GSI_SRC}"]`
    )
    if (existente) {
      existente.addEventListener("load", () => resolve())
      existente.addEventListener("error", () => reject())
      return
    }
    const s = document.createElement("script")
    s.src = GSI_SRC
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject()
    document.head.appendChild(s)
  })
}

/**
 * Botón oficial de Google (Google Identity Services). Devuelve el `idToken`
 * (credential) que el backend verifica en /identidad/auth/google y /onboarding.
 * Usa NEXT_PUBLIC_GOOGLE_CLIENT_ID (debe coincidir con el del backend).
 */
export function GoogleButton({
  onCredential,
  text = "continue_with",
}: {
  onCredential: (idToken: string) => void
  disabled?: boolean
  text?: GsiButtonConfig["text"]
}) {
  const { resolvedTheme } = useTheme()
  const contenedor = React.useRef<HTMLDivElement>(null)
  const cbRef = React.useRef(onCredential)
  cbRef.current = onCredential
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!CLIENT_ID) {
      setError("Falta configurar NEXT_PUBLIC_GOOGLE_CLIENT_ID")
      return
    }
    let cancelado = false

    cargarGsi()
      .then(() => {
        if (cancelado || !contenedor.current || !window.google) return
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (res) => {
            if (res.credential) cbRef.current(res.credential)
          },
          use_fedcm_for_prompt: true,
        })
        contenedor.current.innerHTML = ""
        window.google.accounts.id.renderButton(contenedor.current, {
          type: "standard",
          theme: resolvedTheme === "dark" ? "filled_black" : "outline",
          size: "large",
          text,
          shape: "pill",
          width: contenedor.current.offsetWidth || 320,
          logo_alignment: "left",
        })
      })
      .catch(() => setError("No se pudo cargar Google. Reintenta."))

    return () => {
      cancelado = true
    }
  }, [resolvedTheme, text])

  if (error) {
    return (
      <p className="rounded-xl bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
        {error}
      </p>
    )
  }

  return <div ref={contenedor} className="flex w-full justify-center" />
}
