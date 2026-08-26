import { CalendarDays, Edit3, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

import { listAdminEvents } from "@/features/events/queries";
import { eventModalityLabels, eventStatusLabels } from "@/features/events/types";

export const dynamic = "force-dynamic";

type AdminEventsPageProperties = Readonly<{
  searchParams: Promise<{ status?: string }>;
}>;

export default async function AdminEventsPage({ searchParams }: AdminEventsPageProperties): Promise<React.ReactNode> {
  const events = await listAdminEvents();
  const parameters = await searchParams;

  return (
    <section className="admin-section">
      {parameters.status === "deleted" ? <div aria-live="polite" className="auth-message">El borrador fue eliminado correctamente.</div> : null}
      <div className="admin-section__heading"><div><h2>Eventos</h2><p>{events.length} registros visibles para administración.</p></div></div>
      {events.length === 0
        ? <div className="empty-state surface"><CalendarDays size={32} /><h3>Aún no hay eventos</h3><p>Crea el primer evento para reemplazar los prototipos locales por contenido administrable.</p><Link className="button button--primary" href="/dashboard/admin/eventos/nuevo">Crear evento</Link></div>
        : <div className="admin-event-list">{events.map((event) => <article className="admin-event-row surface" key={event.id}><div className="admin-event-row__status">{event.is_published ? <Eye size={17} /> : <EyeOff size={17} />}<span>{event.is_published ? "Publicado" : "Borrador"}</span></div><div><h3>{event.title}</h3><p>{new Intl.DateTimeFormat("es-EC", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Guayaquil" }).format(new Date(event.starts_at))} · {eventModalityLabels[event.modality]} · {eventStatusLabels[event.status]}</p></div><Link className="button button--secondary" href={`/dashboard/admin/eventos/${event.id}/editar`}><Edit3 size={15} /> Editar</Link></article>)}</div>}
    </section>
  );
}
