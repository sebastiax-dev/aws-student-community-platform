"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { AuthorizationError } from "@/features/auth/errors";
import { getAdminUserId, getAuthenticatedUserId } from "@/features/auth/session";
import { EventImageValidationError, EventQueryError } from "@/features/events/errors";
import { executeEventQuery, requireEventQueryData } from "@/features/events/request";
import { deleteEventImage, parseEventImage, uploadEventImage } from "@/features/events/storage";
import type { EventMutationInput } from "@/features/events/types";
import {
  parseEventAgendaItem,
  parseEventMutationInput,
  parseEventPrivateDetails,
  parseEventResource,
  parseEventSpeaker,
  parseRegistrationStatus,
} from "@/features/events/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.generated";

type EventInsert = Database["public"]["Tables"]["events"]["Insert"];
type EventUpdate = Database["public"]["Tables"]["events"]["Update"];

const eventIdSchema = z.uuid();
const eventSlugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u);

function requireUuid(identifier: string, operation: string): string {
  const parsedIdentifier = eventIdSchema.safeParse(identifier);
  if (!parsedIdentifier.success) {
    throw new Error(`Invalid UUID supplied to event operation: operation=${operation}, identifier=${identifier}`);
  }
  return parsedIdentifier.data;
}

function requireSlug(slug: string, operation: string): string {
  const parsedSlug = eventSlugSchema.safeParse(slug);
  if (!parsedSlug.success) {
    throw new Error(`Invalid event slug supplied to event operation: operation=${operation}, slug=${slug}`);
  }
  return parsedSlug.data;
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(`Non-Error failure received: value=${String(error)}`);
}

async function requireAdmin(operation: string): Promise<string> {
  const adminUserId = await getAdminUserId();
  if (adminUserId === null) {
    throw new AuthorizationError(operation, "ADMIN");
  }
  return adminUserId;
}

function toEventInsert(eventId: string, input: EventMutationInput, imagePath: string | null): EventInsert {
  return {
    capacity: input.capacity,
    description: input.description,
    ends_at: input.endsAt,
    id: eventId,
    image_path: imagePath,
    is_published: input.isPublished,
    location: input.location,
    modality: input.modality,
    registration_closes_at: input.registrationClosesAt,
    registration_opens_at: input.registrationOpensAt,
    registration_url: input.registrationUrl,
    requirements: input.requirements,
    slug: input.slug,
    starts_at: input.startsAt,
    status: input.status,
    summary: input.summary,
    title: input.title,
  };
}

function toEventUpdate(input: EventMutationInput, imagePath: string | null): EventUpdate {
  return {
    capacity: input.capacity,
    description: input.description,
    ends_at: input.endsAt,
    image_path: imagePath,
    is_published: input.isPublished,
    location: input.location,
    modality: input.modality,
    registration_closes_at: input.registrationClosesAt,
    registration_opens_at: input.registrationOpensAt,
    registration_url: input.registrationUrl,
    requirements: input.requirements,
    slug: input.slug,
    starts_at: input.startsAt,
    status: input.status,
    summary: input.summary,
    title: input.title,
  };
}

function parseImageOrRedirect(formData: FormData, errorPath: string): File | null {
  try {
    return parseEventImage(formData);
  } catch (error) {
    if (error instanceof EventImageValidationError) {
      redirect(`${errorPath}?error=invalid_image`);
    }
    throw error;
  }
}

function revalidateEventPaths(slug: string): void {
  revalidatePath("/");
  revalidatePath("/eventos");
  revalidatePath(`/eventos/${slug}`);
  revalidatePath("/dashboard/admin/eventos");
}

function revalidateEventAdministration(eventId: string, slug: string): void {
  revalidateEventPaths(slug);
  revalidatePath(`/dashboard/admin/eventos/${eventId}/editar`);
}

function redirectChildMutationFailure(error: unknown, eventId: string): never {
  const failure = toError(error);
  if (failure instanceof EventQueryError && failure.code === "23505") {
    redirect(`/dashboard/admin/eventos/${eventId}/editar?error=child_order_conflict`);
  }
  throw failure;
}

async function removeUploadedImageAfterFailure(imagePath: string | null, cause: Error): Promise<never> {
  if (imagePath === null) {
    throw cause;
  }

  const supabase = await createSupabaseServerClient();
  try {
    await deleteEventImage(supabase, imagePath);
  } catch (cleanupError) {
    throw new AggregateError([cause, toError(cleanupError)], `Event mutation and image cleanup both failed: path=${imagePath}`);
  }

  throw cause;
}

