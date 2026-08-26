import type { Database } from "@/types/database.generated";

export type EventModality = Database["public"]["Enums"]["event_modality"];
export type EventStatus = Database["public"]["Enums"]["event_status"];
export type RegistrationStatus = Database["public"]["Enums"]["registration_status"];
export type RegistrationSource = Database["public"]["Enums"]["registration_source"];

type EventRow = Database["public"]["Tables"]["events"]["Row"];
type AgendaRow = Database["public"]["Tables"]["event_agenda_items"]["Row"];
type ResourceRow = Database["public"]["Tables"]["event_resources"]["Row"];
type SpeakerRow = Database["public"]["Tables"]["event_speakers"]["Row"];

export type EventCardModel = Readonly<Pick<EventRow,
  | "capacity"
  | "ends_at"
  | "id"
  | "image_path"
  | "location"
  | "modality"
  | "registration_closes_at"
  | "registration_opens_at"
  | "registration_url"
  | "slug"
  | "starts_at"
  | "status"
  | "summary"
  | "title"
> & {
  image_url: string | null;
}>;

export type PublicEventDetail = Readonly<EventCardModel & Pick<EventRow, "description" | "requirements"> & {
  agenda: readonly Readonly<Pick<AgendaRow, "description" | "ends_at" | "id" | "sort_order" | "starts_at" | "title">>[];
  resources: readonly Readonly<Pick<ResourceRow, "id" | "label" | "sort_order" | "url">>[];
  speakers: readonly Readonly<Pick<SpeakerRow, "bio" | "id" | "name" | "role_title" | "sort_order">>[];
}>;

export type AdminEventSummary = Readonly<EventCardModel & Pick<EventRow, "is_published" | "published_at" | "updated_at">>;

export type AdminEventDetail = Readonly<AdminEventSummary & Pick<EventRow, "description" | "requirements"> & {
  agenda: readonly AgendaRow[];
  internal_notes: string | null;
  meeting_url: string | null;
  resources: readonly ResourceRow[];
  speakers: readonly SpeakerRow[];
}>;

export type AdminEventRegistration = Readonly<{
  display_name: string;
  id: string;
  registered_at: string;
  source: RegistrationSource;
  status: RegistrationStatus;
  user_id: string;
}>;

export type EventMutationInput = Readonly<{
  capacity: number | null;
  description: string;
  endsAt: string | null;
  isPublished: boolean;
  location: string;
  modality: EventModality;
  registrationClosesAt: string | null;
  registrationOpensAt: string | null;
  registrationUrl: string | null;
  requirements: string | null;
  slug: string;
  startsAt: string;
  status: EventStatus;
  summary: string;
  title: string;
}>;

export const eventModalityLabels: Readonly<Record<EventModality, string>> = {
  HYBRID: "Híbrido",
  IN_PERSON: "Presencial",
  VIRTUAL: "Virtual",
};

export const eventStatusLabels: Readonly<Record<EventStatus, string>> = {
  ACTIVE: "INSCRIPCIONES ABIERTAS",
  FINISHED: "FINALIZADO",
  PLANNED: "PRÓXIMAMENTE",
};

export const registrationStatusLabels: Readonly<Record<RegistrationStatus, string>> = {
  ATTENDED: "Asistió",
  CANCELLED: "Cancelada",
  CONFIRMED: "Confirmada",
  INITIATED: "Iniciada",
  NO_SHOW: "No asistió",
};
