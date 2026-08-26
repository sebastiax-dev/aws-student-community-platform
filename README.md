# AWS Student Community Platform

Plataforma digital propuesta para AWS Student Builder Group PUCE: sitio institucional, centro de eventos, área personal de estudiantes y panel administrativo.

## Estado

**Fase 4 — eventos y administración implementada; pendiente de revisión Git.** El repositorio incluye eventos públicos dinámicos, detalle por slug, inscripción con seguimiento interno, imágenes en Supabase Storage y un panel ADMIN protegido para administrar todo el ciclo del evento. Las métricas personales continúan como prototipos hasta la Fase 5.

Las decisiones críticas D-001 a D-008 están aprobadas y documentadas en [docs/decisions-pending-approval.md](docs/decisions-pending-approval.md). La Fase 1 puede iniciar el scaffold técnico; la publicación y el tratamiento de datos reales siguen condicionados a las validaciones institucionales documentadas.

## Arquitectura propuesta

- Next.js con App Router y TypeScript estricto.
- Tailwind CSS y componentes shadcn/ui incorporados de forma selectiva.
- Supabase para PostgreSQL, Auth y Storage, con RLS y privilegios mínimos.
- Vercel para previews y despliegue, sujeto a validar que el uso institucional cumple las condiciones del plan gratuito.
- GitHub Flow para cambios revisables; no se harán commits ni publicaciones remotas sin solicitud expresa.

El análisis completo se encuentra en [docs/phase-0-technical-plan.md](docs/phase-0-technical-plan.md).
El alcance y los controles del scaffold se encuentran en [docs/phase-1-base-architecture.md](docs/phase-1-base-architecture.md).
El sistema de diseño y sus prototipos se documentan en [docs/phase-2-visual-system.md](docs/phase-2-visual-system.md).
El modelo de identidad, RLS y Auth se documentan en [docs/phase-3-identity-and-auth.md](docs/phase-3-identity-and-auth.md).
El sistema de eventos, administración y pruebas RLS se documenta en [docs/phase-4-events-and-admin.md](docs/phase-4-events-and-admin.md).
Los responsables confirmados y las designaciones institucionales pendientes se encuentran en [docs/governance.md](docs/governance.md).

Proyecto Supabase vinculado: `aws-student-community-platform`, región `sa-east-1`, referencia `xxulvvszfijaeeqvrxwy`.

## Estructura actual

```text
aws-student-community-platform/
├── database/
│   └── README.md
├── docs/
│   ├── decisions-pending-approval.md
│   ├── governance.md
│   ├── phase-0-technical-plan.md
│   ├── phase-1-base-architecture.md
│   ├── phase-2-visual-system.md
│   ├── phase-3-identity-and-auth.md
│   └── phase-4-events-and-admin.md
├── src/
│   ├── app/                  # Sitio público, Auth, dashboard y administración
│   ├── components/           # Layout, eventos, formularios y dashboard
│   ├── features/             # Auth, consultas y mutaciones de eventos
│   └── lib/supabase/
├── supabase/
│   ├── migrations/
│   └── config.toml
├── .github/workflows/ci.yml
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

La portada y `/eventos` consultan exclusivamente eventos publicados en Supabase. Los fixtures locales se conservan solo para el preview visual de métricas del dashboard; no se usan como contenido público ni se migraron como datos reales.

## Variables de entorno

`.env.local` está excluido de Git y contiene la URL y clave publicable del proyecto. Nunca incluir valores locales en Git.

Se proponen las claves actuales `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y `SUPABASE_SECRET_KEY`; las claves heredadas `anon` y `service_role` no forman parte de esta base nueva.

## Requisitos manuales pendientes

1. Registrar la entidad jurídica, área responsable y política de privacidad aplicable.
2. Conservar la autorización o los lineamientos de marca AWS/PUCE antes de publicar.
3. Registrar el correo individual del operador suplente Jeyson.
4. Definir responsables de revisión para Pull Requests.

## Comandos

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm run test:rls
npm run test:events-rls
```

Las pruebas RLS requieren variables locales y `SUPABASE_TEST_SERVICE_ROLE_KEY` cargada únicamente durante la ejecución. Nunca debe guardarse esa credencial en el repositorio.
