import { ArrowRight, CalendarDays, UsersRound } from "lucide-react";
import Link from "next/link";

import { EventCard } from "@/components/events/event-card";
import { CloudScene } from "@/components/home/cloud-scene";
import { CommunityMetrics } from "@/components/home/community-metrics";
import { SiteHeader } from "@/components/layout/site-header";
import { eventFixtures } from "@/features/events/event-fixtures";

export default function HomePage(): React.ReactNode {
  return (
    <div className="page-shell">
      <SiteHeader activePage="home" />
      <main className="content-wrap">
        <section className="hero">
          <div className="hero__copy">
            <p className="eyebrow">CLOUD · COMMUNITY · CAREER</p>
            <h1>AWS STUDENT <span>COMMUNITY</span></h1>
            <p>Impulsamos a estudiantes a construir su futuro en la nube. Aprende, conecta y crece con AWS.</p>
            <div className="hero__actions">
              <Link className="button button--primary" href="/eventos">Explora eventos <ArrowRight size={17} /></Link>
              <a className="button button--secondary" href="#comunidad">Únete a la comunidad <UsersRound size={17} /></a>
            </div>
            <article className="feature-event surface">
              <div className="feature-event__main"><span className="date-block"><strong>24</strong><span>MAY</span></span><div><p className="eyebrow"><CalendarDays size={12} /> PRÓXIMO EVENTO</p><h2>AWSome Day 2025</h2><p>09:00 AM · Presencial · Auditorio Principal · PUCE</p></div></div>
              <a className="button button--primary" href="/eventos">Inscribirme <ArrowRight size={16} /></a>
            </article>
          </div>
          <CloudScene />
        </section>
        <section aria-labelledby="upcoming-events" id="eventos">
          <div className="section-heading"><h2 id="upcoming-events">Próximos eventos</h2><Link className="section-link" href="/eventos">Ver todos los eventos <ArrowRight size={15} /></Link></div>
          <div className="event-grid">{eventFixtures.slice(0, 3).map((event, index) => <EventCard event={event} featured={index === 0} key={event.id} />)}</div>
        </section>
        <section id="comunidad"><CommunityMetrics /></section>
      </main>
    </div>
  );
}
