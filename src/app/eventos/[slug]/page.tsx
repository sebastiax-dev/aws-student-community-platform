import { ArrowLeft, CalendarDays, Clock3, ExternalLink, MapPin, Presentation, UsersRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteHeader } from "@/components/layout/site-header";
import { SubmitButton } from "@/components/forms/submit-button";
import { getAuthenticatedUserId } from "@/features/auth/session";
import { registerForEventAction } from "@/features/events/actions";
import { getOwnEventRegistrationStatus, getPublishedEventBySlug } from "@/features/events/queries";
import type { PublicEventDetail, RegistrationStatus } from "@/features/events/types";
import { eventModalityLabels, eventStatusLabels } from "@/features/events/types";

export const dynamic = "force-dynamic";

type EventDetailPageProperties = Readonly<{
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}>;

const registrationMessages: Readonly<Record<string, string>> = {
  event_full: "El evento alcanzó su capacidad máxima.",
  event_not_available: "Este evento ya no admite inscripciones.",
  registration_closed: "La ventana de inscripción ya cerró.",
  registration_not_open: "La inscripción todavía no está abierta.",
  registration_unavailable: "El enlace externo de inscripción no está disponible.",
};

const registrationStatusLabels: Readonly<Record<RegistrationStatus, string>> = {
  ATTENDED: "Asistencia registrada",
  CANCELLED: "Inscripción cancelada",
  CONFIRMED: "Inscripción confirmada",
  INITIATED: "Seguimiento iniciado",
  NO_SHOW: "Ausencia registrada",
};

function isRegistrationOpen(event: PublicEventDetail, now: Date): boolean {
  if (event.status !== "ACTIVE" || event.registration_url === null) {
    return false;
  }
  if (event.registration_opens_at !== null && now < new Date(event.registration_opens_at)) {
    return false;
  }
  if (event.registration_closes_at !== null && now > new Date(event.registration_closes_at)) {
    return false;
  }
  return true;
}

export default async function EventDetailPage({ params, searchParams }: EventDetailPageProperties): Promise<React.ReactNode> {
  const { slug } = await params;
  const event = await getPublishedEventBySlug(slug);
  if (event === null) {
    notFound();
  }

  const userId = await getAuthenticatedUserId();
  const registrationStatus = userId === null ? null : await getOwnEventRegistrationStatus(event.id, userId);
  const parameters = await searchParams;
  const registrationMessage = parameters.error === undefined ? null : registrationMessages[parameters.error] ?? null;
  const registrationOpen = isRegistrationOpen(event, new Date());
  const publicRegistrationUrl = registrationOpen && event.registration_url !== null ? event.registration_url : null;
  const registerAction = registerForEventAction.bind(null, event.id, event.slug);
  const startsAt = new Date(event.starts_at);
  const formattedDate = new Intl.DateTimeFormat("es-EC", { dateStyle: "full", timeZone: "America/Guayaquil" }).format(startsAt);
  const formattedTime = new Intl.DateTimeFormat("es-EC", { hour: "2-digit", minute: "2-digit", timeZone: "America/Guayaquil" }).format(startsAt);

  return (
    <div className="page-shell">
      <SiteHeader activePage="events" />
      <main className="content-wrap event-detail">
        <Link className="event-detail__back" href="/eventos"><ArrowLeft size={16} /> Volver a eventos</Link>
        <section className="event-detail__hero surface">
          <div className="event-detail__cover">
            {event.image_url === null ? <Presentation aria-hidden="true" size={62} /> : <Image alt={`Imagen de ${event.title}`} fill priority sizes="(min-width: 900px) 45vw, 100vw" src={event.image_url} />}
          </div>
          <div className="event-detail__intro">
            <span className={`status-pill status-pill--${event.status.toLowerCase()}`}>{eventStatusLabels[event.status]}</span>
            <h1>{event.title}</h1>
            <p>{event.summary}</p>
            <div className="event-detail__facts">
              <span><CalendarDays size={16} /> {formattedDate}</span>
              <span><Clock3 size={16} /> {formattedTime}</span>
              <span><MapPin size={16} /> {event.location}</span>
              <span><UsersRound size={16} /> {eventModalityLabels[event.modality]}{event.capacity === null ? "" : ` · Cupo ${event.capacity}`}</span>
            </div>
            {registrationMessage === null ? null : <div aria-live="polite" className="auth-message">{registrationMessage}</div>}
            {registrationStatus === null ? null : <p className="event-detail__registration-state">Estado personal: <strong>{registrationStatusLabels[registrationStatus]}</strong></p>}
            {publicRegistrationUrl === null
              ? <p className="event-detail__registration-state">Las inscripciones no están disponibles en este momento.</p>
              : userId === null
                ? <div className="event-detail__actions"><Link className="button button--primary" href={`/login?next=${encodeURIComponent(`/eventos/${event.slug}`)}`}>Ingresar para seguimiento</Link><a className="button button--secondary" href={publicRegistrationUrl} rel="noreferrer" target="_blank">Continuar sin seguimiento <ExternalLink size={15} /></a><p>Sin una cuenta podrás completar el formulario externo, pero la plataforma no podrá mostrar tu progreso.</p></div>
                : <form action={registerAction}><SubmitButton className="button button--primary" pendingLabel="Preparando inscripción…">{registrationStatus === null || registrationStatus === "CANCELLED" ? "Inscribirme" : "Abrir formulario de inscripción"} <ExternalLink size={15} /></SubmitButton></form>}
          </div>
        </section>

        <div className="event-detail__grid">
          <section className="surface event-detail__section"><p className="eyebrow">ACERCA DEL EVENTO</p><h2>Qué aprenderás</h2><p className="event-detail__prose">{event.description}</p>{event.requirements === null ? null : <><h3>Requisitos</h3><p className="event-detail__prose">{event.requirements}</p></>}</section>
          <aside className="surface event-detail__section"><p className="eyebrow">SPEAKERS</p><h2>Personas que participan</h2>{event.speakers.length === 0 ? <p className="event-detail__muted">Los speakers se anunciarán próximamente.</p> : <div className="speaker-list">{event.speakers.map((speaker) => <article key={speaker.id}><span className="speaker-list__image">{speaker.image_url === null ? speaker.name.slice(0, 1).toUpperCase() : <Image alt={`Foto de ${speaker.name}`} fill sizes="44px" src={speaker.image_url} unoptimized />}</span><div><h3>{speaker.name}</h3><p>{speaker.role_title ?? "Speaker invitado"}</p>{speaker.bio === null ? null : <small>{speaker.bio}</small>}</div></article>)}</div>}</aside>
        </div>

        {event.agenda.length === 0 ? null : <section className="surface event-detail__section"><p className="eyebrow">AGENDA</p><h2>Programa</h2><div className="agenda-list">{event.agenda.map((item) => <article key={item.id}><time>{new Intl.DateTimeFormat("es-EC", { hour: "2-digit", minute: "2-digit", timeZone: "America/Guayaquil" }).format(new Date(item.starts_at))}</time><div><h3>{item.title}</h3>{item.description === null ? null : <p>{item.description}</p>}</div></article>)}</div></section>}
        {event.resources.length === 0 ? null : <section className="surface event-detail__section"><p className="eyebrow">RECURSOS</p><h2>Material del evento</h2><div className="resource-list">{event.resources.map((resource) => <a href={resource.url} key={resource.id} rel="noreferrer" target="_blank">{resource.label}<ExternalLink size={15} /></a>)}</div></section>}
      </main>
    </div>
  );
}
