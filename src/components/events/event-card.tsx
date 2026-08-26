import { ArrowRight, Bot, CalendarDays, Cloud, MapPin, Monitor, Workflow } from "lucide-react";

import type { EventFixture, EventStatus, EventTone } from "@/features/events/event-fixtures";

type EventCardProperties = Readonly<{
  event: EventFixture;
  featured: boolean;
}>;

const statusLabels: Readonly<Record<EventStatus, string>> = {
  open: "INSCRIPCIONES ABIERTAS",
  past: "REALIZADO",
  soon: "PRÓXIMAMENTE",
};

const toneIcons: Readonly<Record<EventTone, typeof Cloud>> = {
  blue: Cloud,
  teal: Bot,
  violet: Workflow,
};

export function EventCard({ event, featured }: EventCardProperties): React.ReactNode {
  const EventIcon = toneIcons[event.tone];
  const actionLabel = event.status === "open" ? "Ver detalles e inscribirme" : event.status === "past" ? "Ver resumen del evento" : "Más información";

  return (
    <article className="event-card surface" data-featured={featured}>
      <div className="event-card__image" data-tone={event.tone === "blue" ? undefined : event.tone}>
        <span className={`status-pill status-pill--${event.status}`}>{statusLabels[event.status]}</span>
        <span className="event-card__number">{event.id}</span>
        <EventIcon aria-hidden="true" />
      </div>
      <div className="event-card__content">
        <div className="event-card__metadata"><span><CalendarDays aria-hidden="true" size={13} /> {event.date}</span><span className="status-pill status-pill--open">{event.modality}</span></div>
        <h2>{event.title}</h2>
        <p>{event.description}</p>
        <div className="event-card__location"><MapPin aria-hidden="true" size={14} />{event.location}</div>
        <a className={featured ? "button button--primary" : "button button--secondary"} href="#eventos">{actionLabel}<ArrowRight size={15} /></a>
      </div>
    </article>
  );
}