function redirectAdminQueryFailure(error: EventQueryError, path: string): never {
  if (error.code === "23505") {
    redirect(`${path}?error=slug_conflict`);
  }
  if (error.code === "P0001" && error.serviceMessage === "PUBLISHED_EVENT_DELETE_FORBIDDEN") {
    redirect(`${path}?error=published_delete_forbidden`);
  }
  throw error;
}

export async function createEventAction(formData: FormData): Promise<never> {
  const errorPath = "/dashboard/admin/eventos/nuevo";
  const parsedInput = parseEventMutationInput(formData);
  if (!parsedInput.success) {
    redirect(`${errorPath}?error=invalid_input`);
  }

  const image = parseImageOrRedirect(formData, errorPath);
  await requireAdmin("createEvent");
  const supabase = await createSupabaseServerClient();
  const eventId = crypto.randomUUID();
  const imagePath = image === null ? null : await uploadEventImage(supabase, eventId, image);

  try {
    await executeEventQuery("createEvent", () => supabase
      .from("events")
      .insert(toEventInsert(eventId, parsedInput.data, imagePath))
      .select("id")
      .single());
  } catch (error) {
    const failure = toError(error);
    if (failure instanceof EventQueryError && failure.code === "23505") {
      try {
        await removeUploadedImageAfterFailure(imagePath, failure);
      } catch (cleanupResult) {
        const cleanupFailure = toError(cleanupResult);
        if (cleanupFailure === failure) {
          redirect(`${errorPath}?error=slug_conflict`);
        }
        throw cleanupFailure;
      }
    }
    await removeUploadedImageAfterFailure(imagePath, failure);
  }

  revalidateEventPaths(parsedInput.data.slug);
  redirect(`/dashboard/admin/eventos/${eventId}/editar?status=created`);
}

export async function updateEventAction(eventId: string, formData: FormData): Promise<never> {
  const parsedEventId = eventIdSchema.safeParse(eventId);
  if (!parsedEventId.success) {
    throw new Error(`Invalid event identifier supplied to updateEventAction: eventId=${eventId}`);
  }

  const errorPath = `/dashboard/admin/eventos/${eventId}/editar`;
  const parsedInput = parseEventMutationInput(formData);
  if (!parsedInput.success) {
    redirect(`${errorPath}?error=invalid_input`);
  }
  const image = parseImageOrRedirect(formData, errorPath);

  await requireAdmin("updateEvent");
  const supabase = await createSupabaseServerClient();
  const currentResult = await executeEventQuery("getEventBeforeUpdate", () => supabase
    .from("events")
    .select("image_path, slug")
    .eq("id", eventId)
    .single());
  const currentEvent = requireEventQueryData("getEventBeforeUpdate", currentResult.data);
  const newImagePath = image === null ? currentEvent.image_path : await uploadEventImage(supabase, eventId, image);

  try {
    await executeEventQuery("updateEvent", () => supabase
      .from("events")
      .update(toEventUpdate(parsedInput.data, newImagePath))
      .eq("id", eventId)
      .select("id")
      .single());
  } catch (error) {
    const failure = toError(error);
    if (newImagePath !== currentEvent.image_path) {
      await removeUploadedImageAfterFailure(newImagePath, failure);
    }
    throw failure;
  }

  if (newImagePath !== currentEvent.image_path && currentEvent.image_path !== null) {
    await deleteEventImage(supabase, currentEvent.image_path);
  }

  revalidateEventPaths(currentEvent.slug);
  if (currentEvent.slug !== parsedInput.data.slug) {
    revalidateEventPaths(parsedInput.data.slug);
  }
  redirect(`${errorPath}?status=updated`);
}

export async function deleteDraftEventAction(eventId: string): Promise<never> {
  const parsedEventId = eventIdSchema.safeParse(eventId);
  if (!parsedEventId.success) {
    throw new Error(`Invalid event identifier supplied to deleteDraftEventAction: eventId=${eventId}`);
  }

  await requireAdmin("deleteDraftEvent");
  const supabase = await createSupabaseServerClient();
  const currentResult = await executeEventQuery("getEventBeforeDelete", () => supabase
    .from("events")
    .select("image_path, slug")
    .eq("id", eventId)
    .single());
  const currentEvent = requireEventQueryData("getEventBeforeDelete", currentResult.data);

  try {
    await executeEventQuery("deleteDraftEvent", () => supabase.from("events").delete().eq("id", eventId));
  } catch (error) {
    const failure = toError(error);
    if (failure instanceof EventQueryError) {
      redirectAdminQueryFailure(failure, `/dashboard/admin/eventos/${eventId}/editar`);
    }
    throw failure;
  }

  if (currentEvent.image_path !== null) {
    await deleteEventImage(supabase, currentEvent.image_path);
  }

  revalidateEventPaths(currentEvent.slug);
  redirect("/dashboard/admin/eventos?status=deleted");
}

