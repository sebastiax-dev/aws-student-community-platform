# Fase 6 — asistencias, certificaciones y puntos

La Fase 6 convierte el progreso del estudiante en datos auditables y no en valores editables desde el navegador.

## Modelo

- `attendance`: una asistencia por usuario y evento. Solo puede cambiarse mediante `set_event_attendance` y exige rol `ADMIN`.
- `certifications`: historial de certificados con emisión, revocación y responsables. Los certificados asociados a un evento requieren una asistencia registrada.
- `points_history`: libro mayor inmutable de puntos. Una inscripción suma 10 puntos; una asistencia suma 20; una corrección registra una reversión de -20.
- `profiles.total_points` y `profiles.total_certifications`: agregados mantenidos por triggers; no son editables por usuarios.

Las transiciones repetidas no duplican puntos ni certificados. Cada asistencia se relaciona con una inscripción existente y marca esa inscripción como `ATTENDED`.

## Interfaces y controles

- `/dashboard/progreso` muestra puntos, reconocimientos y revocaciones al propio estudiante.
- `/dashboard/admin/eventos/[eventId]/editar` permite al ADMIN marcar o corregir asistencia, emitir certificados y revocar certificados activos.
- RLS permite a cada estudiante leer únicamente sus asistencias, certificaciones y puntos.
- Las escrituras directas están bloqueadas; las RPC administrativas verifican sesión y rol dentro de PostgreSQL.
- `audit_events` registra cambios de asistencia y certificados.

## Validación

`npm run test:progress-rls` añade 21 comprobaciones remotas de permisos, idempotencia de asistencia, agregados y revocación. También se ejecutaron las pruebas RLS existentes de identidad y eventos.
