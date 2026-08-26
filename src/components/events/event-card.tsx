import { ArrowRight, Bot, CalendarDays, Cloud, MapPin, Workflow } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { EventCardModel, EventModality } from "@/features/events/types";
import { eventModalityLabels, eventStatusLabels } from "@/features/events/types";

type EventTone = "blue" | "teal" | "violet";

type EventCardProperties = Readonly<{
  event: EventCardModel;
  featured: boolean;
}>;

const modalityTones: Readonly<Record<EventModality, EventTone>> = {
  HYBRID: "teal",
  IN_PERSON: "blue",
  VIRTUAL: "violet",
};

const toneIcons: Readonly<Record<EventTone, typeof Cloud>> = {
  blue: Cloud,
  teal: Bot,
  violet: Workflow,
};

export function EventCard({ event, featured }: EventCardProperties): React.ReactNode {
  const tone = modalityTones[event.modality];
  const EventIcon = toneIcons[tone];
  const actionLabel = event.status === "ACTIVE" ? "Ver detalles e inscribirme" : event.status === "FINISHED" ? "Ver resumen del evento" : "Más información";
  const formattedDate = new Intl.DateTimeFormat("es-EC", {
    dateStyle: "medium",
    timeZone: "America/Guayaquil",
  }).format(new Date(event.starts_at));

  return (
    <article className="event-card surface" data-featured={featured}>
      <div className="event-card__image" data-tone={tone === "blue" ? undefined : tone}>
        {event.image_url === null
          ? <EventIcon aria-hidden="true" />
          : <Image alt={`Imagen de ${event.title}`} fill sizes="(min-width: 1100px) 33vw, (min-width: 700px) 50vw, 100vw" src={event.image_url} />}
        <span className={`status-pill status-pill--${event.status.toLowerCase()}`}>{eventStatusLabels[event.status]}</span>
      </div>
      <div className="event-card__content">
        <div className="event-card__metadata"><span><CalendarDays aria-hidden="true" size={13} /> {formattedDate}</span><span className="status-pill status-pill--open">{eventModalityLabels[event.modality]}</span></div>
        <h2>{event.title}</h2>
        <p>{event.summary}</p>
        <div className="event-card__location"><MapPin aria-hidden="true" size={14} />{event.location}</div>
        <Link className={featured ? "button button--primary" : "button button--secondary"} href={`/eventos/${event.slug}`}>{actionLabel}<ArrowRight size={15} /></Link>
      </div>
    </article>
  );
}
