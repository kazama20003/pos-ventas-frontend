"use client"

import * as React from "react"
import { useTheme } from "next-themes"

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

type CredentialResponse = { credential?: string }

type InitConfig = {
  client_id: string
  callback: (res: CredentialResponse) => void
  login_hint?: string
  use_fedcm_for_prompt?: boolean
  use_fedcm_for_button?: boolean
}

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
          initialize: (config: InitConfig) => void
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
    const existente = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`)
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
 * Hook para disparar Google Sign-In desde un botón propio (One Tap / prompt).
 * Devuelve el idToken (credential) en `onCredential`. `prompt(hint?)` acepta un
 * correo como login_hint. Requiere NEXT_PUBLIC_GOOGLE_CLIENT_ID.
 */
export function useGooglePrompt(onCredential: (idToken: string) => void) {
  const [listo, setListo] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const cbRef = React.useRef(onCredential)
  cbRef.current = onCredential
  const hintRef = React.useRef<string | undefined>(undefined)

  const iniciar = React.useCallback((login_hint?: string) => {
    if (!CLIENT_ID || !window.google) return
    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: (res) => {
        if (res.credential) cbRef.current(res.credential)
      },
      login_hint,
      use_fedcm_for_prompt: false,
      use_fedcm_for_button: false,
    })
    hintRef.current = login_hint
  }, [])

  React.useEffect(() => {
    if (!CLIENT_ID) {
      setError("Falta configurar NEXT_PUBLIC_GOOGLE_CLIENT_ID")
      return
    }
    let cancelado = false
    cargarGsi()
      .then(() => {
        if (cancelado) return
        iniciar()
        setListo(true)
      })
      .catch(() => setError("No se pudo cargar Google. Reintenta."))
    return () => {
      cancelado = true
    }
  }, [iniciar])

  const prompt = React.useCallback(
    (hint?: string) => {
      if (!window.google) return
      if (hint !== undefined && hint !== hintRef.current) iniciar(hint)
      window.google.accounts.id.prompt()
    },
    [iniciar]
  )

  return { prompt, listo, error }
}

/**
 * Botón oficial de Google (fallback cuando One Tap no se muestra).
 * Su callback entrega el idToken que el backend verifica.
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
          use_fedcm_for_prompt: false,
          use_fedcm_for_button: false,
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
