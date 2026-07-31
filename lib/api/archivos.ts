import { authedFetch } from "./authed"

export type PresignRespuesta = {
  storageKey: string
  uploadUrl: string
  publicUrl: string
  expiraEn: number
  maxBytes: number
}

const presign = (body: {
  fileName: string
  contentType: string
  purpose?: string
}) =>
  authedFetch<PresignRespuesta>("/archivos/presign", {
    method: "POST",
    body,
  })

const confirmar = (body: {
  storageKey: string
  fileName: string
  contentType: string
  byteSize: number
  checksumSha256: string
  purpose?: string
}) =>
  authedFetch<{ fileId: string; publicUrl: string }>("/archivos/confirmar", {
    method: "POST",
    body,
  })

/** SHA-256 en hexadecimal del archivo (lo exige el backend al confirmar). */
async function sha256Hex(file: File): Promise<string> {
  const buf = await file.arrayBuffer()
  const hash = await crypto.subtle.digest("SHA-256", buf)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

/**
 * Sube una imagen al object storage en 3 pasos: pide URL prefirmada, sube el
 * archivo DIRECTO al bucket (no pasa por nuestro backend) y confirma. Devuelve
 * la URL pública para guardar en `producto.imagenUrl`.
 */
export async function subirImagen(
  file: File,
  purpose = "product_image"
): Promise<string> {
  if (!file.type.startsWith("image/"))
    throw new Error("El archivo debe ser una imagen")

  const { storageKey, uploadUrl, publicUrl, maxBytes } = await presign({
    fileName: file.name,
    contentType: file.type,
    purpose,
  })

  if (file.size > maxBytes)
    throw new Error(
      `La imagen supera el tamaño máximo (${Math.round(maxBytes / 1024 / 1024)} MB)`
    )

  const put = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  })
  if (!put.ok) throw new Error("No se pudo subir la imagen al almacenamiento")

  const checksumSha256 = await sha256Hex(file)
  await confirmar({
    storageKey,
    fileName: file.name,
    contentType: file.type,
    byteSize: file.size,
    checksumSha256,
    purpose,
  })

  return publicUrl
}
