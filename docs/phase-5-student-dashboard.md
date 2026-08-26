# Fase 5 — Dashboard del estudiante

Estado: **implementada y aplicada al proyecto Supabase; pendiente de revisión Git**

## Alcance implementado

El área privada ahora ofrece:

- resumen personal en `/dashboard` con inscripciones activas, eventos próximos, confirmaciones y asistencias;
- historial completo en `/dashboard/eventos`;
- perfil editable en `/dashboard/perfil`, limitado al nombre visible;
- navegación privada y acceso directo a administración para el rol `ADMIN`;
- estados vacíos reales cuando una cuenta todavía no tiene participaciones.

Los contadores proceden de `event_registrations`. No se muestran puntos ni certificaciones simuladas: sus modelos, trazabilidad y gestión pertenecen a la Fase 6.

## Historial y RLS

La migración `20260826213000_allow_users_to_read_registered_events.sql` añade una política de solo lectura a `events`. Una persona autenticada puede leer un evento no publicado únicamente si existe una inscripción propia asociada. Esto conserva el historial personal cuando un administrador despublica un evento, sin dar acceso a eventos de otros usuarios ni a detalles privados.

La prueba remota `scripts/verify-events-rls.mts` amplió su cobertura a 21 comprobaciones:

- quien se inscribió puede ver un evento histórico tras despublicarse;
- una cuenta sin inscripción no puede ver ese evento;
- permanecen activas las comprobaciones de CRUD administrativo, Storage, capacidad, idempotencia y aislamiento de registros.

La prueba utiliza tres usuarios, un evento y un archivo temporales, y los elimina al finalizar.

## Perfil

La Server Action de perfil valida el nombre visible con Zod, comprueba la sesión y actualiza solo `profiles.display_name`. La política existente de `profiles` exige que `auth.uid()` coincida con la fila; por tanto, no es posible editar el perfil de otra cuenta desde la interfaz ni desde una petición manipulada.

## Validación realizada

- `supabase db push --linked` aplicó la migración de historial;
- `supabase db lint --linked --level warning` sin errores;
- 21 comprobaciones remotas de RLS exitosas;
- `npm run lint`, `npm run typecheck` y `npm run build` deben completarse antes del checkpoint Git;
- se verificará que las rutas privadas redirigen sin sesión y que las rutas del dashboard responden correctamente con la aplicación compilada.

## Pendientes de la Fase 6

- asistencia administrativa idempotente;
- certificaciones con archivos privados;
- puntos mediante un libro mayor auditable;
- visualización de esas fuentes de verdad en este dashboard.
