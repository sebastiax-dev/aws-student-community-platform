# Fase 3 — Modelo de identidad, RLS y autenticación

Estado: **implementada y aplicada al proyecto Supabase; pendiente de revisión Git**

## Modelo aplicado

La migración `20260825220000_create_identity_model.sql` crea:

- `profiles`: identidad editable asociada uno a uno con `auth.users`;
- `user_roles`: rol de autorización `USER` o `ADMIN`, separado del perfil;
- trigger transaccional que crea perfil y rol `USER` para cada alta;
- funciones privadas para `updated_at`, alta de usuario y verificación de administradores;
- índices, restricciones, privilegios mínimos y políticas RLS.

## Reglas verificadas

- `anon` no puede leer perfiles ni roles.
- `USER` lee y edita únicamente campos permitidos de su propio perfil.
- `USER` no puede leer ni modificar el perfil de otra persona.
- ningún cliente autenticado puede autoasignarse `ADMIN`.
- `ADMIN` puede leer perfiles y roles para tareas administrativas futuras.
- los roles solo pueden modificarse desde un contexto server-only privilegiado.

La prueba `scripts/verify-identity-rls.mts` creó dos usuarios efímeros, ejecutó ocho verificaciones y eliminó ambos usuarios al finalizar. La prueba usa una clave server-only solo en memoria. Docker no está instalado en este equipo, por lo que pgTAP local queda pendiente hasta disponer de un runtime de Supabase local.

## Flujos de aplicación

| Ruta | Responsabilidad |
| --- | --- |
| `/registro` | alta email/contraseña y metadato de nombre |
| `/login` | sesión mediante contraseña |
| `/recuperar-contrasena` | solicitud con respuesta anti-enumeración |
| `/actualizar-contrasena` | cambio tras callback válido |
| `/auth/callback` | intercambio PKCE y redirección local validada |
| `/dashboard` | ruta protegida que consulta perfil y rol mediante RLS |

Next.js `proxy.ts` refresca cookies de Supabase y aplica encabezados privados cuando cambia la sesión. Las páginas y operaciones protegidas verifican identidad con `getClaims()`; el Proxy no sustituye la autorización en base de datos.

## Validación realizada

- `supabase db push --linked --dry-run`;
- `supabase db push --linked`;
- `supabase db lint --linked --level warning` sin hallazgos;
- ocho pruebas remotas RLS exitosas;
- tipos TypeScript contrastados con `supabase gen types --linked`;
- `npm run lint`, `npm run typecheck` y `npm run build` exitosos.

## Pendientes posteriores

- registrar una cuenta real y asignar el primer `ADMIN` por procedimiento server-only;
- configurar URL y redirects de producción cuando exista un dominio aprobado;
- incorporar SMTP institucional antes de producción;
- añadir eventos y administración en Fase 4;
- ejecutar pgTAP local y E2E de correo cuando el entorno disponga de Docker y buzón de pruebas.
