# Fase 0 — Documento técnico inicial

Fecha de análisis: 25 de agosto de 2026
Estado: **Fase 0 técnica cerrada; validaciones institucionales previas a producción pendientes**

Región de Supabase aprobada para la preparación técnica: **South America (São Paulo), `sa-east-1`**.

Proyecto remoto creado y vinculado: `aws-student-community-platform` (`xxulvvszfijaeeqvrxwy`).

## 1. Producto y alcance

La plataforma será la presencia digital de AWS Student Builder Group PUCE y combinará cuatro capacidades: contenido institucional público, centro de eventos, dashboard de progreso estudiantil y administración de contenido y participación.

Usuarios principales:

- visitantes y estudiantes principiantes que desean conocer AWS y la comunidad;
- miembros registrados que consultan eventos, asistencias, certificados y puntos;
- líderes `ADMIN` que operan contenido y registros;
- responsables institucionales de privacidad, marca y continuidad.

Módulos previstos:

- Home y contenido institucional administrable.
- Eventos, detalle, filtros, registro e historial.
- Comunidad, miembros, redes, galería y recursos.
- Auth: alta, confirmación, login, recuperación y cierre de sesión.
- Dashboard: perfil, eventos, asistencias, certificados, puntos y logros.
- Administración: eventos, usuarios, participación, contenido y configuración.
- Privacidad: documentos legales, preferencias de cookies y evidencia de consentimiento.
- Plataforma: SEO, accesibilidad, observabilidad, pruebas y despliegue.

## 2. Validación de arquitectura

Next.js App Router + Supabase es adecuado para un MVP de este tamaño. App Router permite Server Components para lectura pública, Server Actions para mutaciones y rutas dinámicas indexables. Supabase cubre Auth, PostgreSQL y Storage sin mantener servidores propios.

RLS será la barrera de datos. Las verificaciones de Server Actions añaden mensajes claros y defensa en profundidad, pero no sustituyen políticas, restricciones ni privilegios mínimos.

```text
Navegador
├── páginas públicas: Server Components + caché/revalidación
├── formularios: Client Components mínimos
└── dashboard: sesión SSR en cookies
          │
          ▼
Next.js
├── lecturas server-side
├── Server Actions para mutaciones de interfaz
├── Route Handlers solo para callbacks o integraciones HTTP
└── Zod + autorización explícita
          │
          ▼
Supabase
├── Auth
├── PostgreSQL: constraints + grants + RLS
└── Storage: buckets + RLS por objeto
```

No se propone una API REST propia ni GraphQL para el MVP. Tampoco se almacenará sesión o información sensible en Zustand; de incorporarse, se limitará a estado efímero de UI.

### Límites del costo $0

- Supabase Free incluye 500 MB de base, 1 GB de Storage y 5 GB de egress; puede pausar proyectos tras una semana de inactividad y no incluye backups automáticos.
- Vercel Hobby es gratuito con cuotas, pero está orientado a uso personal y no comercial; no representa un SLA institucional.
- Las referencias visuales pesan aproximadamente 1.4–1.6 MB por imagen y no deben publicarse tal cual. Los assets finales necesitarán compresión y variantes responsivas.

Conclusión: el costo inicial puede ser $0 para un piloto, pero no se puede prometer costo permanente, alta disponibilidad o recuperación administrada sin aceptar límites operativos.

## 3. Modelo de datos propuesto

El esquema definitivo se escribirá como migraciones después de la aprobación. Las fechas de negocio usarán `timestamptz`; nombres SQL y valores internos serán consistentes en inglés, con interfaz en español.

| Entidad | Propósito | Reglas clave |
| --- | --- | --- |
| `profiles` | Perfil 1:1 de `auth.users` | PK/FK `id`; no duplica contraseña ni usa email como identidad |
| `user_roles` | Rol de aplicación | único por usuario; separado de campos editables |
| `events` | Datos centrales del evento | `slug` único; inicio/fin coherentes; publicación separada de registro |
| `event_speakers` | Speakers ordenados | relación explícita, sin JSON opaco |
| `event_agenda_items` | Agenda ordenada | horarios validados |
| `event_resources` | Recursos publicados | URL validada y orden explícito |
| `event_registrations` | Participación interna | único `(event_id, user_id)`; estados e idempotencia |
| `attendance_records` | Resultado de asistencia | único `(event_id, user_id)`; actor y fecha de registro |
| `certifications` | Certificados emitidos | único por evento, usuario y tipo; archivo privado |
| `point_transactions` | Libro mayor de puntos | append-only; cantidad firmada, razón e idempotency key |
| `team_members` | Miembros publicables | estado, orden e imagen |
| `social_links` | Redes y enlaces | URL, estado, orden e icono permitido |
| `site_content` | Bloques de contenido | claves conocidas y esquema validado |
| `legal_documents` | Privacidad y términos | versión, borrador/publicado, vigencia y aprobador |
| `cookie_preferences` | Preferencia vigente | usuario o visitante, propósitos y versión legal |
| `consent_events` | Evidencia histórica | append-only: otorgó, rechazó o revocó |
| `audit_events` | Cambios administrativos | actor, acción, entidad e identificador, sin secretos |

