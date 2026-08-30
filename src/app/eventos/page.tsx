import { CalendarDays } from "lucide-react";
import Link from "next/link";

import { EventCard } from "@/components/events/event-card";
import { EventNavigation, type EventFilter, type EventOrder } from "@/components/events/event-navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { MotionEventCard } from "@/components/motion/reveal";
import { listPublishedEvents } from "@/features/events/queries";
import type { EventCardModel } from "@/features/events/types";

export const dynamic = "force-dynamic";

type EventsPageProperties = Readonly<{
  searchParams: Promise<{ filtro?: string; orden?: string }>;
}>;

function parseEventFilter(candidate: string | undefined): EventFilter {
  return candidate === "finished" || candidate === "in_person" || candidate === "virtual" || candidate === "upcoming" ? candidate : "all";
}

function parseEventOrder(candidate: string | undefined): EventOrder {
  return candidate === "oldest" || candidate === "upcoming" ? candidate : "newest";
}

function filterEvents(events: readonly EventCardModel[], filter: EventFilter): readonly EventCardModel[] {
  if (filter === "in_person") {
    return events.filter((event) => event.modality === "IN_PERSON" || event.modality === "HYBRID");
  }
  if (filter === "virtual") {
    return events.filter((event) => event.modality === "VIRTUAL" || event.modality === "HYBRID");
  }
  if (filter === "upcoming") {
    return events.filter((event) => event.status !== "FINISHED");
  }
  if (filter === "finished") {
    return events.filter((event) => event.status === "FINISHED");
  }
  return events;
}

function orderEvents(events: readonly EventCardModel[], order: EventOrder): readonly EventCardModel[] {
  const direction = order === "oldest" ? 1 : -1;
  if (order === "upcoming") {
    return [...events].sort((left, right) => new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime());
  }
  return [...events].sort((left, right) => direction * (new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime()));
}

export default async function EventsPage({ searchParams }: EventsPageProperties): Promise<React.ReactNode> {
  const parameters = await searchParams;
  const activeFilter = parseEventFilter(parameters.filtro);
  const activeOrder = parseEventOrder(parameters.orden);
  const events = orderEvents(filterEvents(await listPublishedEvents(), activeFilter), activeOrder);

  return (
    <div className="page-shell">
      <SiteHeader activePage="events" />
      <main className="content-wrap events-page" id="eventos">
        <section className="events-intro">
          <p className="eyebrow">PROGRAMACIÓN · COMUNIDAD</p>
          <h1>EVENTOS <span>DEL CICLO</span></h1>
          <p>Participa en nuestros eventos, talleres y workshops diseñados para impulsar tus habilidades en la nube y conectar con la comunidad.</p>
        </section>
        <EventNavigation activeFilter={activeFilter} activeOrder={activeOrder} />
        {events.length === 0
          ? <section className="empty-state surface"><CalendarDays aria-hidden="true" size={32} /><h2>No hay eventos para este filtro</h2><p>Los próximos eventos aparecerán aquí cuando el equipo los publique.</p></section>
          : <section aria-label="Listado de eventos" className="event-grid">{events.map((event, index) => <MotionEventCard delay={index * 0.08} key={event.id}><EventCard event={event} featured={index === 0} /></MotionEventCard>)}</section>}
      </main>
    </div>
  );
}
