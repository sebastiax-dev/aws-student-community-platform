import { CalendarDays, ClipboardCheck, Link as LinkIcon, LockKeyhole, Plus, Trash2, Users } from "lucide-react";

import { SubmitButton } from "@/components/forms/submit-button";
import {
  createEventAgendaItemAction,
  createEventResourceAction,
  createEventSpeakerAction,
  deleteEventAgendaItemAction,
  deleteEventResourceAction,
  deleteEventSpeakerAction,
  updateEventPrivateDetailsAction,
  updateEventRegistrationStatusAction,
} from "@/features/events/actions";
import type { AdminEventDetail, AdminEventRegistration } from "@/features/events/types";
import { registrationStatusLabels } from "@/features/events/types";
import { formatEcuadorDateTimeInput } from "@/features/events/validation";

type EventDetailManagementProperties = Readonly<{
  event: AdminEventDetail;
  registrations: readonly AdminEventRegistration[];
}>;

function formatEcuadorDateTime(isoDate: string): string {
  return new Intl.DateTimeFormat("es-EC", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Guayaquil",
  }).format(new Date(isoDate));
}

export function EventDetailManagement({ event, registrations }: EventDetailManagementProperties): React.ReactNode {
  const privateDetailsAction = updateEventPrivateDetailsAction.bind(null, event.id, event.slug);
  const speakerAction = createEventSpeakerAction.bind(null, event.id, event.slug);
  const agendaAction = createEventAgendaItemAction.bind(null, event.id, event.slug);
  const resourceAction = createEventResourceAction.bind(null, event.id, event.slug);

  return (
    <div className="admin-management">
      <section className="admin-form surface">
        <div className="admin-form__heading"><div><p className="eyebrow"><LockKeyhole size={14} /> SOLO ADMIN</p><h2>Detalles privados</h2><p>Estos datos nunca aparecen en las consultas públicas.</p></div></div>
        <form action={privateDetailsAction} className="admin-form__grid">
          <label className="admin-form__wide">URL interna de reunión<input defaultValue={event.meeting_url ?? ""} maxLength={2048} name="meetingUrl" placeholder="https://..." type="url" /></label>
          <label className="admin-form__wide">Notas internas<textarea defaultValue={event.internal_notes ?? ""} maxLength={4000} name="internalNotes" rows={5} /></label>
          <div className="admin-form__wide admin-inline-actions"><SubmitButton className="button button--secondary" pendingLabel="Guardando…">Guardar detalles privados</SubmitButton></div>
        </form>
      </section>

      <section className="admin-form surface">
        <div className="admin-form__heading"><div><p className="eyebrow"><Users size={14} /> PROGRAMA</p><h2>Ponentes</h2></div><span className="admin-count">{event.speakers.length}</span></div>
        {event.speakers.length === 0 ? <p className="admin-empty-copy">Todavía no hay ponentes.</p> : <div className="admin-child-list">{event.speakers.map((speaker) => {
          const deleteAction = deleteEventSpeakerAction.bind(null, event.id, event.slug, speaker.id);
          return <article key={speaker.id}><div><strong>{speaker.sort_order}. {speaker.name}</strong><span>{speaker.role_title ?? "Sin cargo"}</span>{speaker.bio === null ? null : <p>{speaker.bio}</p>}</div><form action={deleteAction}><SubmitButton ariaLabel={`Eliminar a ${speaker.name}`} className="icon-button icon-button--danger" pendingLabel="…"><Trash2 size={16} /></SubmitButton></form></article>;
        })}</div>}
        <form action={speakerAction} className="admin-form__grid admin-subform">
          <label>Nombre<input maxLength={120} minLength={2} name="name" required type="text" /></label>
          <label>Cargo o afiliación<input maxLength={160} name="roleTitle" type="text" /></label>
          <label>Orden<input min={0} name="sortOrder" required type="number" /></label>
          <label className="admin-form__wide">Biografía breve<textarea maxLength={1000} name="bio" rows={3} /></label>
          <div className="admin-form__wide admin-inline-actions"><SubmitButton className="button button--secondary" pendingLabel="Añadiendo…"><Plus size={15} /> Añadir ponente</SubmitButton></div>
        </form>
      </section>

      <section className="admin-form surface">
        <div className="admin-form__heading"><div><p className="eyebrow"><CalendarDays size={14} /> CRONOGRAMA</p><h2>Agenda</h2></div><span className="admin-count">{event.agenda.length}</span></div>
        {event.agenda.length === 0 ? <p className="admin-empty-copy">Todavía no hay actividades en la agenda.</p> : <div className="admin-child-list">{event.agenda.map((item) => {
          const deleteAction = deleteEventAgendaItemAction.bind(null, event.id, event.slug, item.id);
          return <article key={item.id}><div><strong>{item.sort_order}. {item.title}</strong><span>{formatEcuadorDateTime(item.starts_at)}{item.ends_at === null ? "" : ` – ${formatEcuadorDateTime(item.ends_at)}`}</span>{item.description === null ? null : <p>{item.description}</p>}</div><form action={deleteAction}><SubmitButton ariaLabel={`Eliminar ${item.title}`} className="icon-button icon-button--danger" pendingLabel="…"><Trash2 size={16} /></SubmitButton></form></article>;
        })}</div>}
        <form action={agendaAction} className="admin-form__grid admin-subform">
          <label className="admin-form__wide">Título<input maxLength={160} minLength={2} name="title" required type="text" /></label>
          <label>Inicio<input defaultValue={formatEcuadorDateTimeInput(event.starts_at)} name="startsAt" required type="datetime-local" /></label>
          <label>Fin<input name="endsAt" type="datetime-local" /></label>
          <label>Orden<input min={0} name="sortOrder" required type="number" /></label>
          <label className="admin-form__wide">Descripción<textarea maxLength={1000} name="description" rows={3} /></label>
          <div className="admin-form__wide admin-inline-actions"><SubmitButton className="button button--secondary" pendingLabel="Añadiendo…"><Plus size={15} /> Añadir actividad</SubmitButton></div>
        </form>
      </section>

      <section className="admin-form surface">
        <div className="admin-form__heading"><div><p className="eyebrow"><LinkIcon size={14} /> MATERIALES</p><h2>Recursos</h2></div><span className="admin-count">{event.resources.length}</span></div>
        {event.resources.length === 0 ? <p className="admin-empty-copy">Todavía no hay recursos.</p> : <div className="admin-child-list">{event.resources.map((resource) => {
          const deleteAction = deleteEventResourceAction.bind(null, event.id, event.slug, resource.id);
          return <article key={resource.id}><div><strong>{resource.sort_order}. {resource.label}</strong><span>{resource.is_published ? "Público" : "Privado"}</span><a href={resource.url} rel="noreferrer" target="_blank">{resource.url}</a></div><form action={deleteAction}><SubmitButton ariaLabel={`Eliminar ${resource.label}`} className="icon-button icon-button--danger" pendingLabel="…"><Trash2 size={16} /></SubmitButton></form></article>;
        })}</div>}
        <form action={resourceAction} className="admin-form__grid admin-subform">
          <label>Nombre<input maxLength={120} minLength={2} name="label" required type="text" /></label>
          <label>Orden<input min={0} name="sortOrder" required type="number" /></label>
          <label className="admin-form__wide">URL HTTPS<input maxLength={2048} name="url" required type="url" /></label>
          <label className="admin-form__checkbox"><input name="isPublished" type="checkbox" /> Visible en la página pública</label>
          <div className="admin-form__wide admin-inline-actions"><SubmitButton className="button button--secondary" pendingLabel="Añadiendo…"><Plus size={15} /> Añadir recurso</SubmitButton></div>
        </form>
      </section>

      <section className="admin-form surface">
        <div className="admin-form__heading"><div><p className="eyebrow"><ClipboardCheck size={14} /> SEGUIMIENTO</p><h2>Inscripciones</h2></div><span className="admin-count">{registrations.length}</span></div>
        {registrations.length === 0 ? <p className="admin-empty-copy">Todavía no hay inscripciones registradas.</p> : <div className="registration-table">{registrations.map((registration) => {
          const updateStatusAction = updateEventRegistrationStatusAction.bind(null, event.id, event.slug, registration.id);
          return <article key={registration.id}><div><strong>{registration.display_name}</strong><span>{formatEcuadorDateTime(registration.registered_at)} · {registration.source === "GOOGLE_FORMS" ? "Google Forms" : "Plataforma web"}</span></div><form action={updateStatusAction}><select aria-label={`Estado de inscripción de ${registration.display_name}`} defaultValue={registration.status} name="status">{Object.entries(registrationStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><SubmitButton className="button button--secondary" pendingLabel="Actualizando…">Actualizar</SubmitButton></form></article>;
        })}</div>}
      </section>
    </div>
  );
}
