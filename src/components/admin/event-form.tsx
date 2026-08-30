import Image from "next/image";

import { SubmitButton } from "@/components/forms/submit-button";
import type { AdminEventDetail } from "@/features/events/types";
import { eventModalityLabels, eventStatusLabels } from "@/features/events/types";
import { formatEcuadorDateTimeInput } from "@/features/events/validation";

type EventFormProperties = Readonly<{
  action: (formData: FormData) => Promise<never>;
  event: AdminEventDetail | null;
  submitLabel: string;
}>;

export function EventForm({ action, event, submitLabel }: EventFormProperties): React.ReactNode {
  return (
    <form action={action} className="admin-form surface">
      <div className="admin-form__heading"><div><p className="eyebrow">CONTENIDO PÚBLICO</p><h2>Información principal</h2></div><div className="admin-inline-actions"><button className="button button--secondary" name="submissionIntent" type="submit" value="draft">Guardar borrador</button><SubmitButton className="button button--primary" pendingLabel="Guardando…">{submitLabel}</SubmitButton></div></div>
      <div className="admin-form__grid">
        <label className="admin-form__wide">Título<input defaultValue={event?.title ?? ""} maxLength={120} minLength={3} name="title" required type="text" /></label>
        <label>Slug<input defaultValue={event?.slug ?? ""} maxLength={120} name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="Se genera desde el título" type="text" /></label>
        <label>Modalidad<select defaultValue={event?.modality ?? "IN_PERSON"} name="modality">{Object.entries(eventModalityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="admin-form__wide">Resumen<textarea defaultValue={event?.summary ?? ""} maxLength={240} minLength={10} name="summary" required rows={3} /></label>
        <label className="admin-form__wide">Descripción<textarea defaultValue={event?.description ?? ""} maxLength={5000} minLength={20} name="description" required rows={8} /></label>
        <label className="admin-form__wide">Requisitos<textarea defaultValue={event?.requirements ?? ""} maxLength={2000} name="requirements" rows={4} /></label>
        <label>Inicio<input defaultValue={formatEcuadorDateTimeInput(event?.starts_at ?? null)} name="startsAt" required type="datetime-local" /></label>
        <label>Fin<input defaultValue={formatEcuadorDateTimeInput(event?.ends_at ?? null)} name="endsAt" type="datetime-local" /></label>
        <label>Ubicación<input defaultValue={event?.location ?? ""} maxLength={160} minLength={2} name="location" required type="text" /></label>
        <label>Capacidad<input defaultValue={event?.capacity ?? ""} max={10000} min={1} name="capacity" type="number" /></label>
        <label>Apertura de inscripción<input defaultValue={formatEcuadorDateTimeInput(event?.registration_opens_at ?? null)} name="registrationOpensAt" type="datetime-local" /></label>
        <label>Cierre de inscripción<input defaultValue={formatEcuadorDateTimeInput(event?.registration_closes_at ?? null)} name="registrationClosesAt" type="datetime-local" /></label>
        <label className="admin-form__wide">URL de Google Forms<input defaultValue={event?.registration_url ?? ""} maxLength={2048} name="registrationUrl" placeholder="https://..." type="url" /></label>
        <label>Estado<select defaultValue={event?.status ?? "PLANNED"} name="status">{Object.entries(eventStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="admin-form__checkbox"><input defaultChecked={event?.is_published ?? false} name="isPublished" type="checkbox" /> Publicado en el sitio</label>
        <label className="admin-form__wide">Imagen del evento<input accept="image/avif,image/jpeg,image/png,image/webp" name="image" type="file" /><small>AVIF, JPG, PNG o WebP. Máximo 5 MiB.</small></label>
        {event?.image_url === null || event?.image_url === undefined ? null : <div className="admin-form__image"><Image alt={`Imagen actual de ${event.title}`} fill sizes="480px" src={event.image_url} /></div>}
      </div>
      <div className="admin-form__footer"><button className="button button--secondary" name="submissionIntent" type="submit" value="draft">Guardar borrador</button><SubmitButton className="button button--primary" pendingLabel="Guardando…">{submitLabel}</SubmitButton></div>
    </form>
  );
}