Índices iniciales: slugs publicados, eventos por inicio/estado, todas las FKs, registros por usuario, asistencias por evento, certificados y transacciones por usuario/fecha.

Invariantes:

- los totales del perfil se derivan de historiales y no son fuente de verdad;
- una misma acción no otorga puntos dos veces;
- ajustes negativos requieren motivo administrativo;
- un usuario no puede autoasignarse rol, asistencia, certificado o puntos;
- consultas públicas nunca exponen `meeting_url`, correos o rutas privadas;
- los borrados históricos críticos se sustituyen por cancelación, revocación o archivo auditable.

## 4. Matriz de acceso

| Recurso | Visitante | USER | ADMIN |
| --- | --- | --- | --- |
| eventos y contenido publicados | leer | leer | gestionar |
| perfil propio | — | leer/editar campos permitidos | consultar; cambios sensibles auditados |
| registros propios | — | crear/leer/cancelar según reglas | gestionar |
| asistencia, certificados y puntos propios | — | solo leer | crear/ajustar con auditoría |
| datos de otros usuarios | — | nunca | solo para función administrativa |
| documentos legales publicados | leer | leer | versionar/publicar |
| consentimientos | guardar preferencia propia | consultar/cambiar propios | consulta limitada y justificada |
| assets públicos | leer | leer | gestionar por bucket |
| avatar y certificado privado | — | solo propios | acceso justificado |

Las políticas RLS se probarán por operación y se acompañarán de `REVOKE/GRANT`; activar RLS sin reducir privilegios no será suficiente.

## 5. Flujos principales

### Registro e identidad

1. El visitante consulta contenido publicado.
2. Al solicitar seguimiento personal se autentica o crea una cuenta.
3. Supabase envía confirmación; la interfaz no revela si una cuenta existe.
4. Tras confirmar, se activa el perfil y puede acceder al dashboard.

### Inscripción mediante Google Forms

1. El usuario autenticado pulsa “Inscribirme”.
2. El servidor valida evento, ventana, capacidad e inscripción previa.
3. Crea de forma idempotente un registro `initiated` y devuelve la URL externa.
4. El navegador abre Google Forms.
5. Un proceso administrativo reconcilia respuestas y cambia a `confirmed`; el clic no se presenta como confirmación.

Para visitantes se puede abrir el formulario, explicando que sin cuenta no habrá seguimiento. Debe decidirse si eventos con cupo exigen cuenta para evitar dos fuentes imposibles de conciliar.

### Asistencia, certificación y puntos

1. ADMIN abre la lista del evento finalizado.
2. Guarda resultados en una operación idempotente y auditable.
3. La base registra asistencia y puntos sin duplicados.
4. Si corresponde, ADMIN emite certificado y lo vincula a un objeto privado.
5. El dashboard calcula totales desde historiales.

### Contenido administrable

1. ADMIN edita un borrador validado.
2. Server Action confirma sesión y permiso; la base vuelve a aplicar RLS.
3. Al publicar se registra auditoría y se revalida la ruta afectada.
4. La página pública recibe solo campos publicados.

## 6. Storage

Buckets propuestos:

- públicos: `events`, `team`, `site-assets`;
- privados: `avatars`, `certificates`.

Se impondrán MIME y tamaños permitidos, nombres generados, compresión, permisos por prefijo y URLs firmadas breves para certificados. Solo ADMIN cargará assets públicos. La clave secreta nunca se usará desde el navegador.

## 7. Estructura de proyecto propuesta

