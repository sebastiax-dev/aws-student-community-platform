export default function HomePage(): React.ReactNode {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <section className="max-w-xl rounded-2xl border border-blue-400/20 bg-[var(--surface)] p-8 shadow-[0_0_48px_rgba(59,130,246,0.12)]">
        <p className="text-sm font-semibold tracking-[0.18em] text-blue-400">AWS STUDENT COMMUNITY · PUCE</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Base técnica en preparación</h1>
        <p className="mt-4 leading-7 text-[var(--muted)]">
          La plataforma está configurando su arquitectura inicial. El contenido institucional, los eventos y el acceso de estudiantes llegarán en las siguientes fases.
        </p>
      </section>
    </main>
  );
}
