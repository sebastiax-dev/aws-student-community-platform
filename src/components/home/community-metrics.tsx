import { Award, CalendarDays, FolderKanban, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { CommunityContent } from "@/features/admin/types";

type Metric = Readonly<{
  Icon: LucideIcon;
  label: string;
  value: string;
}>;

export function CommunityMetrics({ content }: Readonly<{ content: CommunityContent }>): React.ReactNode {
  const metrics: readonly Metric[] = [
    { Icon: UsersRound, value: content.activeMembers, label: "Miembros activos" },
    { Icon: CalendarDays, value: content.eventsPerCycle, label: "Eventos por ciclo" },
    { Icon: Award, value: content.certificatesIssued, label: "Certificaciones emitidas" },
    { Icon: FolderKanban, value: content.projectsDeveloped, label: "Proyectos desarrollados" },
  ];

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
