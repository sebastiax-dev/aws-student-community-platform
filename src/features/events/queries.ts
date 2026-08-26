import { executeEventQuery, requireEventQueryData } from "@/features/events/request";
import { getEventImageUrl } from "@/features/events/image-url";
import type { AdminEventDetail, AdminEventRegistration, AdminEventSummary, EventCardModel, PublicEventDetail, RegistrationStatus } from "@/features/events/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const eventCardColumns = "capacity, ends_at, id, image_path, location, modality, registration_closes_at, registration_opens_at, registration_url, slug, starts_at, status, summary, title" as const;
const eventDetailColumns = "capacity, description, ends_at, id, image_path, location, modality, registration_closes_at, registration_opens_at, registration_url, requirements, slug, starts_at, status, summary, title" as const;
const adminEventColumns = "capacity, description, ends_at, id, image_path, is_published, location, modality, published_at, registration_closes_at, registration_opens_at, registration_url, requirements, slug, starts_at, status, summary, title, updated_at" as const;

type EventCardRow = Omit<EventCardModel, "image_url">;

function toEventCardModel(event: EventCardRow): EventCardModel {
  return { ...event, image_url: getEventImageUrl(event.image_path) };
}

function sortPublishedEvents(events: readonly EventCardModel[]): readonly EventCardModel[] {
  const statusOrder: Readonly<Record<EventCardModel["status"], number>> = { ACTIVE: 0, PLANNED: 1, FINISHED: 2 };

  return [...events].sort((left, right) => {
    const statusDifference = statusOrder[left.status] - statusOrder[right.status];
    if (statusDifference !== 0) {
      return statusDifference;
    }

    const dateDifference = new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime();
    return left.status === "FINISHED" ? -dateDifference : dateDifference;
  });
}

export async function listPublishedEvents(): Promise<readonly EventCardModel[]> {
  const supabase = await createSupabaseServerClient();
  const result = await executeEventQuery("listPublishedEvents", () => supabase
    .from("events")
    .select(eventCardColumns)
    .eq("is_published", true)
    .limit(100));

  return sortPublishedEvents(requireEventQueryData("listPublishedEvents", result.data).map(toEventCardModel));
}

export async function listHomeEvents(): Promise<readonly EventCardModel[]> {
  const supabase = await createSupabaseServerClient();
  const result = await executeEventQuery("listHomeEvents", () => supabase
    .from("events")
    .select(eventCardColumns)
    .eq("is_published", true)
    .in("status", ["ACTIVE", "PLANNED"])
    .order("starts_at", { ascending: true })
    .limit(3));

  return requireEventQueryData("listHomeEvents", result.data).map(toEventCardModel);
}

export async function getPublishedEventBySlug(slug: string): Promise<PublicEventDetail | null> {
  const supabase = await createSupabaseServerClient();
  const eventResult = await executeEventQuery("getPublishedEventBySlug", () => supabase
    .from("events")
    .select(eventDetailColumns)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle());

  if (eventResult.data === null) {
    return null;
  }
  const event = eventResult.data;

  const [agendaResult, resourceResult, speakerResult] = await Promise.all([
    executeEventQuery("listPublishedEventAgenda", () => supabase
      .from("event_agenda_items")
      .select("description, ends_at, id, sort_order, starts_at, title")
      .eq("event_id", event.id)
      .order("sort_order", { ascending: true })),
    executeEventQuery("listPublishedEventResources", () => supabase
      .from("event_resources")
      .select("id, label, sort_order, url")
      .eq("event_id", event.id)
      .eq("is_published", true)
      .order("sort_order", { ascending: true })),
    executeEventQuery("listPublishedEventSpeakers", () => supabase
      .from("event_speakers")
      .select("bio, id, name, role_title, sort_order")
      .eq("event_id", event.id)
      .order("sort_order", { ascending: true })),
  ]);

  return {
    ...toEventCardModel(event),
    agenda: requireEventQueryData("listPublishedEventAgenda", agendaResult.data),
    description: event.description,
    requirements: event.requirements,
    resources: requireEventQueryData("listPublishedEventResources", resourceResult.data),
    speakers: requireEventQueryData("listPublishedEventSpeakers", speakerResult.data),
  };
}

