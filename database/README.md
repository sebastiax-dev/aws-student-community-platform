# Base de datos

Las migraciones reproducibles viven en `supabase/migrations/` para integrarse directamente con Supabase CLI. Las pruebas remotas de RLS viven en `scripts/verify-identity-rls.mts` y `scripts/verify-events-rls.mts`.

Las migraciones deberán cubrir, en orden:

1. tipos, tablas, claves foráneas, restricciones e índices;
2. funciones privadas de autorización;
3. privilegios mínimos y políticas RLS para cada operación;
4. buckets y políticas de Supabase Storage;
5. datos semilla no sensibles;
6. pruebas de invariantes, permisos e idempotencia.

Los cambios no deberán ejecutarse manualmente como única fuente de verdad en el panel de Supabase.

## Migraciones aplicadas

- `20260825220000_create_identity_model.sql`: perfiles, roles, autorización y RLS de identidad.
- `20260826203000_create_events_and_registrations.sql`: eventos, contenido relacionado, inscripciones, auditoría y políticas del bucket `events`.
- `20260826213000_allow_users_to_read_registered_events.sql`: historial de eventos propio para el dashboard, incluso tras una despublicación.

No hay datos semilla de eventos: el contenido real se crea desde `/dashboard/admin/eventos`.
