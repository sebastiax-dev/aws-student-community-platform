# Base de datos

Las migraciones reproducibles viven en `supabase/migrations/` para integrarse directamente con Supabase CLI. La prueba remota de identidad y RLS vive en `scripts/verify-identity-rls.mts`.

Las migraciones deberán cubrir, en orden:

1. tipos, tablas, claves foráneas, restricciones e índices;
2. funciones privadas de autorización;
3. privilegios mínimos y políticas RLS para cada operación;
4. buckets y políticas de Supabase Storage;
5. datos semilla no sensibles;
6. pruebas de invariantes, permisos e idempotencia.

Los cambios no deberán ejecutarse manualmente como única fuente de verdad en el panel de Supabase.
