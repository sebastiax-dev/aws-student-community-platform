import { Award, CalendarDays, FolderKanban, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Metric = Readonly<{
  Icon: LucideIcon;
  label: string;
  value: string;
}>;

const metrics: readonly Metric[] = [
  { Icon: UsersRound, value: "500+", label: "Miembros activos" },
  { Icon: CalendarDays, value: "12+", label: "Eventos por ciclo" },
  { Icon: Award, value: "300+", label: "Certificaciones emitidas" },
  { Icon: FolderKanban, value: "50+", label: "Proyectos desarrollados" },
];

export function CommunityMetrics(): React.ReactNode {
  return (
    <section aria-label="Métricas de comunidad" className="metric-strip surface">
      {metrics.map(({ Icon, label, value }) => (
        <article className="metric-item" key={label}>
          <Icon aria-hidden="true" size={31} />
          <div><strong>{value}</strong><span>{label}</span></div>
        </article>
      ))}
    </section>
  );
}