export async function registerForEventAction(eventId: string, slug: string): Promise<never> {
  const parsedEventId = eventIdSchema.safeParse(eventId);
  const parsedSlug = eventSlugSchema.safeParse(slug);
  if (!parsedEventId.success || !parsedSlug.success) {
    throw new Error(`Invalid event registration target: eventId=${eventId}, slug=${slug}`);
  }

  const userId = await getAuthenticatedUserId();
  if (userId === null) {
    redirect(`/login?next=${encodeURIComponent(`/eventos/${slug}`)}`);
  }

  const supabase = await createSupabaseServerClient();
  let registrationUrl: string;
  try {
    const result = await executeEventQuery("initiateEventRegistration", () => supabase.rpc("initiate_event_registration", { p_event_id: eventId }));
    registrationUrl = requireEventQueryData("initiateEventRegistration", result.data);
  } catch (error) {
    const failure = toError(error);
    if (failure instanceof EventQueryError && failure.code === "P0001") {
      const errorCodes: Readonly<Record<string, string>> = {
        EVENT_FULL: "event_full",
        EVENT_NOT_AVAILABLE: "event_not_available",
        REGISTRATION_CLOSED: "registration_closed",
        REGISTRATION_NOT_OPEN: "registration_not_open",
        REGISTRATION_URL_MISSING: "registration_unavailable",
      };
      const errorCode = errorCodes[failure.serviceMessage];
      if (errorCode !== undefined) {
        redirect(`/eventos/${slug}?error=${errorCode}`);
      }
    }
    throw failure;
  }

  const parsedRegistrationUrl = z.url().safeParse(registrationUrl);
  if (!parsedRegistrationUrl.success || new URL(parsedRegistrationUrl.data).protocol !== "https:") {
    throw new Error(`Supabase returned an unsafe event registration URL: eventId=${eventId}`);
  }

  revalidatePath(`/eventos/${slug}`);
  revalidatePath("/dashboard");
  redirect(parsedRegistrationUrl.data);
}

export async function updateEventPrivateDetailsAction(eventId: string, slug: string, formData: FormData): Promise<never> {
  requireUuid(eventId, "updateEventPrivateDetails");
  requireSlug(slug, "updateEventPrivateDetails");
  const parsedInput = parseEventPrivateDetails(formData);
  if (!parsedInput.success) {
    redirect(`/dashboard/admin/eventos/${eventId}/editar?error=invalid_private_details`);
  }

  await requireAdmin("updateEventPrivateDetails");
  const supabase = await createSupabaseServerClient();
  await executeEventQuery("updateEventPrivateDetails", () => supabase
    .from("event_private_details")
    .upsert({
      event_id: eventId,
      internal_notes: parsedInput.data.internalNotes,
      meeting_url: parsedInput.data.meetingUrl,
    }, { onConflict: "event_id" })
    .select("event_id")
    .single());

  revalidateEventAdministration(eventId, slug);
  redirect(`/dashboard/admin/eventos/${eventId}/editar?status=private_details_updated`);
}

export async function createEventSpeakerAction(eventId: string, slug: string, formData: FormData): Promise<never> {
  requireUuid(eventId, "createEventSpeaker");
  requireSlug(slug, "createEventSpeaker");
  const parsedInput = parseEventSpeaker(formData);
  if (!parsedInput.success) {
    redirect(`/dashboard/admin/eventos/${eventId}/editar?error=invalid_speaker`);
  }

  await requireAdmin("createEventSpeaker");
  const supabase = await createSupabaseServerClient();
  try {
    await executeEventQuery("createEventSpeaker", () => supabase
      .from("event_speakers")
      .insert({
        bio: parsedInput.data.bio,
        event_id: eventId,
        name: parsedInput.data.name,
        role_title: parsedInput.data.roleTitle,
        sort_order: parsedInput.data.sortOrder,
      })
      .select("id")
      .single());
  } catch (error) {
    redirectChildMutationFailure(error, eventId);
  }

  revalidateEventAdministration(eventId, slug);
  redirect(`/dashboard/admin/eventos/${eventId}/editar?status=speaker_created`);
}

export async function deleteEventSpeakerAction(eventId: string, slug: string, speakerId: string): Promise<never> {
  requireUuid(eventId, "deleteEventSpeaker");
  requireSlug(slug, "deleteEventSpeaker");
  requireUuid(speakerId, "deleteEventSpeaker");
  await requireAdmin("deleteEventSpeaker");
  const supabase = await createSupabaseServerClient();
  await executeEventQuery("deleteEventSpeaker", () => supabase
    .from("event_speakers")
    .delete()
    .eq("id", speakerId)
    .eq("event_id", eventId));
  revalidateEventAdministration(eventId, slug);
  redirect(`/dashboard/admin/eventos/${eventId}/editar?status=speaker_deleted`);
}

