import type { EventCardModel } from "@/features/events/types";

export type RegistrationAvailability = "CLOSED" | "OPEN" | "UNAVAILABLE" | "UPCOMING";

type RegistrationWindowEvent = Readonly<Pick<EventCardModel, "registration_closes_at" | "registration_opens_at" | "registration_url" | "status">>;

export const registrationAvailabilityLabels: Readonly<Record<RegistrationAvailability, string>> = {
  CLOSED: "INSCRIPCIONES CERRADAS",
  OPEN: "INSCRIPCIONES ABIERTAS",
  UNAVAILABLE: "INSCRIPCIONES NO DISPONIBLES",
  UPCOMING: "PRÓXIMAMENTE",
};

export function getRegistrationAvailability(event: RegistrationWindowEvent, now: Date): RegistrationAvailability {
  if (event.status === "FINISHED" || event.registration_url === null) {
    return "UNAVAILABLE";
  }

  if (event.registration_opens_at !== null && now < new Date(event.registration_opens_at)) {
    return "UPCOMING";
  }

  if (event.registration_closes_at !== null && now >= new Date(event.registration_closes_at)) {
    return "CLOSED";
  }

  if (event.registration_opens_at !== null || event.status === "ACTIVE") {
    return "OPEN";
  }

  return "UPCOMING";
}

export function isRegistrationOpen(event: RegistrationWindowEvent, now: Date): boolean {
  return getRegistrationAvailability(event, now) === "OPEN";
}

export function getEventDisplayStatusLabel(event: RegistrationWindowEvent, now: Date): string {
  if (event.status === "FINISHED") {
    return "FINALIZADO";
  }

  const availability = getRegistrationAvailability(event, now);
  return availability === "UNAVAILABLE" ? "PRÓXIMAMENTE" : registrationAvailabilityLabels[availability];
}
