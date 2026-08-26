# Movimiento y escenas 3D

La home y el dashboard incorporan capas visuales progresivas sin reemplazar el sistema CSS existente.

- `motion` revela las tarjetas al entrar al viewport, aplica entrada escalonada, `layout`, y respuesta de hover/tap.
- `three` y `@react-three/fiber` aportan dos escenas decorativas: la composición cloud de la home y el progreso de participación del dashboard.
- La home mantiene un Canvas 2D de partículas y conexiones ligeras detrás de la escena CSS.
- Las escenas 3D se cargan dinámicamente, usan una densidad máxima de 1.5, no reciben eventos de puntero y pausan el render fuera del viewport.
- Con `prefers-reduced-motion` o sin WebGL, no se monta el 3D ni se anima el Canvas 2D; las capas CSS originales siguen siendo la experiencia base.

No se incluye GSAP ni Spline: Motion cubre las interacciones solicitadas y las escenas se controlan directamente para mantener el peso y el comportamiento predecibles.
