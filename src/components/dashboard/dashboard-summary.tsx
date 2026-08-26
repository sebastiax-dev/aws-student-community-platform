import { CalendarDays, CheckCircle2, Clock3, UsersRound } from "lucide-react";

import type { DashboardData } from "@/features/dashboard/types";

type DashboardSummaryProperties = Readonly<{
  data: DashboardData;
}>;

const statDefinitions: readonly Readonly<{
  Icon: typeof CalendarDays;
  key: keyof DashboardData["stats"];
  label: string;
}>[] = [
  { Icon: CalendarDays, key: "active_registrations", label: "Inscripciones activas" },
  { Icon: Clock3, key: "upcoming_events", label: "Eventos próximos" },
  { Icon: CheckCircle2, key: "confirmed_registrations", label: "Confirmadas" },
  { Icon: UsersRound, key: "attended_events", label: "Asistencias" },
];

export function DashboardSummary({ data }: DashboardSummaryProperties): React.ReactNode {
  return (
    <>
      <section className="dashboard-welcome surface"><p className="eyebrow">MI ESPACIO</p><h1>Hola, {data.profile.display_name}</h1><p>Aquí encontrarás el seguimiento real de tus eventos dentro de la comunidad.</p></section>
      <section aria-label="Resumen de participación" className="stats-grid dashboard-stats">{statDefinitions.map(({ Icon, key, label }) => <article className="stat-card surface" key={key}><div className="stat-card__top"><span className="stat-card__icon"><Icon size={20} /></span>{label}</div><strong className="stat-card__value">{data.stats[key]}</strong><p>Datos actualizados desde tu historial.</p></article>)}</section>
    </>
  );
}
