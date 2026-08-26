# Fase 4 — Eventos y panel administrativo

Estado: **implementada y aplicada al proyecto Supabase; pendiente de revisión Git**

## Alcance implementado

La migración `20260826203000_create_events_and_registrations.sql` incorpora:

- `events` para contenido público seguro, publicación, ventanas de inscripción, capacidad e imagen;
- `event_private_details` para enlaces y notas exclusivamente administrativas;
- `event_speakers`, `event_agenda_items` y `event_resources` para el detalle administrable;
- `event_registrations` para seguimiento interno idempotente antes de abrir Google Forms;
- `audit_events` como historial append-only de cambios en eventos e inscripciones;
- enums, restricciones, índices, triggers, privilegios mínimos y políticas RLS;
- configuración y políticas del bucket público `events`, con escritura exclusiva para `ADMIN`.

No se cargaron fixtures ni eventos ficticios en Supabase. La plataforma muestra estados vacíos hasta que un administrador publique contenido real.

## Flujos públicos

| Ruta | Comportamiento |
| --- | --- |
| `/` | consulta hasta tres eventos publicados y próximos |
| `/eventos` | lista y filtra eventos publicados |
| `/eventos/[slug]` | muestra descripción, agenda, ponentes, requisitos y recursos públicos |
| botón de inscripción | registra o reutiliza el seguimiento interno del usuario autenticado y redirige a la URL HTTPS externa |

La función PostgreSQL `initiate_event_registration` serializa inscripciones por evento, valida publicación, estado, ventana y capacidad, y evita filas duplicadas. Un visitante sin cuenta puede abrir el formulario externo, pero no obtiene seguimiento interno; la interfaz informa esta diferencia. El cupo interno solo puede garantizarse para inscripciones iniciadas con sesión.

## Panel administrativo

`/dashboard/admin` exige sesión y rol `ADMIN` en el servidor. El panel permite:

- crear, editar, publicar y finalizar eventos;
- reemplazar imágenes validadas de hasta 5 MiB;
- administrar agenda, ponentes y recursos;
- guardar URL de reunión y notas fuera del modelo público;
- consultar inscritos por nombre de perfil y actualizar su estado;
- eliminar únicamente eventos que nunca fueron publicados.

Las Server Actions validan UUID, slug, fechas de Ecuador, límites de texto, capacidad, estados y URLs HTTPS con Zod. La interfaz no sustituye los controles de autorización: cada escritura vuelve a comprobar el rol y la base aplica RLS.

## Seguridad verificada

`scripts/verify-events-rls.mts` crea tres identidades efímeras y realiza 18 comprobaciones remotas:

- `USER` no crea ni modifica eventos;
- `anon` no ve borradores ni sus registros secundarios;
- los detalles privados solo son visibles para `ADMIN`;
- el contenido publicado sí es visible públicamente;
- solo `ADMIN` carga archivos en el bucket `events`;
- dos solicitudes concurrentes sobre capacidad uno producen una inscripción y un rechazo `EVENT_FULL`;
- repetir la inscripción ganadora no crea duplicados;
- cada usuario ve únicamente su inscripción y `ADMIN` puede cambiar su estado;
- `ADMIN` puede consultar la auditoría.

La prueba eliminó el evento, el objeto de Storage y las tres cuentas temporales. La credencial server-only se cargó solo en memoria.

## Validación realizada

- migración aplicada con `supabase db push --linked`;
- `supabase db lint --linked --level warning` sin errores de esquema;
- tipos regenerados desde el proyecto Supabase vinculado;
- 18 pruebas remotas de eventos, RLS, concurrencia y Storage exitosas;
- `npm run lint` y `npm run typecheck` exitosos;
- `npm run build` debe quedar exitoso antes del checkpoint Git.

## Pendientes operativos

- crear cada Google Form real y guardar su URL desde el panel;
- configurar dominio, redirects de producción y SMTP institucional antes del lanzamiento;
- ejecutar pgTAP local cuando Docker esté disponible;
- realizar pruebas manuales cross-browser, accesibilidad y Lighthouse en la fase de QA;
- desarrollar métricas y “Mis eventos” del estudiante en la Fase 5.
