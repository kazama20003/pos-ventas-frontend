"use client"

import * as React from "react"
import { RiImageLine, RiLoader4Line, RiUploadCloud2Line } from "@remixicon/react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ApiError } from "@/lib/api/client"
import { subirImagen } from "@/lib/api/archivos"

/**
 * Selector de imagen de producto. Sube el archivo al object storage (presigned)
 * y devuelve la URL pública vía onChange. Si el almacenamiento no está
 * configurado (503), cae al modo "pegar enlace".
 */
export function ImageUpload({
  value,
  onChange,
}: {
  value: string
  onChange: (url: string) => void
}) {
  const [subiendo, setSubiendo] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = "" // permite re-elegir el mismo archivo
    if (!file) return
    setError(null)
    setSubiendo(true)
    try {
      const url = await subirImagen(file)
      onChange(url)
    } catch (err) {
      const msg = (err as ApiError | Error).message
      setError(
        (err as ApiError)?.status === 503
          ? "Subida no disponible aún: pega el enlace de la imagen abajo."
          : msg || "No se pudo subir la imagen"
      )
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div className="flex items-start gap-4">
      <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-muted/40">
        {subiendo ? (
          <RiLoader4Line className="size-6 animate-spin text-muted-foreground" />
        ) : value.trim() ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value.trim()} alt="Vista previa" className="size-full object-cover" />
        ) : (
          <RiImageLine className="size-6 text-muted-foreground" />
        )}
      </div>
      <div className="grid flex-1 gap-2">
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed py-3 text-sm text-muted-foreground transition-colors hover:bg-muted/40">
          <RiUploadCloud2Line className="size-4" />
          {subiendo ? "Subiendo…" : "Subir imagen"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={subiendo}
            onChange={onFile}
          />
        </label>
        <div className="grid gap-1">
          <Label htmlFor="imagenUrl" className="text-xs text-muted-foreground">
            o pega un enlace
          </Label>
          <Input
            id="imagenUrl"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://…/foto.jpg"
          />
        </div>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
    </div>
  )
}