```text
src/
├── app/
│   ├── (public)/
│   ├── (auth)/
│   ├── dashboard/
│   └── api/
├── components/
│   ├── ui/
│   ├── layout/
│   ├── home/
│   ├── events/
│   ├── community/
│   ├── dashboard/
│   └── admin/
├── features/
├── lib/
│   ├── supabase/
│   ├── auth/
│   └── validation/
├── styles/
└── types/
database/
├── migrations/
├── seed/
└── tests/
docs/
public/
```

No se crearán `hooks`, `stores` o `utils` vacíos por anticipado. Se añadirán cuando exista una responsabilidad concreta; la lógica específica vivirá junto a su feature.

## 8. Dependencias

Base de Fase 1:

- `next`, `react`, `react-dom` y `typescript`;
- Tailwind CSS y ESLint compatibles con la versión de Next seleccionada;
- `@supabase/supabase-js` y el paquete SSR recomendado;
- `zod`.

Solo con un consumidor real:

- shadcn/ui: únicamente componentes usados;
- React Hook Form: formularios cliente complejos;
- Motion: transiciones y reveals medidos;
- Lucide React: iconos;
- Zustand: estado UI global demostrado;
- GSAP y Three.js o Spline: después de una prueba visual y de rendimiento.

Ninguna dependencia se instalará solo porque aparezca en una lista.

## 9. Dirección visual

Elementos a conservar de las cuatro referencias:

- fondo casi negro, superficies azul-gris y acento azul eléctrico;
- jerarquía fuerte, bordes finos y glow reservado a estados activos;
- Home a dos columnas con visual cloud isométrico, CTA doble, evento destacado y métricas;
- Eventos en grid de tres columnas, filtros y estado prominente;
- Dashboard con navegación lateral, resúmenes, lista y progreso;
- Mobile con navegación inferior, tarjetas touch y contenido apilado.

Ajustes necesarios:

- la regla 60/30/10 no coincide literalmente con las referencias; será una paleta por roles, no porcentajes rígidos;
- verificar contraste de azul, badges y texto pequeño bajo WCAG AA;
- no replicar densidad desktop en 320 px;
- reservar dimensiones de imagen para evitar CLS;
- opciones ADMIN solo se renderizan tras autorización, sin confiar en ocultarlas;
- validar autorización de logos, fotografías, avatares y marcas AWS/PUCE.

## 10. Roadmap y gates

1. **Configuración base:** scaffold, TypeScript estricto, lint, Supabase sin credenciales y CI. Gate: lint, typecheck y build.
2. **Sistema visual:** tokens, tipografía, layouts y prototipos responsive con datos locales. Gate: AA, teclado, 320/768/1024/1440 px y bundle.
3. **Datos y autenticación:** migraciones, SSR, perfiles, roles, RLS, recuperación y confirmación. Gate: pruebas positivas y negativas de RLS.
4. **Eventos y administración:** CRUD, publicación, Storage, detalle y registro. Gate: concurrencia, idempotencia, permisos y revalidación.
5. **Dashboard:** resumen, perfil y participación. Gate: aislamiento entre usuarios y responsive.
6. **Asistencia, puntos y certificados:** flujos administrativos y libro mayor. Gate: trazabilidad, no duplicación y archivos privados.
7. **Privacidad y seguridad:** documentos versionados, consentimiento, CSP y revisión legal. Gate: analítica bloqueada antes del consentimiento.
8. **QA y optimización:** unitarias, integración, E2E, accesibilidad, navegadores y Lighthouse. Gate: build limpio y flujos críticos verdes.
9. **Deploy:** entornos, migración, preview, smoke tests, runbook, recuperación y rollback. Gate: responsables y monitoreo confirmados.

Cada fase usará `feature/*`, revisión y merge normal. Codex no creará commits sin solicitud expresa.

## 11. Pruebas

- Unitarias: validaciones, cálculos derivados y transformaciones puras.
- Base de datos: constraints, idempotencia y RLS por actor/operación.
- Integración: acciones con sesión válida, expirada, USER y ADMIN.
- E2E: alta, confirmación, login, inscripción, administración, recuperación y cookies.
- Seguridad: acceso cruzado por UUID, elevación de rol, URLs privadas, archivos y requests manipuladas.
- Accesibilidad: teclado, foco, nombres, contraste, zoom y reduced motion.
- Rendimiento: LCP, CLS, INP, bundle por ruta, imágenes y móvil económico.

Los objetivos Lighthouse son gates orientativos, no sustitutos de métricas reales de campo.

## 12. Riesgos

