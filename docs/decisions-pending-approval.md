# Decisiones críticas aprobadas

Estado: **aprobado el 25 de agosto de 2026 por el usuario**. La aprobación habilita su implementación durante las fases correspondientes; todavía no se han creado código funcional ni migraciones.

## D-001 — Identidad, perfil y autorización

**Problema:** la tabla `users` propuesta duplica identidad y correo ya gestionados por `auth.users`, y guardar `role` junto a campos que el usuario puede editar aumenta el riesgo de escalación de privilegios.

**Propuesta:** usar `profiles.id` como FK 1:1 de `auth.users`; mantener roles en `user_roles`, fuera de las actualizaciones ordinarias del perfil; autorizar con RLS y una función privada estable. Empezar con `USER` y `ADMIN`, sin un motor RBAC más complejo.

**Motivo:** una sola fuente de identidad, menor exposición de correo y separación clara entre perfil y autorización.

## D-002 — Puntos y certificaciones como datos derivados

**Problema:** `total_points` y `total_certifications` pueden divergir de sus historiales por reintentos, errores o ediciones concurrentes.

**Propuesta:** considerar `point_transactions` y `certifications` como fuentes de verdad; calcular totales mediante consultas o vistas indexadas. No almacenar contadores mutables en `profiles` durante el MVP.

**Motivo:** auditoría completa, consistencia y operaciones idempotentes. El volumen inicial no justifica duplicar contadores.

## D-003 — Ciclo de vida de eventos

**Problema:** `planificado`, `activo` y `finalizado` mezclan publicación, fecha e inscripción. Un evento puede estar publicado pero con inscripción cerrada, o cancelado.

**Propuesta:** separar `publication_status` (`draft`, `published`, `archived`, `cancelled`) de `registration_opens_at` y `registration_closes_at`; derivar las etiquetas visuales “inscripciones abiertas”, “próximamente” y “realizado” a partir de fechas y estado.

**Motivo:** evita estados contradictorios y permite programar publicación/registro sin tareas manuales frágiles.

## D-004 — Google Forms e inscripción interna

**Problema:** registrar el clic antes de abrir Google Forms no demuestra que el formulario fue enviado, y Google Forms no relaciona automáticamente su respuesta con el UUID interno.

**Propuesta MVP:** crear una inscripción interna con estado `initiated`, abrir el formulario con un identificador opaco prellenado cuando sea viable, y confirmar mediante importación o reconciliación administrativa. No duplicar datos personales innecesarios en ambos sistemas.

**Motivo:** hace explícita la limitación y evita reportar como inscritas a personas que solo hicieron clic.

## D-005 — Claves actuales de Supabase

**Problema:** la especificación usa las claves heredadas `anon` y `service_role`; Supabase anunció su deprecación para finales de 2026.

**Propuesta:** usar `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y, solo si una operación concreta lo necesita, `SUPABASE_SECRET_KEY`. Las mutaciones administrativas ordinarias deben ejecutarse con la sesión del administrador para que RLS siga aplicando; la clave secreta no será un atajo general.

**Motivo:** alinea un proyecto nuevo con la recomendación actual y reduce el radio de impacto de una filtración.

## D-006 — Hosting gratuito y propiedad

**Problema:** “costo $0” no equivale a disponibilidad garantizada. Supabase Free pausa proyectos inactivos y no incluye backups automáticos; Vercel Hobby limita el uso a proyectos personales/no comerciales y no ofrece colaboración de equipo completa.

**Propuesta:** aprobar Vercel Hobby + Supabase Free únicamente como piloto no comercial, con monitoreo de cuotas y exportaciones periódicas; antes de declararlo plataforma oficial de producción, validar propiedad institucional, términos y continuidad operativa.

**Motivo:** evita prometer un SLA o gobernanza que los planes gratuitos no ofrecen.

## D-007 — Animación y visual 3D

**Problema:** instalar Motion, GSAP y Three.js o Spline desde el inicio aumenta JavaScript, complejidad y riesgo móvil; medir FPS con lógica propia también puede empeorar la experiencia.

**Propuesta:** usar CSS y Motion para las interacciones necesarias; añadir GSAP solo si aparece una secuencia que Motion no resuelva; implementar primero una ilustración optimizada y considerar 3D como mejora progresiva. `prefers-reduced-motion` y presupuestos de bundle serán obligatorios.

**Motivo:** mantiene la dirección visual sin convertir un recurso decorativo en dependencia crítica.

## D-008 — Privacidad y consentimiento

**Problema:** una única fila de `cookie_consents` que se actualiza no conserva historial; el campo `marketing` no corresponde a ninguna finalidad definida. Además, el texto legal editable necesita versionado y aprobación, no solo un JSON genérico.

**Propuesta:** usar documentos legales versionados, preferencias actuales y eventos de consentimiento inmutables asociados a la versión aceptada; eliminar `marketing` hasta que exista una finalidad real. No cargar analítica antes del consentimiento.

**Motivo:** mejora trazabilidad, minimización de datos y capacidad de demostrar consentimiento.

## Registro de aprobación

Las decisiones D-001 a D-008 fueron aprobadas como paquete para el MVP. El propietario de GitHub confirmado es `sebastiax-dev`; se adoptará visibilidad pública conforme a la confirmación del usuario y a la naturaleza comunitaria del proyecto.
