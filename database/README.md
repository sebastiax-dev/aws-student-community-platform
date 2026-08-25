# Base de datos

Este directorio está reservado para migraciones SQL reproducibles y pruebas de seguridad de PostgreSQL/Supabase.

No contiene SQL todavía porque el modelo propuesto requiere aprobación. Una vez aprobado, las migraciones deberán cubrir, en orden:

1. tipos, tablas, claves foráneas, restricciones e índices;
2. funciones privadas de autorización;
3. privilegios mínimos y políticas RLS para cada operación;
4. buckets y políticas de Supabase Storage;
5. datos semilla no sensibles;
6. pruebas de invariantes, permisos e idempotencia.

Los cambios no deberán ejecutarse manualmente como única fuente de verdad en el panel de Supabase.
