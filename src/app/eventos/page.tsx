import { CalendarDays, Monitor, SlidersHorizontal, UsersRound } from "lucide-react";

import { EventCard } from "@/components/events/event-card";
import { SiteHeader } from "@/components/layout/site-header";
import { eventFixtures } from "@/features/events/event-fixtures";

const filterItems = [
  { label: "Todos los eventos", Icon: CalendarDays },
  { label: "Presenciales", Icon: UsersRound },
  { label: "Virtuales", Icon: Monitor },
  { label: "Próximos", Icon: SlidersHorizontal },
] as const;

export default function EventsPage(): React.ReactNode {
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
          {filterItems.map(({ Icon, label }, index) => <a className="filter-chip" data-active={index === 0} href="#eventos" key={label}><Icon size={15} /> {label}</a>)}
        </nav>
        <section aria-label="Listado de eventos" className="event-grid">
          {eventFixtures.map((event, index) => <EventCard event={event} featured={index === 0} key={event.id} />)}
        </section>
      </main>
    </div>
  );
}
