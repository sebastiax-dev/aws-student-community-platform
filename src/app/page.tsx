import { ArrowRight, CalendarDays, UsersRound } from "lucide-react";
import Link from "next/link";

import { EventCard } from "@/components/events/event-card";
import { CloudScene } from "@/components/home/cloud-scene";
import { CommunityMetrics } from "@/components/home/community-metrics";
import { SiteHeader } from "@/components/layout/site-header";
import { MotionEventCard } from "@/components/motion/reveal";
import { listHomeEvents } from "@/features/events/queries";
import { eventModalityLabels } from "@/features/events/types";

export const dynamic = "force-dynamic";

export default async function HomePage(): Promise<React.ReactNode> {
  const events = await listHomeEvents();
  const featuredEvent = events[0] ?? null;
  const featuredDate = featuredEvent === null ? null : new Date(featuredEvent.starts_at);
  const featuredDay = featuredDate === null ? "—" : new Intl.DateTimeFormat("es-EC", { day: "2-digit", timeZone: "America/Guayaquil" }).format(featuredDate);
  const featuredMonth = featuredDate === null ? "PRONTO" : new Intl.DateTimeFormat("es-EC", { month: "short", timeZone: "America/Guayaquil" }).format(featuredDate).replace(".", "").toUpperCase();
  const featuredTime = featuredDate === null ? null : new Intl.DateTimeFormat("es-EC", { hour: "2-digit", minute: "2-digit", timeZone: "America/Guayaquil" }).format(featuredDate);

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
              <div className="feature-event__main"><span className="date-block"><strong>{featuredDay}</strong><span>{featuredMonth}</span></span><div><p className="eyebrow"><CalendarDays size={12} /> PRÓXIMO EVENTO</p><h2>{featuredEvent?.title ?? "Nueva programación en preparación"}</h2><p>{featuredEvent === null ? "El equipo publicará aquí el siguiente encuentro de la comunidad." : `${featuredTime} · ${eventModalityLabels[featuredEvent.modality]} · ${featuredEvent.location}`}</p></div></div>
              <Link className="button button--primary" href={featuredEvent === null ? "/eventos" : `/eventos/${featuredEvent.slug}`}>{featuredEvent?.status === "ACTIVE" ? "Inscribirme" : "Ver eventos"} <ArrowRight size={16} /></Link>
            </article>
          </div>
          <CloudScene />
        </section>
        <section aria-labelledby="upcoming-events" id="eventos">
          <div className="section-heading"><h2 id="upcoming-events">Próximos eventos</h2><Link className="section-link" href="/eventos">Ver todos los eventos <ArrowRight size={15} /></Link></div>
          {events.length === 0
            ? <div className="empty-state surface"><CalendarDays aria-hidden="true" size={30} /><h3>Programación en preparación</h3><p>Los eventos aparecerán aquí una vez que un administrador los publique.</p></div>
            : <div className="event-grid">{events.map((event, index) => <MotionEventCard delay={index * 0.08} key={event.id}><EventCard event={event} featured={index === 0} /></MotionEventCard>)}</div>}
        </section>
        <section id="comunidad"><CommunityMetrics /></section>
      </main>
    </div>
  );
}
