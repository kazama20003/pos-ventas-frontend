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
     - `components/onboarding/onboarding-guide.tsx` — **guía flotante
       persistente** (patrón Intercom/Linear/Notion), montada en `AppShell`,
       vive en TODAS las vistas. Colapsada: botón flotante bottom-right con
       anillo de progreso SVG (pasos completados/total de todos los flujos)
       y pulso sutil si hay paso pendiente. Expandida: panel con la tarjeta
       del paso activo (CTA "Hacerlo ahora"), link "Omitir", mini-mapa
       compacto de pasos y opción "No mostrar más". Desaparece sola cuando
       todo está completado o descartado.
     - `components/onboarding/onboarding-checklist.tsx` — banda slim de una
       línea en el dashboard: paso activo + CTA (mismo mecanismo
       guide-intent). No compite con el widget.
     - `components/onboarding/contextual-tour.tsx` — coach-mark de un solo
       elemento (driver.js) en la vista donde ocurre la acción. Se muestra
       una vez por sesión (`sessionStorage["tour:{flow}:{step}"]`), solo si
       el paso está `PENDIENTE` y el selector existe; falla en silencio.
     - `components/onboarding/empty-state-action.tsx` — empty state
       reutilizable orientado a acción.

## Guía flotante: continuidad y guide-intent

El problema que resuelve: el checklist mandaba al usuario a la vista y ahí
moría — nada seguía guiando ni detectaba la completitud. Ahora:

- **guide-intent:** al pulsar el CTA del widget (o de la banda del
  dashboard) se guarda `sessionStorage["guide-intent"] = "flowKey:stepKey"`
  y se navega a la vista del paso. `ContextualTour` en la vista destino, si
  ve ese intent, muestra el coach-mark SIEMPRE (aunque ya se haya visto en
  la sesión) señalando el botón exacto, y consume el flag al mostrarse.
  Helper: `marcarGuideIntent(flowKey, stepKey)` exportado desde
  `onboarding-guide.tsx`.
- **Detección de completitud en vivo:** el hook invalida
  `['onboarding-flujos']` en cada cambio de ruta (usePathname) y además hace
  `refetchInterval: 7000` SOLO mientras exista un paso activo pendiente
  (function-form de react-query).
- **Celebración:** cuando el paso que estaba activo pasa a `COMPLETADO`
  (comparación con `useRef`), el panel se auto-expande con un check verde
  ("¡{paso} listo! 🎉") y la tarjeta del SIGUIENTE paso con botón
  "Continuar" (mismo guide-intent). Si era el último paso del último flujo:
  celebración final "¡Tu negocio está en marcha! 🚀" con botón "Terminar"
  que descarta los flujos restantes.
- Es un widget, nunca un modal: no bloquea, es colapsable y descartable.

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
