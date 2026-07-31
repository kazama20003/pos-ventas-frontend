import { authedFetch } from "./authed"

export type EstadoMembresia = "INVITADA" | "ACTIVA" | "SUSPENDIDA" | "REVOCADA"

export type RolAsignado = {
  id: string
  codigo: string
  nombre: string
  sucursalId: string | null
}

export type Usuario = {
  membresiaId: string
  estado: EstadoMembresia
  identidadUsuarioId: string
  email: string
  nombreVisible: string
  vinculadoAGoogle: boolean
  roles: RolAsignado[]
}

export type Rol = { id: string; codigo: string; nombre: string }
export type Organizacion = { id: string; codigo: string; nombre: string }

export type AsignacionRol = { rolId: string; sucursalId?: string }

export const listarUsuarios = () => authedFetch<Usuario[]>("/usuarios")

export const listarRoles = () => authedFetch<Rol[]>("/roles")

export const listarOrganizaciones = () =>
  authedFetch<Organizacion[]>("/usuarios/organizaciones")

export type InvitarUsuarioDto = {
  email: string
  nombreVisible: string
  organizacionId: string
  roles: AsignacionRol[]
}

export const invitarUsuario = (dto: InvitarUsuarioDto) =>
  authedFetch<{ membresiaId: string; email: string }>("/usuarios", {
    method: "POST",
    body: dto,
  })

export type ActualizarUsuarioDto = {
  nombreVisible?: string
  roles?: AsignacionRol[]
}

export const actualizarUsuario = (
  membresiaId: string,
  dto: ActualizarUsuarioDto
) =>
  authedFetch<{ membresiaId: string; actualizado: boolean }>(
    `/usuarios/${membresiaId}`,
    { method: "PATCH", body: dto }
  )

export const cambiarEstadoUsuario = (
  membresiaId: string,
  estado: "ACTIVA" | "SUSPENDIDA" | "REVOCADA"
) =>
  authedFetch<{ membresiaId: string; estado: string }>(
    `/usuarios/${membresiaId}/estado`,
    { method: "PATCH", body: { estado } }
  )
