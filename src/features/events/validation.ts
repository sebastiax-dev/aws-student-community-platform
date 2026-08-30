import { z } from "zod";

const localDateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/u;
const eventSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

const optionalTextSchema = (maximumLength: number): z.ZodType<string | null> => z.preprocess(
  (value) => typeof value === "string" && value.trim().length === 0 ? null : value,
  z.string().trim().max(maximumLength).nullable(),
);

const optionalHttpsUrlSchema = z.preprocess(
  (value) => typeof value === "string" && value.trim().length === 0 ? null : value,
  z.url().refine((value) => new URL(value).protocol === "https:").nullable(),
);

const optionalCapacitySchema = z.preprocess(
  (value) => value === null || value === "" ? null : typeof value === "string" ? Number(value) : value,
  z.number().int().min(1).max(10000).nullable(),
);

const publicationSchema = z.union([z.literal("on"), z.null()]).transform((value) => value === "on");
const sortOrderSchema = z.preprocess(
  (value) => typeof value === "string" && value.length > 0 ? Number(value) : value,
  z.number().int().min(0).max(10000),
);

const localDateTimeSchema = z.string().regex(localDateTimePattern).transform((value) => {
  const parsedDate = new Date(`${value}:00-05:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(`Invalid Ecuador local date-time value: value=${value}`);
  }
  return parsedDate.toISOString();
});

const optionalLocalDateTimeSchema = z.preprocess(
  (value) => typeof value === "string" && value.length === 0 ? null : value,
  localDateTimeSchema.nullable(),
);

const eventMutationSchema = z.object({
  capacity: optionalCapacitySchema,
  description: z.string().trim().min(20).max(5000),
  endsAt: optionalLocalDateTimeSchema,
  isPublished: publicationSchema,
  location: z.string().trim().min(2).max(160),
  modality: z.enum(["IN_PERSON", "VIRTUAL", "HYBRID"]),
  registrationClosesAt: optionalLocalDateTimeSchema,
  registrationOpensAt: optionalLocalDateTimeSchema,
  registrationUrl: optionalHttpsUrlSchema,
  requirements: optionalTextSchema(2000),
  slug: z.string().trim().min(3).max(120).regex(eventSlugPattern),
  startsAt: localDateTimeSchema,
  status: z.enum(["PLANNED", "ACTIVE", "FINISHED"]),
  summary: z.string().trim().min(10).max(240),
  title: z.string().trim().min(3).max(120),
}).superRefine((values, context) => {
  if (values.endsAt !== null && values.endsAt <= values.startsAt) {
    context.addIssue({ code: "custom", message: "Event end must be after its start.", path: ["endsAt"] });
  }
  if (values.registrationOpensAt !== null && values.registrationClosesAt !== null && values.registrationClosesAt <= values.registrationOpensAt) {
    context.addIssue({ code: "custom", message: "Registration close must be after registration open.", path: ["registrationClosesAt"] });
  }
  if (values.status === "ACTIVE" && values.registrationUrl === null) {
    context.addIssue({ code: "custom", message: "An active event requires a registration URL.", path: ["registrationUrl"] });
  }
});

const eventPrivateDetailsSchema = z.object({
  internalNotes: optionalTextSchema(4000),
  meetingUrl: optionalHttpsUrlSchema,
});

const eventSpeakerSchema = z.object({
  bio: optionalTextSchema(1000),
  name: z.string().trim().min(2).max(120),
  roleTitle: optionalTextSchema(160),
  sortOrder: sortOrderSchema,
});

const eventAgendaItemSchema = z.object({
  description: optionalTextSchema(1000),
  endsAt: optionalLocalDateTimeSchema,
  sortOrder: sortOrderSchema,
  startsAt: localDateTimeSchema,
  title: z.string().trim().min(2).max(160),
}).superRefine((values, context) => {
  if (values.endsAt !== null && values.endsAt <= values.startsAt) {
    context.addIssue({ code: "custom", message: "Agenda item end must be after its start.", path: ["endsAt"] });
  }
});

const eventResourceSchema = z.object({
  isPublished: publicationSchema,
  label: z.string().trim().min(2).max(120),
  sortOrder: sortOrderSchema,
  url: z.url().refine((value) => new URL(value).protocol === "https:"),
});

const registrationStatusSchema = z.enum(["INITIATED", "CONFIRMED", "ATTENDED", "CANCELLED", "NO_SHOW"]);

export type EventMutationParseResult = ReturnType<typeof eventMutationSchema.safeParse>;

export function slugifyEventTitle(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-|-$/gu, "");
}

export function parseEventMutationInput(formData: FormData): EventMutationParseResult {
  const rawTitle = formData.get("title");
  const rawSlug = formData.get("slug");
  const normalizedSlug = typeof rawSlug === "string" && rawSlug.trim().length > 0
    ? slugifyEventTitle(rawSlug)
    : typeof rawTitle === "string"
      ? slugifyEventTitle(rawTitle)
      : rawSlug;

  const saveAsDraft = formData.get("submissionIntent") === "draft";

  return eventMutationSchema.safeParse({
    capacity: formData.get("capacity"),
    description: formData.get("description"),
    endsAt: formData.get("endsAt"),
    isPublished: saveAsDraft ? null : formData.get("isPublished"),
    location: formData.get("location"),
    modality: formData.get("modality"),
    registrationClosesAt: formData.get("registrationClosesAt"),
    registrationOpensAt: formData.get("registrationOpensAt"),
    registrationUrl: formData.get("registrationUrl"),
    requirements: formData.get("requirements"),
    slug: normalizedSlug,
    startsAt: formData.get("startsAt"),
    status: saveAsDraft ? "PLANNED" : formData.get("status"),
    summary: formData.get("summary"),
    title: rawTitle,
  });
}

export function parseEventPrivateDetails(formData: FormData): ReturnType<typeof eventPrivateDetailsSchema.safeParse> {
  return eventPrivateDetailsSchema.safeParse({
    internalNotes: formData.get("internalNotes"),
    meetingUrl: formData.get("meetingUrl"),
  });
}

export function parseEventSpeaker(formData: FormData): ReturnType<typeof eventSpeakerSchema.safeParse> {
  return eventSpeakerSchema.safeParse({
    bio: formData.get("bio"),
    name: formData.get("name"),
    roleTitle: formData.get("roleTitle"),
    sortOrder: formData.get("sortOrder"),
  });
}

export function parseEventAgendaItem(formData: FormData): ReturnType<typeof eventAgendaItemSchema.safeParse> {
  return eventAgendaItemSchema.safeParse({
    description: formData.get("description"),
    endsAt: formData.get("endsAt"),
    sortOrder: formData.get("sortOrder"),
    startsAt: formData.get("startsAt"),
    title: formData.get("title"),
  });
}

export function parseEventResource(formData: FormData): ReturnType<typeof eventResourceSchema.safeParse> {
  return eventResourceSchema.safeParse({
    isPublished: formData.get("isPublished"),
    label: formData.get("label"),
    sortOrder: formData.get("sortOrder"),
    url: formData.get("url"),
  });
}

export function parseRegistrationStatus(formData: FormData): ReturnType<typeof registrationStatusSchema.safeParse> {
  return registrationStatusSchema.safeParse(formData.get("status"));
}

export function formatEcuadorDateTimeInput(isoDate: string | null): string {
  if (isoDate === null) {
    return "";
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    timeZone: "America/Guayaquil",
    year: "numeric",
  }).formatToParts(new Date(isoDate));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}
