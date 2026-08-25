# AWS Student Community Platform

Plataforma digital propuesta para AWS Student Builder Group PUCE: sitio institucional, centro de eventos, área personal de estudiantes y panel administrativo.

## Estado

**Fase 0 — preparación final.** El repositorio contiene preparación documental, Supabase CLI y controles básicos de seguridad. Todavía no contiene una aplicación Next.js, páginas, componentes o funcionalidades de producto.

Las decisiones críticas D-001 a D-008 están aprobadas y documentadas en [docs/decisions-pending-approval.md](docs/decisions-pending-approval.md). La Fase 1 puede iniciar el scaffold técnico; la publicación y el tratamiento de datos reales siguen condicionados a las validaciones institucionales documentadas.

## Arquitectura propuesta

- Next.js con App Router y TypeScript estricto.
- Tailwind CSS y componentes shadcn/ui incorporados de forma selectiva.
- Supabase para PostgreSQL, Auth y Storage, con RLS y privilegios mínimos.
- Vercel para previews y despliegue, sujeto a validar que el uso institucional cumple las condiciones del plan gratuito.
- GitHub Flow para cambios revisables; no se harán commits ni publicaciones remotas sin solicitud expresa.

El análisis completo se encuentra en [docs/phase-0-technical-plan.md](docs/phase-0-technical-plan.md).
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
│   └── phase-0-technical-plan.md
├── supabase/
│   └── config.toml
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

La estructura `src/`, `public/`, la configuración de Next.js y las dependencias se crearán en la Fase 1, después de la aprobación.

## Variables de entorno

`.env.local` está excluido de Git y contiene la URL y clave publicable del proyecto. Nunca incluir valores locales en Git.

Se proponen las claves actuales `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y `SUPABASE_SECRET_KEY`; las claves heredadas `anon` y `service_role` no forman parte de esta base nueva.

## Requisitos manuales pendientes

1. Registrar la entidad jurídica, área responsable y política de privacidad aplicable.
2. Conservar la autorización o los lineamientos de marca AWS/PUCE antes de publicar.
3. Registrar el correo individual del operador suplente Jeyson.
4. Definir responsables de revisión para Pull Requests.

## Comandos

No hay comandos de instalación o ejecución todavía. Se añadirán cuando exista el scaffold aprobado de Next.js.
