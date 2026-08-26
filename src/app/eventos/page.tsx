import { CalendarDays, Monitor, SlidersHorizontal, UsersRound } from "lucide-react";
import Link from "next/link";

import { EventCard } from "@/components/events/event-card";
import { SiteHeader } from "@/components/layout/site-header";
import { listPublishedEvents } from "@/features/events/queries";
import type { EventCardModel } from "@/features/events/types";

export const dynamic = "force-dynamic";

type EventFilter = "all" | "in_person" | "upcoming" | "virtual";

type EventsPageProperties = Readonly<{
  searchParams: Promise<{ filtro?: string }>;
}>;

const filterItems: readonly Readonly<{ filter: EventFilter; href: string; label: string; Icon: typeof CalendarDays }>[] = [
  { filter: "all", href: "/eventos", label: "Todos los eventos", Icon: CalendarDays },
  { filter: "in_person", href: "/eventos?filtro=in_person", label: "Presenciales", Icon: UsersRound },
  { filter: "virtual", href: "/eventos?filtro=virtual", label: "Virtuales", Icon: Monitor },
  { filter: "upcoming", href: "/eventos?filtro=upcoming", label: "Próximos", Icon: SlidersHorizontal },
];

function parseEventFilter(candidate: string | undefined): EventFilter {
  return candidate === "in_person" || candidate === "virtual" || candidate === "upcoming" ? candidate : "all";
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
  return events;
}

export default async function EventsPage({ searchParams }: EventsPageProperties): Promise<React.ReactNode> {
  const parameters = await searchParams;
  const activeFilter = parseEventFilter(parameters.filtro);
  const events = filterEvents(await listPublishedEvents(), activeFilter);

  return (
    <div className="page-shell">
      <SiteHeader activePage="events" />
      <main className="content-wrap events-page" id="eventos">
        <section className="events-intro">
          <p className="eyebrow">PROGRAMACIÓN · COMUNIDAD</p>
          <h1>EVENTOS <span>DEL CICLO</span></h1>
          <p>Participa en nuestros eventos, talleres y workshops diseñados para impulsar tus habilidades en la nube y conectar con la comunidad.</p>
        </section>
        <nav aria-label="Filtros de eventos" className="events-toolbar">
          {filterItems.map(({ Icon, filter, href, label }) => <Link className="filter-chip" data-active={filter === activeFilter} href={href} key={filter}><Icon size={15} /> {label}</Link>)}
        </nav>
        {events.length === 0
          ? <section className="empty-state surface"><CalendarDays aria-hidden="true" size={32} /><h2>No hay eventos para este filtro</h2><p>Los próximos eventos aparecerán aquí cuando el equipo los publique.</p></section>
          : <section aria-label="Listado de eventos" className="event-grid">{events.map((event, index) => <EventCard event={event} featured={index === 0} key={event.id} />)}</section>}
      </main>
    </div>
  );
}
