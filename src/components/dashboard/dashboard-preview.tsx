import { Award, CalendarDays, ChevronRight, Medal, Star, UsersRound } from "lucide-react";

import { eventFixtures } from "@/features/events/event-fixtures";

type DashboardStat = Readonly<{
  accent: string;
  Icon: typeof CalendarDays;
  label: string;
  progress: string;
  value: string;
}>;

const dashboardStats: readonly DashboardStat[] = [
  { Icon: CalendarDays, label: "Eventos inscritos", value: "5", progress: "66%", accent: "#1689ff" },
  { Icon: UsersRound, label: "Asistencias", value: "4", progress: "62%", accent: "#19c980" },
  { Icon: Award, label: "Certificaciones", value: "3", progress: "76%", accent: "#a753ff" },
  { Icon: Star, label: "Puntos totales", value: "230", progress: "60%", accent: "#f4ab28" },
];

export function DashboardPreview(): React.ReactNode {
  return (
    <main className="content-wrap dashboard-preview">
      <div className="dashboard-preview__bar"><div><p className="eyebrow">VISTA DE DISEÑO</p><h1 className="dashboard-preview__title">Dashboard <span>estudiante</span></h1></div></div>
      <section aria-label="Resumen de progreso" className="stats-grid">
        {dashboardStats.map(({ Icon, accent, label, progress, value }) => (
          <article className="stat-card surface" key={label}>
            <div className="stat-card__top"><span className="stat-card__icon" style={{ color: accent }}><Icon size={20} /></span>{label}</div>
            <strong className="stat-card__value" style={{ color: accent }}>{value}</strong>
            <div className="progress-line"><span style={{ background: accent, width: progress }} /></div>
          </article>
        ))}
      </section>
      <section className="dashboard-layout">
        <article className="surface event-list"><div className="section-heading"><h2>Mis eventos</h2><span className="section-link">Ver todos <ChevronRight size={15} /></span></div>
          {eventFixtures.slice(0, 5).map((event) => <div className="event-list__item" key={event.id}><div className="event-list__date">{event.day}<span>{event.month}</span></div><div><h3>{event.title}</h3><p>{event.modality} · {event.location}</p></div><span className={`status-pill status-pill--${event.status}`}>{event.status === "open" ? "Inscrito" : event.status === "soon" ? "Próximamente" : "Asistido"}</span></div>)}
        </article>
        <div>
          <article className="surface level-card"><div className="section-heading"><h2>Mi nivel en la comunidad</h2></div><div className="level-card__progress"><div><span className="level-card__badge"><Medal size={28} /></span><h3>Cloud Builder</h3><p>Nivel 2 · 1,400 / 2,000 XP</p></div><div className="level-card__ring">70%</div></div><div className="progress-line"><span style={{ width: "70%" }} /></div></article>
          <article className="surface level-card" style={{ marginTop: "1rem" }}><div className="section-heading"><h2>Mis puntos</h2><span className="section-link">Ver historial</span></div><div className="chart"><svg aria-label="Gráfico estático de puntos" role="img" viewBox="0 0 320 120"><polyline fill="none" points="4,101 52,74 103,65 151,42 197,54 248,34 316,37" stroke="#1689ff" strokeWidth="3" /><polyline fill="rgba(0, 125, 255, 0.12)" points="4,101 52,74 103,65 151,42 197,54 248,34 316,37 316,120 4,120" stroke="none" /></svg></div></article>
        </div>
      </section>
    </main>
  );
}
