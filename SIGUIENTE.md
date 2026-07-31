# Frontend POS — qué sigue y qué falta ajustar

Actualizado: 2026-07-31

## ✅ Vistas hechas (reales)
dashboard, productos (+nuevo/editar/importar), **inventario** (stock consolidado valorizado + alertas
stock mínimo), **transferencias**, **conteos físicos**, **reservas**, **reportes por sucursal**,
**sucursales** (maestro-detalle con almacenes/cajas/tipos/predeterminado), **empresas**, **usuarios**
(invitar con rol+sucursal). Fix global del `Select` (panel en portal, ya no se corta).

## 🔜 Vistas pendientes (STUBS — el backend ya existe, solo falta la UI)
Prioridad de mayor a menor:
1. **Ventas (POS)** 🔥 `/ventas` — buscar/agregar productos, cobrar (efectivo/tarjeta/crédito), vuelto,
   idempotencyKey, imprimir. API: `POST /ventas` (`crear-venta.dto`). El `almacenId` por línea es OPCIONAL
   (usa el predeterminado de la sucursal). Efectivo exige `sesionCajaId` de caja abierta.
2. **Caja** 🔥 `/caja` — abrir turno (`POST /caja/sesiones`), movimientos, cerrar+arquear
   (`POST /caja/sesiones/cerrar`). Va junto con POS.
3. **Clientes** `/clientes` — directorio + cuentas por cobrar.
4. **Compras** `/compras` — órdenes, recepciones, pagos. **Proveedores** `/proveedores` — directorio + CxP.
5. **Facturación** `/facturacion` — comprobantes electrónicos SUNAT.
6. **Suscripción** `/suscripcion` — plan, uso, facturas.
7. Configuración, Mensajes, Notificaciones (secundarias).

## ⚠️ Qué falta ajustar
- **Prueba end-to-end real**: las pantallas están tras login Google; verificadas solo con `tsc`+`eslint`.
  Falta correr `pnpm dev` + backend con BD y probar clic a clic.
- **Lint preexistente** en `components/layout/app-sidebar.tsx`: `setMounted` en efecto + `<img>` sin `next/image`.
  No bloquea, pero conviene limpiarlo.
- **Gating de permisos en UI**: hoy los botones no se ocultan por permiso (el backend sí bloquea con 403).
  Considerar ocultar acciones según `mis-sucursales` / permisos del usuario.
- **`mis-sucursales`**: cablear el selector de sucursal del POS/caja para que el empleado solo vea las suyas.

## Patrones a reusar al construir las vistas nuevas
- Cliente API: `lib/api/*.ts` con `authedFetch` (maneja token + refresh).
- React Query (`useQuery`/`useMutation`), toasts NO existen → error inline `<p className="text-destructive">`.
- Componentes: `Select` (portal), `Button`, `Input`, `Label`, `Skeleton`, `Tabs`, `PageHeader`. No hay dialog/table.
- Buscador de productos: ver `transferencias/page.tsx` o `inventario/reservas/page.tsx` (`BuscadorVariantes`).
