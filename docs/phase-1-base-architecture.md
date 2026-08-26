# Fase 1 — Configuración base y arquitectura

Estado: **en preparación para revisión**

## Alcance de este incremento

- Next.js 16 con App Router, React 19 y TypeScript estricto.
- Tailwind CSS 4 y una pantalla técnica mínima, sin contenido de producto.
- ESLint con la configuración Core Web Vitals de Next.js.
- Adaptadores de Supabase para navegador y servidor, con validación tipada de las variables públicas.
- CI en GitHub para `lint`, `typecheck` y `build`.

## Decisiones aplicadas

- `src/app` concentra rutas y estilos globales.
- `src/lib/env.ts` valida URL y clave publicable antes de crear clientes de Supabase.
- La clave secreta no se lee, no se expone y no se requiere en este incremento.
- No se crean directorios ni dependencias sin un consumidor concreto.

## Verificación local

```bash
npm run lint
npm run typecheck
npm run build
```

Los tres comandos deben pasar antes de solicitar revisión del Pull Request.

## Fuera de alcance

- Migraciones, RLS, tablas y datos de prueba.
- Flujos de registro, sesión, recuperación o roles.
- Sistema visual final, páginas de eventos, dashboard y panel administrativo.
- Uso de datos personales, despliegue o publicación pública.
