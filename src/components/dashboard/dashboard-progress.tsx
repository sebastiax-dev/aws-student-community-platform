import { Award, CheckCircle2, CircleAlert, Sparkles } from "lucide-react";

import type { DashboardData, DashboardPointHistory } from "@/features/dashboard/types";

type DashboardProgressProperties = Readonly<{
  data: DashboardData;
  limit: number;
}>;

const pointActionLabels: Readonly<Record<DashboardPointHistory["action"], string>> = {
  ATTENDANCE: "Asistencia registrada",
  ATTENDANCE_REVERSAL: "Corrección de asistencia",
  MANUAL_ADJUSTMENT: "Ajuste administrativo",
  REGISTRATION: "Inscripción al evento",
};

function formatEcuadorDate(isoDate: string): string {
  return new Intl.DateTimeFormat("es-EC", { dateStyle: "medium", timeZone: "America/Guayaquil" }).format(new Date(isoDate));
}

function formatPoints(points: number): string {
  return `${points > 0 ? "+" : ""}${points}`;
}

export function DashboardProgress({ data, limit }: DashboardProgressProperties): React.ReactNode {
  const certifications = data.progress.certifications.slice(0, limit);
  const pointsHistory = data.progress.points_history.slice(0, limit);

  return <section aria-label="Progreso y reconocimientos" className="dashboard-progress-grid"><article className="surface progress-panel"><div className="progress-panel__heading"><div><p className="eyebrow"><Sparkles size={13} /> PROGRESO</p><h2>Mis puntos</h2></div><strong>{data.stats.total_points}</strong></div>{pointsHistory.length === 0 ? <p className="progress-panel__empty">Tus puntos aparecerán al iniciar una inscripción o cuando el equipo valide tu asistencia.</p> : <ol className="progress-history">{pointsHistory.map((point) => <li key={point.id}><div><strong>{pointActionLabels[point.action]}</strong><span>{point.event_title ?? "Actividad de comunidad"} · {formatEcuadorDate(point.created_at)}</span></div><b data-negative={point.points < 0}>{formatPoints(point.points)}</b></li>)}</ol>}</article><article className="surface progress-panel"><div className="progress-panel__heading"><div><p className="eyebrow"><Award size={13} /> RECONOCIMIENTOS</p><h2>Certificaciones</h2></div><strong>{data.stats.total_certifications}</strong></div>{certifications.length === 0 ? <p className="progress-panel__empty">Cuando el equipo emita un certificado, quedará registrado aquí.</p> : <ul className="certification-list">{certifications.map((certificate) => <li key={certificate.id}><span className={certificate.revoked_at === null ? "certification-list__icon" : "certification-list__icon certification-list__icon--revoked"}>{certificate.revoked_at === null ? <CheckCircle2 size={17} /> : <CircleAlert size={17} />}</span><div><strong>{certificate.certificate_name}</strong><span>{certificate.event_title ?? "Reconocimiento de comunidad"} · {formatEcuadorDate(certificate.issued_at)}</span></div>{certificate.revoked_at === null ? null : <small>Revocado</small>}</li>)}</ul>}</article></section>;
}
