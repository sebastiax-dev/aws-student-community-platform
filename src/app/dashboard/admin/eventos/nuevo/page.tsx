import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { EventForm } from "@/components/admin/event-form";
import { createEventAction } from "@/features/events/actions";

type NewEventPageProperties = Readonly<{
  searchParams: Promise<{ error?: string }>;
}>;

const errorMessages: Readonly<Record<string, string>> = {
  invalid_image: "La imagen no cumple el formato o tamaño permitido.",
  invalid_input: "Revisa los campos obligatorios, fechas y URLs HTTPS.",
  slug_conflict: "Ya existe un evento con ese slug. Usa uno diferente.",
};

export default async function NewEventPage({ searchParams }: NewEventPageProperties): Promise<React.ReactNode> {
  const parameters = await searchParams;
  const message = parameters.error === undefined ? null : errorMessages[parameters.error] ?? null;

  return (
    <section className="admin-section">
      <Link className="event-detail__back" href="/dashboard/admin/eventos"><ArrowLeft size={16} /> Volver a eventos</Link>
      <div className="admin-section__heading"><div><h2>Crear evento</h2><p>El slug se genera automáticamente si lo dejas vacío.</p></div></div>
      {message === null ? null : <div aria-live="polite" className="auth-message">{message}</div>}
      <EventForm action={createEventAction} event={null} submitLabel="Crear evento" />
    </section>
  );
}
