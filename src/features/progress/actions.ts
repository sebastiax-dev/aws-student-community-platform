"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { AuthorizationError } from "@/features/auth/errors";
import { getAdminUserId } from "@/features/auth/session";
import { EventQueryError } from "@/features/events/errors";
import { executeEventQuery } from "@/features/events/request";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const attendanceSchema = z.enum(["true", "false"]);
const certificateSchema = z.object({
  certificateName: z.string().trim().min(3).max(160),
  issuedAt: z.iso.date(),
});
const eventIdSchema = z.uuid();
const eventSlugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u);

function requireIdentifier(value: string, operation: string): string {
  const result = eventIdSchema.safeParse(value);
  if (!result.success) {
    throw new Error(`Invalid UUID supplied to progress operation: operation=${operation}, identifier=${value}`);
  }
  return result.data;
}

function requireSlug(value: string, operation: string): string {
  const result = eventSlugSchema.safeParse(value);
  if (!result.success) {
    throw new Error(`Invalid event slug supplied to progress operation: operation=${operation}, slug=${value}`);
  }
  return result.data;
}

async function requireProgressAdmin(operation: string): Promise<void> {
  const adminUserId = await getAdminUserId();
  if (adminUserId === null) {
    throw new AuthorizationError(operation, "ADMIN");
  }
}

function revalidateProgress(eventId: string): void {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/eventos");
  revalidatePath("/dashboard/progreso");
  revalidatePath(`/dashboard/admin/eventos/${eventId}/editar`);
}

function redirectProgressFailure(error: EventQueryError, eventId: string): never {
  const path = `/dashboard/admin/eventos/${eventId}/editar`;
  if (error.code === "P0001" && error.serviceMessage === "ATTENDANCE_REQUIRED_FOR_CERTIFICATE") {
    redirect(`${path}?error=attendance_required_for_certificate`);
  }
  if (error.code === "P0001" && error.serviceMessage === "ACTIVE_CERTIFICATE_NOT_FOUND") {
    redirect(`${path}?error=active_certificate_not_found`);
  }
  throw error;
}

export async function setEventAttendanceAction(eventId: string, slug: string, userId: string, formData: FormData): Promise<never> {
  requireIdentifier(eventId, "setEventAttendance");
  requireSlug(slug, "setEventAttendance");
  requireIdentifier(userId, "setEventAttendance");
  const attendance = attendanceSchema.safeParse(formData.get("attended"));
  if (!attendance.success) {
    redirect(`/dashboard/admin/eventos/${eventId}/editar?error=invalid_attendance`);
  }

  await requireProgressAdmin("setEventAttendance");
  const supabase = await createSupabaseServerClient();
  try {
    await executeEventQuery("setEventAttendance", () => supabase.rpc("set_event_attendance", {
      p_attended: attendance.data === "true",
      p_event_id: eventId,
      p_user_id: userId,
    }));
  } catch (error) {
    if (error instanceof EventQueryError) {
      redirectProgressFailure(error, eventId);
    }
    throw error;
  }

  revalidateProgress(eventId);
  redirect(`/dashboard/admin/eventos/${eventId}/editar?status=attendance_updated`);
}

export async function issueCertificateAction(eventId: string, slug: string, userId: string, formData: FormData): Promise<never> {
  requireIdentifier(eventId, "issueCertificate");
  requireSlug(slug, "issueCertificate");
  requireIdentifier(userId, "issueCertificate");
  const input = certificateSchema.safeParse({
    certificateName: formData.get("certificateName"),
    issuedAt: formData.get("issuedAt"),
  });
  if (!input.success) {
    redirect(`/dashboard/admin/eventos/${eventId}/editar?error=invalid_certificate`);
  }

  await requireProgressAdmin("issueCertificate");
  const supabase = await createSupabaseServerClient();
  try {
    await executeEventQuery("issueCertificate", () => supabase.rpc("issue_certificate", {
      p_certificate_name: input.data.certificateName,
      p_event_id: eventId,
      p_issued_at: input.data.issuedAt,
      p_user_id: userId,
    }));
  } catch (error) {
    if (error instanceof EventQueryError) {
      redirectProgressFailure(error, eventId);
    }
    throw error;
  }

  revalidateProgress(eventId);
  redirect(`/dashboard/admin/eventos/${eventId}/editar?status=certificate_issued`);
}

export async function revokeCertificateAction(eventId: string, slug: string, certificateId: string): Promise<never> {
  requireIdentifier(eventId, "revokeCertificate");
  requireSlug(slug, "revokeCertificate");
  requireIdentifier(certificateId, "revokeCertificate");
  await requireProgressAdmin("revokeCertificate");

  const supabase = await createSupabaseServerClient();
  try {
    await executeEventQuery("revokeCertificate", () => supabase.rpc("revoke_certificate", { p_certificate_id: certificateId }));
  } catch (error) {
    if (error instanceof EventQueryError) {
      redirectProgressFailure(error, eventId);
    }
    throw error;
  }

  revalidateProgress(eventId);
  redirect(`/dashboard/admin/eventos/${eventId}/editar?status=certificate_revoked`);
}
