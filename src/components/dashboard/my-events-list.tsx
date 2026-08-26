import { CalendarDays, ExternalLink, MapPin } from "lucide-react";
import Link from "next/link";

import type { DashboardRegistration } from "@/features/dashboard/types";
import { eventModalityLabels, registrationStatusLabels } from "@/features/events/types";

type MyEventsListProperties = Readonly<{
  registrations: readonly DashboardRegistration[];
}>;

function formatEventDate(isoDate: string): string {
  return new Intl.DateTimeFormat("es-EC", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Guayaquil" }).format(new Date(isoDate));
}

export function MyEventsList({ registrations }: MyEventsListProperties): React.ReactNode {
  if (registrations.length === 0) {
    return <section className="surface dashboard-empty"><CalendarDays size={32} /><h2>Aún no tienes eventos</h2><p>Al inscribirte con tu cuenta, tus eventos aparecerán aquí automáticamente.</p><Link className="button button--primary" href="/eventos">Explorar eventos</Link></section>;
  }

  return <div className="my-events-list">{registrations.map((registration) => {
    if (registration.event === null) {
      return <article className="surface my-event-card" key={registration.id}><div><span className="status-pill status-pill--past">HISTORIAL</span><h2>Evento no disponible</h2><p>El evento asociado ya no está disponible para consultar públicamente.</p></div><span className="my-event-card__status">{registrationStatusLabels[registration.status]}</span></article>;
    }

    const event = registration.event;
    return <article className="surface my-event-card" key={registration.id}><div className="my-event-card__date"><strong>{new Intl.DateTimeFormat("es-EC", { day: "2-digit", timeZone: "America/Guayaquil" }).format(new Date(event.starts_at))}</strong><span>{new Intl.DateTimeFormat("es-EC", { month: "short", timeZone: "America/Guayaquil" }).format(new Date(event.starts_at)).replace(".", "").toUpperCase()}</span></div><div className="my-event-card__content"><span className={`status-pill status-pill--${event.status.toLowerCase()}`}>{event.status === "ACTIVE" ? "EN CURSO" : event.status === "PLANNED" ? "PRÓXIMAMENTE" : "FINALIZADO"}</span><h2>{event.title}</h2><p><CalendarDays size={15} /> {formatEventDate(event.starts_at)}</p><p><MapPin size={15} /> {eventModalityLabels[event.modality]} · {event.location}</p><span className="my-event-card__status">{registrationStatusLabels[registration.status]}</span></div>{event.is_published ? <Link aria-label={`Ver ${event.title}`} className="icon-button" href={`/eventos/${event.slug}`}><ExternalLink size={16} /></Link> : null}</article>;
  })}</div>;
}
