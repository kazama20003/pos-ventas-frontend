// Validaciones de campos comunes (documento de identidad, contacto).
// Compartidas entre proveedores y clientes para no duplicar reglas.

/** Prefijos válidos de RUC peruano: 10/15/16/17 (natural), 20 (jurídica). */
const PREFIJOS_RUC = ["10", "15", "16", "17", "20"]

export function maxLargoDocumento(tipo: string): number {
  if (tipo === "RUC") return 11
  if (tipo === "DNI") return 8
  return 20
}

/** Deja solo los caracteres permitidos según el tipo y recorta al largo máximo. */
export function limpiarDocumento(tipo: string, valor: string): string {
  const soloDigitos = tipo === "RUC" || tipo === "DNI"
  return valor
    .replace(soloDigitos ? /[^0-9]/g : /[^0-9A-Za-z]/g, "")
    .slice(0, maxLargoDocumento(tipo))
}

/** Mensaje de error si el documento no es válido, o null. Vacío = válido (opcional). */
export function validarDocumento(tipo: string, num: string): string | null {
  const v = num.trim()
  if (!v) return null
  if (tipo === "RUC") {
    if (!/^\d{11}$/.test(v)) return "El RUC debe tener 11 dígitos."
    if (!PREFIJOS_RUC.includes(v.slice(0, 2)))
      return "El RUC debe empezar en 10, 15, 16, 17 o 20."
    return null
  }
  if (tipo === "DNI") {
    if (!/^\d{8}$/.test(v)) return "El DNI debe tener 8 dígitos."
    return null
  }
  return null
}

/** Hint contextual bajo el campo documento. */
export function hintDocumento(tipo: string): string {
  if (tipo === "RUC") return "11 dígitos. Empieza en 20 (empresa) o 10 (persona)."
  if (tipo === "DNI") return "8 dígitos."
  return "Opcional."
}

/** Email válido (opcional). null si vacío o correcto. */
export function validarEmail(v: string): string | null {
  const t = v.trim()
  if (!t) return null
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t) ? null : "Correo no válido."
}

/** Teléfono (opcional): 6 a 12 dígitos. */
export function validarTelefono(v: string): string | null {
  const t = v.trim()
  if (!t) return null
  return /^\d{6,12}$/.test(t) ? null : "Teléfono: 6 a 12 dígitos."
}