| Riesgo | Probabilidad | Impacto | Prevención |
| --- | --- | --- | --- |
| escalación por rol editable | media | crítico | rol separado, grants mínimos, RLS y pruebas negativas |
| clave secreta expuesta | media | crítico | no configurarla por defecto, server-only y escaneo de secretos |
| puntos o asistencia duplicados | alta | alto | uniques, idempotency keys y transacciones |
| discrepancia Google Forms/interno | alta | alto | `initiated`, reconciliación y fuente de verdad explícita |
| contadores desincronizados | alta | medio | agregados derivados |
| datos privados en caché pública | media | crítico | DTOs públicos, consultas separadas y pruebas |
| Storage o egress excedido | media | alto | compresión, límites, monitoreo y limpieza auditable |
| pausa o falta de backups | media | alto | monitoreo, exportaciones verificadas y restore runbook |
| Hobby no apto institucionalmente | media | alto | validar términos y propiedad antes de producción |
| animaciones degradan móvil | alta | medio | mejora progresiva, lazy load y reduced motion |
| contenido legal incorrecto | media | crítico | responsable institucional, versiones y revisión jurídica |
| marca o fotos no autorizadas | media | alto | aprobación escrita y registro de licencias |
| panel admin demasiado amplio | alta | medio | MVP por tareas y validación con líderes |
| dependencia de un administrador | media | alto | dos responsables y procedimiento de traspaso |

## 13. Dependencias externas

| Sistema | Necesidad | Acción manual |
| --- | --- | --- |
| GitHub | repositorio, PR y CI | reautenticar CLI, elegir propietario/visibilidad y proteger `main` |
| Supabase | Auth, DB y Storage | crear proyecto/región, redirects, email, claves y responsables |
| Vercel | previews y producción | validar Hobby, importar repo y cargar variables por entorno |
| Google Forms | registro externo | campos mínimos, privacidad, identificador y reconciliación |
| DNS | identidad pública | definir propietario; un dominio propio puede tener costo |
| AWS/PUCE | marca y contenido | confirmar autorización y lineamientos |
| Analítica | métricas opcionales | elegir solo tras privacidad y consentimiento |

## 14. Checklist de Fase 0

- [x] Especificación inventariada.
- [x] Cuatro referencias visuales inspeccionadas.
- [x] Stack y límites gratuitos contrastados con documentación oficial.
- [x] Arquitectura, modelo, flujos, riesgos y roadmap propuestos.
- [x] Repositorio local documental con `.gitignore` y `.env.example` sin secretos.
- [x] Decisiones D-001 a D-008 aprobadas.
- [x] Repositorio remoto público GitHub creado y asociado como `origin`.
- [x] Primer commit publicado y rama `main` protegida.
- [x] Proyecto Supabase creado en São Paulo y vinculado.
- [x] Auth remoto configurado con confirmación de email, recuperación segura, OTP de 8 dígitos y TOTP disponible.
- [x] Buckets `events`, `team`, `site-assets`, `avatars` y `certificates` creados y verificados.
- [x] URL pública configurada en `.env.local` excluido de Git.
- [x] Clave publicable configurada en `.env.local` sin pasar por el repositorio.
- [x] Propietario y operador técnico inicial confirmados: `sebastiax-dev`.
- [x] Responsable de tratamiento, contacto de privacidad, marca y operación principal/suplente designados.
- [ ] Entidad jurídica, política de privacidad aplicable, respaldo de marca y correo del suplente verificados para producción.
- [x] Roadmap aprobado.

La Fase 0 técnica está cerrada. El scaffold funcional puede iniciar; no se debe publicar el sitio ni tratar datos personales reales hasta resolver las validaciones institucionales pendientes.

## 15. Fuentes oficiales

- Next.js App Router: https://nextjs.org/docs/app
- Supabase Auth SSR: https://supabase.com/docs/guides/auth/server-side
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase API keys: https://supabase.com/docs/guides/getting-started/api-keys
- Supabase Storage: https://supabase.com/docs/guides/storage/security/access-control
- Supabase pricing: https://supabase.com/pricing
- Vercel Hobby: https://vercel.com/docs/plans/hobby
- AWS Trademark Guidelines: https://aws.amazon.com/trademark-guidelines/
- Ley Orgánica de Protección de Datos Personales de Ecuador: https://spdp.gob.ec/wp-content/uploads/2024/12/03.pdf.pdf

Este documento es una evaluación técnica y de privacidad por diseño, no asesoría jurídica.
