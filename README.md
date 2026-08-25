# AWS Student Community Platform

Plataforma digital propuesta para AWS Student Builder Group PUCE: sitio institucional, centro de eventos, área personal de estudiantes y panel administrativo.

## Estado

**Fase 0 — análisis y planificación.** El repositorio contiene únicamente preparación documental y controles básicos de seguridad. Todavía no contiene una aplicación Next.js, páginas, componentes, migraciones SQL ni funcionalidades.

Las decisiones críticas D-001 a D-008 están aprobadas y documentadas en [docs/decisions-pending-approval.md](docs/decisions-pending-approval.md). La Fase 1 permanece bloqueada hasta completar o aceptar explícitamente los pendientes externos de GitHub, Supabase, privacidad y marca.

## Arquitectura propuesta

- Next.js con App Router y TypeScript estricto.
- Tailwind CSS y componentes shadcn/ui incorporados de forma selectiva.
- Supabase para PostgreSQL, Auth y Storage, con RLS y privilegios mínimos.
- Vercel para previews y despliegue, sujeto a validar que el uso institucional cumple las condiciones del plan gratuito.
- GitHub Flow para cambios revisables; no se harán commits ni publicaciones remotas sin solicitud expresa.

El análisis completo se encuentra en [docs/phase-0-technical-plan.md](docs/phase-0-technical-plan.md).
Los responsables confirmados y las designaciones institucionales pendientes se encuentran en [docs/governance.md](docs/governance.md).

## Estructura actual

```text
aws-student-community-platform/
├── database/
│   └── README.md
├── docs/
│   ├── decisions-pending-approval.md
│   └── phase-0-technical-plan.md
├── .env.example
├── .gitignore
└── README.md
```

La estructura `src/`, `public/`, la configuración de Next.js y las dependencias se crearán en la Fase 1, después de la aprobación.

## Variables de entorno

Copiar `.env.example` a `.env.local` únicamente cuando exista un proyecto Supabase. Nunca incluir valores reales en Git.

Se proponen las claves actuales `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y `SUPABASE_SECRET_KEY`; las claves heredadas `anon` y `service_role` no forman parte de esta base nueva.

## Requisitos manuales pendientes

1. Proteger `main` después del primer commit autorizado y publicado.
2. Crear o seleccionar la organización y el proyecto Supabase en una región apropiada.
3. Confirmar responsable del tratamiento de datos, contacto de privacidad y política institucional de PUCE.
4. Confirmar autorización de uso de nombres, logotipos y marcas de AWS/PUCE.
5. Definir responsables de revisión para Pull Requests.

## Comandos

No hay comandos de instalación o ejecución todavía. Se añadirán cuando exista el scaffold aprobado de Next.js.
