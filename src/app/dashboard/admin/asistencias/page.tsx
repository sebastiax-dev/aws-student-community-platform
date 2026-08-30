import { CalendarCheck2, Search } from "lucide-react";

import { setAdminAttendanceAction } from "@/features/admin/actions";
import { listAdminAttendance } from "@/features/admin/queries";
import { identifierSchema } from "@/features/admin/validation";
import { listAdminEvents } from "@/features/events/queries";
import { registrationStatusLabels } from "@/features/events/types";

export const dynamic = "force-dynamic";

type AdminAttendancePageProperties = Readonly<{
  searchParams: Promise<{ buscar?: string; error?: string; evento?: string; status?: string }>;
}>;

export default async function AdminAttendancePage({ searchParams }: AdminAttendancePageProperties): Promise<React.ReactNode> {
  const parameters = await searchParams;
  const search = parameters.buscar?.trim() ?? "";
  const eventIdResult = identifierSchema.safeParse(parameters.evento);
  const eventId = eventIdResult.success ? eventIdResult.data : null;
  const [attendance, events] = await Promise.all([listAdminAttendance(search, eventId), listAdminEvents()]);
  return (
    <section className="admin-section">
      {parameters.status === "attendance_updated" ? <div aria-live="polite" className="auth-message">La asistencia fue actualizada y los puntos se recalcularon.</div> : null}
      <div className="admin-section__heading"><div><h2>Gestión de asistencia</h2><p>Registra asistencia sin tener que abrir cada evento individualmente.</p></div><span className="admin-count">{attendance.length}</span></div>
      <form className="surface admin-search admin-search--filters" method="get"><label><span className="sr-only">Buscar inscripción</span><Search size={17} /><input defaultValue={search} name="buscar" placeholder="Usuario, correo o evento" /></label><select aria-label="Filtrar por evento" defaultValue={eventId ?? ""} name="evento"><option value="">Todos los eventos</option>{events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}</select><button className="button button--primary" type="submit">Filtrar</button></form>
      {attendance.length === 0 ? <div className="empty-state surface"><CalendarCheck2 size={30} /><h3>No hay inscripciones para revisar</h3><p>Las personas inscritas aparecerán aquí.</p></div> : <div className="admin-attendance-list">{attendance.map((record) => {
        const attendanceAction = setAdminAttendanceAction.bind(null, record.event_id, record.user_id);
        return <article className="surface admin-attendance-row" key={record.registration_id}><div><span className={`status-pill ${record.attended ? "status-pill--active" : "status-pill--planned"}`}>{record.attended ? "ASISTIÓ" : "PENDIENTE"}</span><h3>{record.display_name}</h3><p>{record.email}</p></div><div><strong>{record.event_title}</strong><span>{new Intl.DateTimeFormat("es-EC", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Guayaquil" }).format(new Date(record.event_starts_at))}</span><span>{registrationStatusLabels[record.registration_status]}</span></div><form action={attendanceAction}><input name="attended" type="hidden" value={record.attended ? "false" : "true"} /><button className={record.attended ? "button button--secondary" : "button button--primary"} type="submit">{record.attended ? "Retirar asistencia" : "Registrar asistencia"}</button></form></article>;
      })}</div>}
    </section>
  );
}
