/** Contrato de la API del backend (pos-backend). */

export interface TokensEmitidos {
  accessToken: string
  refreshToken: string
  tokenType: "Bearer"
  expiresIn: string
}

/** POST /identidad/auth/google */
export interface LoginGoogleDto {
  /** ID token de Google obtenido tras el sign-in en el cliente. */
  idToken: string
  /**
   * Opcional. Si se omite, el backend detecta la empresa desde el correo.
   * Solo se requiere cuando el correo pertenece a varias empresas.
   */
  tenantCodigo?: string
}

/** Resumen de empresa para el selector de desambiguación. */
export interface TenantResumen {
  codigo: string
  nombre: string
}

/** Body del 409 cuando el correo pertenece a varias empresas. */
export interface SeleccionTenantRequerida {
  codigo: "SELECCION_TENANT_REQUERIDA"
  mensaje: string
  tenants: TenantResumen[]
}

/** Body del 409 cuando el token es válido pero la cuenta no tiene empresa. */
export interface SinTenant {
  codigo: "SIN_TENANT"
  mensaje: string
}

/** POST /identidad/auth/refrescar */
export interface RefrescarDto {
  refreshToken: string
}

/** GET /identidad/auth/perfil */
export interface UsuarioAutenticado {
  identidadUsuarioId: string
  inquilinoId: string
  email: string
}

/** POST /onboarding/registrar */
export interface RegistrarEmpresaDto {
  /** ID token de Google de quien registra (será owner/admin). */
  idToken: string
  /**
   * Código preferido (opcional). Si se omite, el backend lo genera a partir
   * del nombre/razón social. Si se envía, igual lo slugifica y lo hace único.
   */
  tenantCodigo?: string
  tenantNombre: string
  organizacionNombre: string
  empresaRazonSocial: string
  /** RUC peruano: 11 dígitos. */
  empresaRuc: string
  adminNombre?: string
  /** La configuración guiada crea la primera operación dentro de la transacción. */
  configuracionInicial?: "RAPIDA" | "MANUAL"
  sucursalNombre?: string
  sucursalDireccion?: string
  almacenNombre?: string
  cajaNombre?: string
}

export interface RegistrarEmpresaResponse {
  tenant: { id: string; codigo: string }
  admin: { id: string; email: string }
  tokens: TokensEmitidos
}

/** Validaciones espejo del backend (class-validator). */
export const TENANT_CODIGO_REGEX = /^[A-Za-z0-9_-]{3,40}$/
export const RUC_REGEX = /^\d{11}$/

export type PasoOnboarding =
  | "producto"
  | "stock"
  | "caja"
  | "venta"
  | "completado"

export interface EstadoOnboarding {
  descartado: boolean
  completadoEn: string | null
  pasoActual: PasoOnboarding
  pasos: {
    productoCreado: boolean
    necesitaStock: boolean
    stockListo: boolean
    cajaAbierta: boolean
    primeraVenta: boolean
  }
}