export async function createEventAgendaItemAction(eventId: string, slug: string, formData: FormData): Promise<never> {
  requireUuid(eventId, "createEventAgendaItem");
  requireSlug(slug, "createEventAgendaItem");
  const parsedInput = parseEventAgendaItem(formData);
  if (!parsedInput.success) {
    redirect(`/dashboard/admin/eventos/${eventId}/editar?error=invalid_agenda_item`);
  }

  await requireAdmin("createEventAgendaItem");
  const supabase = await createSupabaseServerClient();
  try {
    await executeEventQuery("createEventAgendaItem", () => supabase
      .from("event_agenda_items")
      .insert({
        description: parsedInput.data.description,
        ends_at: parsedInput.data.endsAt,
        event_id: eventId,
        sort_order: parsedInput.data.sortOrder,
        starts_at: parsedInput.data.startsAt,
        title: parsedInput.data.title,
      })
      .select("id")
      .single());
  } catch (error) {
    redirectChildMutationFailure(error, eventId);
  }

  revalidateEventAdministration(eventId, slug);
  redirect(`/dashboard/admin/eventos/${eventId}/editar?status=agenda_item_created`);
}

export async function deleteEventAgendaItemAction(eventId: string, slug: string, agendaItemId: string): Promise<never> {
  requireUuid(eventId, "deleteEventAgendaItem");
  requireSlug(slug, "deleteEventAgendaItem");
  requireUuid(agendaItemId, "deleteEventAgendaItem");
  await requireAdmin("deleteEventAgendaItem");
  const supabase = await createSupabaseServerClient();
  await executeEventQuery("deleteEventAgendaItem", () => supabase
    .from("event_agenda_items")
    .delete()
    .eq("id", agendaItemId)
    .eq("event_id", eventId));
  revalidateEventAdministration(eventId, slug);
  redirect(`/dashboard/admin/eventos/${eventId}/editar?status=agenda_item_deleted`);
}

export async function createEventResourceAction(eventId: string, slug: string, formData: FormData): Promise<never> {
  requireUuid(eventId, "createEventResource");
  requireSlug(slug, "createEventResource");
  const parsedInput = parseEventResource(formData);
  if (!parsedInput.success) {
    redirect(`/dashboard/admin/eventos/${eventId}/editar?error=invalid_resource`);
  }

  await requireAdmin("createEventResource");
  const supabase = await createSupabaseServerClient();
  try {
    await executeEventQuery("createEventResource", () => supabase
      .from("event_resources")
      .insert({
        event_id: eventId,
        is_published: parsedInput.data.isPublished,
        label: parsedInput.data.label,
        sort_order: parsedInput.data.sortOrder,
        url: parsedInput.data.url,
      })
      .select("id")
      .single());
  } catch (error) {
    redirectChildMutationFailure(error, eventId);
  }

  revalidateEventAdministration(eventId, slug);
  redirect(`/dashboard/admin/eventos/${eventId}/editar?status=resource_created`);
}

export async function deleteEventResourceAction(eventId: string, slug: string, resourceId: string): Promise<never> {
  requireUuid(eventId, "deleteEventResource");
  requireSlug(slug, "deleteEventResource");
  requireUuid(resourceId, "deleteEventResource");
  await requireAdmin("deleteEventResource");
  const supabase = await createSupabaseServerClient();
  await executeEventQuery("deleteEventResource", () => supabase
    .from("event_resources")
    .delete()
    .eq("id", resourceId)
    .eq("event_id", eventId));
  revalidateEventAdministration(eventId, slug);
  redirect(`/dashboard/admin/eventos/${eventId}/editar?status=resource_deleted`);
}

export async function updateEventRegistrationStatusAction(eventId: string, slug: string, registrationId: string, formData: FormData): Promise<never> {
  requireUuid(eventId, "updateEventRegistrationStatus");
  requireSlug(slug, "updateEventRegistrationStatus");
  requireUuid(registrationId, "updateEventRegistrationStatus");
  const parsedStatus = parseRegistrationStatus(formData);
  if (!parsedStatus.success) {
    redirect(`/dashboard/admin/eventos/${eventId}/editar?error=invalid_registration_status`);
  }

  await requireAdmin("updateEventRegistrationStatus");
  const supabase = await createSupabaseServerClient();
  await executeEventQuery("updateEventRegistrationStatus", () => supabase
    .from("event_registrations")
    .update({ status: parsedStatus.data })
    .eq("id", registrationId)
    .eq("event_id", eventId)
    .select("id")
    .single());
  revalidateEventAdministration(eventId, slug);
  redirect(`/dashboard/admin/eventos/${eventId}/editar?status=registration_updated`);
}
