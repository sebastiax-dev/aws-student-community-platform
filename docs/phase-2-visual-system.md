# Fase 2 — Sistema visual y componentes UI

Estado: **en preparación para revisión**

## Dirección aplicada

- Fondos azul-negro, superficies elevadas y bordes de bajo contraste.
- Azul eléctrico reservado para CTA, estados activos y visualizaciones.
- Tipografía de alto contraste, jerarquía amplia y tarjetas de lectura rápida.
- Ilustraciones cloud creadas con CSS y Lucide, sin reutilizar imágenes de referencia como assets de producción.
- Navegación móvil inferior, grillas adaptables y soporte de `prefers-reduced-motion`.

## Componentes y prototipos

| Área | Componentes | Ruta de prototipo |
| --- | --- | --- |
| Navegación | `SiteHeader`, navegación móvil y marca | todas las rutas |
| Inicio | `CloudScene`, evento destacado, tarjetas y métricas | `/` |
| Eventos | `EventCard`, filtros visuales y grid responsive | `/eventos` |
| Dashboard | tarjetas de estadísticas, lista, progreso y gráfico estático | `/preview/dashboard` |

Los datos de eventos están centralizados en `src/features/events/event-fixtures.ts`. Son únicamente fixtures de interfaz y no deben usarse como contenido publicado.

## Accesibilidad y rendimiento

- Estados de foco visibles y navegación semántica.
- Colores, texto y jerarquía diseñados para contraste alto.
- Sin librerías de animación ni imágenes pesadas; los efectos usan CSS.
- Las transiciones se reducen para usuarios con `prefers-reduced-motion`.
- Las rutas se prerenderizan estáticamente en este incremento.

## Fuera de alcance

- Persistencia en Supabase, carga de Storage y consultas públicas.
- Filtros funcionales, detalle de evento e inscripción.
- Sesión, roles, dashboard privado y datos individuales.
- Contenido final, autorización de marca o despliegue público.
