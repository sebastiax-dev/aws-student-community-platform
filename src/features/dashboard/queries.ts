import { IdentityQueryError } from "@/features/auth/errors";
import { getEventImageUrl } from "@/features/events/image-url";
import { executeEventQuery, requireEventQueryData } from "@/features/events/request";
import type { DashboardData, DashboardEvent, DashboardRegistration, DashboardStats } from "@/features/dashboard/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const dashboardEventColumns = "ends_at, id, image_path, is_published, location, modality, slug, starts_at, status, summary, title" as const;

function toDashboardEvent(event: Omit<DashboardEvent, "image_url">): DashboardEvent {
  return { ...event, image_url: getEventImageUrl(event.image_path) };
}

function sortDashboardRegistrations(registrations: readonly DashboardRegistration[]): readonly DashboardRegistration[] {
  return [...registrations].sort((left, right) => {
    if (left.event === null && right.event === null) {
      return new Date(right.registered_at).getTime() - new Date(left.registered_at).getTime();
    }
    if (left.event === null) {
      return 1;
    }
    if (right.event === null) {
      return -1;
    }
    return new Date(left.event.starts_at).getTime() - new Date(right.event.starts_at).getTime();
  });
}

function calculateDashboardStats(registrations: readonly DashboardRegistration[], now: Date): DashboardStats {
  const activeRegistrations = registrations.filter((registration) => registration.status !== "CANCELLED");

  return {
    active_registrations: activeRegistrations.length,
    attended_events: registrations.filter((registration) => registration.status === "ATTENDED").length,
    confirmed_registrations: registrations.filter((registration) => registration.status === "CONFIRMED").length,
    upcoming_events: activeRegistrations.filter((registration) => registration.event !== null && registration.event.status !== "FINISHED" && new Date(registration.event.starts_at) >= now).length,
  };
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const supabase = await createSupabaseServerClient();
  const [profileResult, registrationResult, roleResult] = await Promise.all([
    supabase.from("profiles").select("created_at, display_name").eq("id", userId).single(),
    executeEventQuery("listOwnEventRegistrations", () => supabase
      .from("event_registrations")
      .select("event_id, id, registered_at, source, status")
      .eq("user_id", userId)
      .order("registered_at", { ascending: false })),
    supabase.from("user_roles").select("role").eq("user_id", userId).single(),
  ]);

  if (profileResult.error !== null) {
    throw new IdentityQueryError("profiles", profileResult.error.code, profileResult.error.details, profileResult.error.message);
  }
  if (roleResult.error !== null) {
    throw new IdentityQueryError("user_roles", roleResult.error.code, roleResult.error.details, roleResult.error.message);
  }

  const registrations = requireEventQueryData("listOwnEventRegistrations", registrationResult.data);
  const eventIds = registrations.map((registration) => registration.event_id);
  const events = eventIds.length === 0
    ? []
    : requireEventQueryData("listOwnRegistrationEvents", (await executeEventQuery("listOwnRegistrationEvents", () => supabase
      .from("events")
      .select(dashboardEventColumns)
      .in("id", eventIds))).data).map(toDashboardEvent);
  const eventsById = new Map(events.map((event) => [event.id, event]));
  const dashboardRegistrations = sortDashboardRegistrations(registrations.map((registration) => ({
    event: eventsById.get(registration.event_id) ?? null,
    id: registration.id,
    registered_at: registration.registered_at,
    source: registration.source,
    status: registration.status,
  })));

  return {
    profile: profileResult.data,
    registrations: dashboardRegistrations,
    role: roleResult.data.role,
    stats: calculateDashboardStats(dashboardRegistrations, new Date()),
  };
}
