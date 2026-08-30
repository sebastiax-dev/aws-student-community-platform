import { IdentityQueryError } from "@/features/auth/errors";
import { getEventImageUrl } from "@/features/events/image-url";
import { executeEventQuery, requireEventQueryData } from "@/features/events/request";
import type { DashboardCertification, DashboardData, DashboardEvent, DashboardPointHistory, DashboardRegistration, DashboardStats } from "@/features/dashboard/types";
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

function calculateDashboardStats(registrations: readonly DashboardRegistration[], profile: DashboardData["profile"]): DashboardStats {
  const activeRegistrations = registrations.filter((registration) => registration.status !== "CANCELLED");

  return {
    active_registrations: activeRegistrations.length,
    attended_events: registrations.filter((registration) => registration.status === "ATTENDED").length,
    total_certifications: profile.total_certifications,
    total_points: profile.total_points,
  };
}

function getProgressEventIds(
  registrations: readonly { event_id: string }[],
  certifications: readonly { event_id: string | null }[],
  pointsHistory: readonly { event_id: string | null }[],
): readonly string[] {
  return [...new Set([
    ...registrations.map((registration) => registration.event_id),
    ...certifications.flatMap((certificate) => certificate.event_id === null ? [] : [certificate.event_id]),
    ...pointsHistory.flatMap((point) => point.event_id === null ? [] : [point.event_id]),
  ])];
}

function toDashboardCertification(
  certification: Readonly<{ certificate_name: string; event_id: string | null; id: string; issued_at: string; revoked_at: string | null }>,
  eventTitles: ReadonlyMap<string, string>,
): DashboardCertification {
  return {
    certificate_name: certification.certificate_name,
    event_title: certification.event_id === null ? null : eventTitles.get(certification.event_id) ?? null,
    id: certification.id,
    issued_at: certification.issued_at,
    revoked_at: certification.revoked_at,
  };
}

function toDashboardPointHistory(
  point: Readonly<{ action: DashboardPointHistory["action"]; created_at: string; event_id: string | null; id: string; points: number }>,
  eventTitles: ReadonlyMap<string, string>,
): DashboardPointHistory {
  return {
    action: point.action,
    created_at: point.created_at,
    event_title: point.event_id === null ? null : eventTitles.get(point.event_id) ?? null,
    id: point.id,
    points: point.points,
  };
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const supabase = await createSupabaseServerClient();
  const [profileResult, registrationResult, roleResult, certificationResult, pointsHistoryResult] = await Promise.all([
    supabase.from("profiles").select("created_at, display_name, total_certifications, total_points").eq("id", userId).single(),
    executeEventQuery("listOwnEventRegistrations", () => supabase
      .from("event_registrations")
      .select("event_id, id, registered_at, source, status")
      .eq("user_id", userId)
      .order("registered_at", { ascending: false })),
    supabase.from("user_roles").select("role").eq("user_id", userId).single(),
    executeEventQuery("listOwnCertifications", () => supabase
      .from("certifications")
      .select("certificate_name, event_id, id, issued_at, revoked_at")
      .eq("user_id", userId)
      .order("issued_at", { ascending: false })),
    executeEventQuery("listOwnPointsHistory", () => supabase
      .from("points_history")
      .select("action, created_at, event_id, id, points")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50)),
  ]);

  if (profileResult.error !== null) {
    throw new IdentityQueryError("profiles", profileResult.error.code, profileResult.error.details, profileResult.error.message);
  }
  if (roleResult.error !== null) {
    throw new IdentityQueryError("user_roles", roleResult.error.code, roleResult.error.details, roleResult.error.message);
  }

  const registrations = requireEventQueryData("listOwnEventRegistrations", registrationResult.data);
  const certifications = requireEventQueryData("listOwnCertifications", certificationResult.data);
  const pointsHistory = requireEventQueryData("listOwnPointsHistory", pointsHistoryResult.data);
  const eventIds = getProgressEventIds(registrations, certifications, pointsHistory);
  const events = eventIds.length === 0
    ? []
    : requireEventQueryData("listOwnRegistrationEvents", (await executeEventQuery("listOwnRegistrationEvents", () => supabase
      .from("events")
      .select(dashboardEventColumns)
      .in("id", eventIds)
      .is("deleted_at", null))).data).map(toDashboardEvent);
  const eventsById = new Map(events.map((event) => [event.id, event]));
  const eventTitles = new Map(events.map((event) => [event.id, event.title]));
  const dashboardRegistrations = sortDashboardRegistrations(registrations.map((registration) => ({
    event: eventsById.get(registration.event_id) ?? null,
    id: registration.id,
    registered_at: registration.registered_at,
    source: registration.source,
    status: registration.status,
  })));

  return {
    profile: profileResult.data,
    progress: {
      certifications: certifications.map((certification) => toDashboardCertification(certification, eventTitles)),
      points_history: pointsHistory.map((point) => toDashboardPointHistory(point, eventTitles)),
    },
    registrations: dashboardRegistrations,
    role: roleResult.data.role,
    stats: calculateDashboardStats(dashboardRegistrations, profileResult.data),
  };
}
