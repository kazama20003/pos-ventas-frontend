"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

/**
 * Contexto operativo global: en qué sucursal/almacén/caja trabaja el usuario.
 * Persistido en localStorage para que sobreviva recargas. Guarda solo IDs; los
 * datos (nombres, lista permitida) los resuelve `useSucursalActiva` contra
 * `GET /usuarios/mis-sucursales`.
 *
 * Es el cimiento de POS/Caja: un cajero elige su sucursal una vez y todas las
 * pantallas la reutilizan, sin re-seleccionar en cada una.
 */
export type SucursalActivaState = {
  sucursalId: string | null
  almacenId: string | null
  sesionCajaId: string | null
  setSucursal: (id: string | null) => void
  setAlmacen: (id: string | null) => void
  setSesionCaja: (id: string | null) => void
  reset: () => void
}

export const useSucursalStore = create<SucursalActivaState>()(
  persist(
    (set) => ({
      sucursalId: null,
      almacenId: null,
      sesionCajaId: null,
      // Cambiar de sucursal invalida almacén y caja (pertenecen a la sucursal).
      setSucursal: (id) =>
        set({ sucursalId: id, almacenId: null, sesionCajaId: null }),
      setAlmacen: (id) => set({ almacenId: id }),
      setSesionCaja: (id) => set({ sesionCajaId: id }),
      reset: () =>
        set({ sucursalId: null, almacenId: null, sesionCajaId: null }),
    }),
    { name: "gekko.sucursal" }
  )
)