export async function listAdminEvents(): Promise<readonly AdminEventSummary[]> {
  const supabase = await createSupabaseServerClient();
  const result = await executeEventQuery("listAdminEvents", () => supabase
    .from("events")
    .select(adminEventColumns)
    .order("starts_at", { ascending: false })
    .limit(200));

  return requireEventQueryData("listAdminEvents", result.data).map((event) => ({
    ...toEventCardModel(event),
    is_published: event.is_published,
    published_at: event.published_at,
    updated_at: event.updated_at,
  }));
}

export async function getAdminEventById(eventId: string): Promise<AdminEventDetail | null> {
  const supabase = await createSupabaseServerClient();
  const eventResult = await executeEventQuery("getAdminEventById", () => supabase
    .from("events")
    .select(adminEventColumns)
    .eq("id", eventId)
    .maybeSingle());

  if (eventResult.data === null) {
    return null;
  }
  const event = eventResult.data;

  const [agendaResult, privateResult, resourceResult, speakerResult] = await Promise.all([
    executeEventQuery("listAdminEventAgenda", () => supabase
      .from("event_agenda_items")
      .select("*")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true })),
    executeEventQuery("getAdminEventPrivateDetails", () => supabase
      .from("event_private_details")
      .select("meeting_url, internal_notes")
      .eq("event_id", eventId)
      .maybeSingle()),
    executeEventQuery("listAdminEventResources", () => supabase
      .from("event_resources")
      .select("*")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true })),
    executeEventQuery("listAdminEventSpeakers", () => supabase
      .from("event_speakers")
      .select("*")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true })),
  ]);

  return {
    ...toEventCardModel(event),
    agenda: requireEventQueryData("listAdminEventAgenda", agendaResult.data),
    description: event.description,
    internal_notes: privateResult.data?.internal_notes ?? null,
    is_published: event.is_published,
    meeting_url: privateResult.data?.meeting_url ?? null,
    published_at: event.published_at,
    requirements: event.requirements,
    resources: requireEventQueryData("listAdminEventResources", resourceResult.data),
    speakers: requireEventQueryData("listAdminEventSpeakers", speakerResult.data),
    updated_at: event.updated_at,
  };
}

export async function getOwnEventRegistrationStatus(eventId: string, userId: string): Promise<RegistrationStatus | null> {
  const supabase = await createSupabaseServerClient();
  const result = await executeEventQuery("getOwnEventRegistrationStatus", () => supabase
    .from("event_registrations")
    .select("status")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .maybeSingle());

  return result.data?.status ?? null;
}

export async function listAdminEventRegistrations(eventId: string): Promise<readonly AdminEventRegistration[]> {
  const supabase = await createSupabaseServerClient();
  const registrationResult = await executeEventQuery("listAdminEventRegistrations", () => supabase
    .from("event_registrations")
    .select("id, registered_at, source, status, user_id")
    .eq("event_id", eventId)
    .order("registered_at", { ascending: false }));
  const registrations = requireEventQueryData("listAdminEventRegistrations", registrationResult.data);

  if (registrations.length === 0) {
    return [];
  }

  const userIds = registrations.map((registration) => registration.user_id);
  const profileResult = await executeEventQuery("listAdminRegistrationProfiles", () => supabase
    .from("profiles")
    .select("display_name, id")
    .in("id", userIds));
  const profiles = requireEventQueryData("listAdminRegistrationProfiles", profileResult.data);
  const displayNames = new Map(profiles.map((profile) => [profile.id, profile.display_name]));

  return registrations.map((registration) => ({
    ...registration,
    display_name: displayNames.get(registration.user_id) ?? "Perfil no disponible",
  }));
}
