import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EventForm } from "@/components/admin/event-form";
import { EventDetailManagement } from "@/components/admin/event-detail-management";
import { SubmitButton } from "@/components/forms/submit-button";
import { deleteDraftEventAction, updateEventAction } from "@/features/events/actions";
import { getAdminEventById, listAdminEventRegistrations } from "@/features/events/queries";

export const dynamic = "force-dynamic";

type EditEventPageProperties = Readonly<{
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ error?: string; status?: string }>;
}>;

const messages: Readonly<Record<string, string>> = {
  created: "El evento fue creado correctamente.",
  invalid_image: "La imagen no cumple el formato o tamaño permitido.",
  child_order_conflict: "Ese número de orden ya está en uso dentro de la sección.",
  invalid_agenda_item: "Revisa el título, orden y fechas de la actividad.",
  invalid_input: "Revisa los campos obligatorios, fechas y URLs HTTPS.",
  invalid_private_details: "Revisa que la URL privada use HTTPS y que las notas no excedan el límite.",
  invalid_registration_status: "El estado de inscripción seleccionado no es válido.",
  invalid_resource: "Revisa el nombre, orden y URL HTTPS del recurso.",
  invalid_speaker: "Revisa el nombre, orden y datos del ponente.",
  agenda_item_created: "La actividad fue añadida a la agenda.",
  agenda_item_deleted: "La actividad fue eliminada de la agenda.",
  private_details_updated: "Los detalles privados fueron guardados.",
  published_delete_forbidden: "Un evento que ya fue publicado no puede eliminarse. Despublícalo o márcalo como finalizado.",
  registration_updated: "El estado de la inscripción fue actualizado.",
  resource_created: "El recurso fue añadido.",
  resource_deleted: "El recurso fue eliminado.",
  speaker_created: "El ponente fue añadido.",
  speaker_deleted: "El ponente fue eliminado.",
  slug_conflict: "Ya existe un evento con ese slug. Usa uno diferente.",
  updated: "Los cambios fueron guardados correctamente.",
};

export default async function EditEventPage({ params, searchParams }: EditEventPageProperties): Promise<React.ReactNode> {
  const { eventId } = await params;
  const event = await getAdminEventById(eventId);
  if (event === null) {
    notFound();
  }

  const [parameters, registrations] = await Promise.all([searchParams, listAdminEventRegistrations(event.id)]);
  const messageCode = parameters.error === undefined ? parameters.status : parameters.error;
  const message = messageCode === undefined ? null : messages[messageCode] ?? null;
  const updateAction = updateEventAction.bind(null, event.id);
  const deleteAction = deleteDraftEventAction.bind(null, event.id);

  return (
    <section className="admin-section">
      <div className="admin-edit-toolbar"><Link className="event-detail__back" href="/dashboard/admin/eventos"><ArrowLeft size={16} /> Volver a eventos</Link>{event.is_published ? <Link className="button button--secondary" href={`/eventos/${event.slug}`} target="_blank">Ver página pública <ExternalLink size={15} /></Link> : null}</div>
      <div className="admin-section__heading"><div><h2>Editar evento</h2><p>Última actualización: {new Intl.DateTimeFormat("es-EC", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Guayaquil" }).format(new Date(event.updated_at))}</p></div></div>
      {message === null ? null : <div aria-live="polite" className="auth-message">{message}</div>}
      <EventForm action={updateAction} event={event} submitLabel="Guardar cambios" />
      <EventDetailManagement event={event} registrations={registrations} />
      <section className="surface danger-zone"><div><h2>Eliminación</h2><p>{event.published_at === null ? "Este borrador puede eliminarse de forma permanente." : "Los eventos publicados se conservan para mantener historial y auditoría."}</p></div>{event.published_at === null ? <form action={deleteAction}><SubmitButton className="button button--danger" pendingLabel="Eliminando…"><Trash2 size={15} /> Eliminar borrador</SubmitButton></form> : null}</section>
    </section>
  );
}
