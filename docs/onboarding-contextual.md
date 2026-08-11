# Onboarding contextual

Guía híbrida y no bloqueante: el backend deriva el progreso a partir de
**eventos reales** (crear empresa, abrir caja, vender…) y el frontend solo
decide **cómo y dónde** enseñarlo. Nunca se explica todo el sistema: se
muestra un único paso activo, cada paso lleva a una acción real, y todo es
omitible o descartable.

## Arquitectura

- **Derivación por eventos (backend):** cada paso tiene un `evento`; cuando
  ocurre en el sistema, el paso pasa a `COMPLETADO` (con `derivado: true`).
  No hay checklists manuales que el usuario deba marcar.
- **Overrides manuales:** el usuario puede `OMITIR` un paso o `DESCARTAR`
  un flujo entero (stepKey especial `_flow`). Un override nunca bloquea la
  derivación: si el evento ocurre igual, el paso queda completado.
- **Frontend en 3 capas:**
  1. `lib/onboarding/flows.ts` — config declarativa de presentación
     (título, descripción de 1 línea, CTA, icono, `vista`, `tourSelector`).
  2. `hooks/use-onboarding-progress.ts` — estado (react-query, key
     `['onboarding-flujos']`, refetch on focus) + mutaciones omitir/descartar.
  3. Superficies de UI:
     - `components/onboarding/onboarding-checklist.tsx` — tarjeta compacta
       del dashboard: solo el paso activo + barra segmentada.
     - `components/onboarding/contextual-tour.tsx` — coach-mark de un solo
       elemento (driver.js) en la vista donde ocurre la acción. Se muestra
       una vez por sesión (`sessionStorage["tour:{flow}:{step}"]`), solo si
       el paso está `PENDIENTE` y el selector existe; falla en silencio.
     - `components/onboarding/empty-state-action.tsx` — empty state
       reutilizable orientado a acción.

## Cómo agregar un flujo o paso

1. **Backend:** define el flujo/paso (flowKey, stepKey, `evento`, `vista`,
   orden) y el "hecho" que lo deriva. `GET /onboarding/flujos` lo expondrá
   automáticamente.
2. **Frontend:** añade la entrada en `FLUJOS_CONFIG` de
   `lib/onboarding/flows.ts` con título accionable, descripción de 1 línea,
   CTA e icono. Sin entrada, el checklist usa fallbacks (stepKey + vista del
   backend), así que el sistema no se rompe.
3. **Opcional:** en la vista donde ocurre la acción, monta
   `<ContextualTour flowKey stepKey selector titulo descripcion />` y pon el
   `id` correspondiente al elemento a resaltar; y/o usa `<EmptyStateAction />`
   cuando la vista esté vacía.

## Contratos de API

### `GET /onboarding/flujos`

```json
{
  "hechos": { "tieneEmpresa": true, "tieneProducto": false },
  "flujos": [
    {
      "flowKey": "puesta-en-marcha",
      "titulo": "Puesta en marcha",
      "descartado": false,
      "completado": false,
      "pasoActivo": "producto",
      "pasos": [
        {
          "stepKey": "producto",
          "evento": "producto.creado",
          "vista": "/productos/nuevo",
          "status": "PENDIENTE",
          "derivado": false
        }
      ]
    }
  ]
}
```

`status`: `PENDIENTE | COMPLETADO | OMITIDO | DESCARTADO`.

### `PATCH /onboarding/flujos/:flowKey/pasos/:stepKey`

Body: `{ "status": "PENDIENTE" | "OMITIDO" | "DESCARTADO" }`.
Devuelve el mismo shape que el GET. `stepKey = "_flow"` con `DESCARTADO`
descarta el flujo completo.

Cliente: `obtenerFlujos()` y `actualizarPasoFlujo()` en `lib/api/onboarding.ts`.

## Flujos actuales

- `puesta-en-marcha`: empresa → sucursal → caja → producto.
- `primera-venta`: abrir-caja → vender → comprobante.

Nota: `first-sale-checklist.tsx` (endpoint `/onboarding/estado`) sigue en el
repo pero ya no se renderiza en el dashboard; lo reemplaza
`OnboardingChecklist`.
