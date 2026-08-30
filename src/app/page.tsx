import { ArrowRight, CalendarDays, UsersRound } from "lucide-react";
import Link from "next/link";

import { EventCard } from "@/components/events/event-card";
import { CloudScene } from "@/components/home/cloud-scene";
import { CommunityMetrics } from "@/components/home/community-metrics";
import { CommunityMembers } from "@/components/home/community-members";
import { SiteHeader } from "@/components/layout/site-header";
import { MotionEventCard, Reveal } from "@/components/motion/reveal";
import { getSiteContent, listPublicTeamMembers } from "@/features/admin/queries";
import { listHomeEvents } from "@/features/events/queries";
import { eventModalityLabels } from "@/features/events/types";

export const dynamic = "force-dynamic";

export default async function HomePage(): Promise<React.ReactNode> {
  const [events, content, members] = await Promise.all([listHomeEvents(), getSiteContent(), listPublicTeamMembers()]);
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
          <Reveal className="hero__copy" delay={0.08}>
            <p className="eyebrow">{content.home.eyebrow}</p>
            <h1>{content.home.titleLead} <span>{content.home.titleAccent}</span><em>{content.home.titleSuffix}</em></h1>
            <p>{content.home.description}</p>
            <div className="hero__actions">
              <Link className="button button--primary" href={content.home.primaryCtaHref}>{content.home.primaryCtaLabel} <ArrowRight size={17} /></Link>
              <a className="button button--secondary" href={content.home.secondaryCtaHref}>{content.home.secondaryCtaLabel} <UsersRound size={17} /></a>
            </div>
            <article className="feature-event surface">
              <div className="feature-event__main"><span className="date-block"><strong>{featuredDay}</strong><span>{featuredMonth}</span></span><div><p className="eyebrow"><CalendarDays size={12} /> PRÓXIMO EVENTO</p><h2>{featuredEvent?.title ?? "Nueva programación en preparación"}</h2><p>{featuredEvent === null ? "El equipo publicará aquí el siguiente encuentro de la comunidad." : `${featuredTime} · ${eventModalityLabels[featuredEvent.modality]} · ${featuredEvent.location}`}</p></div></div>
              <Link className="button button--primary" href={featuredEvent === null ? "/eventos" : `/eventos/${featuredEvent.slug}`}>{featuredEvent?.status === "ACTIVE" ? "Inscribirme" : "Ver eventos"} <ArrowRight size={16} /></Link>
            </article>
          </Reveal>
          <CloudScene />
        </section>
        <section aria-labelledby="upcoming-events" id="eventos">
          <div className="section-heading"><h2 id="upcoming-events">Próximos eventos</h2><Link className="section-link" href="/eventos">Ver todos los eventos <ArrowRight size={15} /></Link></div>
          {events.length === 0
            ? <div className="empty-state surface"><CalendarDays aria-hidden="true" size={30} /><h3>Programación en preparación</h3><p>Los eventos aparecerán aquí una vez que un administrador los publique.</p></div>
            : <div className="event-grid">{events.map((event, index) => <MotionEventCard delay={index * 0.08} key={event.id}><EventCard event={event} featured={index === 0} /></MotionEventCard>)}</div>}
        </section>
        <section id="comunidad"><Reveal className="community-intro" delay={0.08}><p className="eyebrow">COMUNIDAD</p><h2>{content.community.title}</h2><p>{content.community.description}</p></Reveal><CommunityMetrics content={content.community} /><CommunityMembers members={members} /></section>
      </main>
    </div>
  );
}
