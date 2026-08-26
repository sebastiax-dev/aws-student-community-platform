import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../src/types/database.generated.ts";

type RequiredEnvironment = Readonly<{
  publishableKey: string;
  serviceRoleKey: string;
  url: string;
}>;

type TestIdentity = Readonly<{
  email: string;
  id: string;
  password: string;
}>;

function requireEnvironment(): RequiredEnvironment {
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceRoleKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!publishableKey || !serviceRoleKey || !url) {
    throw new Error("Progress RLS verification requires NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and SUPABASE_TEST_SERVICE_ROLE_KEY.");
  }
  return { publishableKey, serviceRoleKey, url };
}

function assertCondition(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Progress RLS verification failed: ${message}`);
  }
}

async function createIdentityWithPassword(service: SupabaseClient<Database>, label: string): Promise<TestIdentity> {
  const suffix = crypto.randomUUID();
  const password = `${crypto.randomUUID()}Aa1!`;
  const email = `codex-progress-${label}-${suffix}@example.invalid`;
  const { data, error } = await service.auth.admin.createUser({ email, email_confirm: true, password, user_metadata: { display_name: `Progress ${label}` } });
  if (error !== null) {
    throw new Error(`Unable to create progress RLS identity: label=${label}, code=${error.code}, message=${error.message}`);
  }
  return { email, id: data.user.id, password };
}

async function authenticate(environment: RequiredEnvironment, identity: TestIdentity): Promise<SupabaseClient<Database>> {
  const client = createClient<Database>(environment.url, environment.publishableKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error } = await client.auth.signInWithPassword({ email: identity.email, password: identity.password });
  if (error !== null) {
    throw new Error(`Unable to authenticate progress RLS identity: id=${identity.id}, code=${error.code}, message=${error.message}`);
  }
  return client;
}

async function deleteIdentity(service: SupabaseClient<Database>, identity: TestIdentity): Promise<void> {
  const { error } = await service.auth.admin.deleteUser(identity.id);
  if (error !== null) {
    throw new Error(`Unable to delete progress RLS identity: id=${identity.id}, code=${error.code}, message=${error.message}`);
  }
}

async function verifyProgressPolicies(): Promise<void> {
  const environment = requireEnvironment();
  const service = createClient<Database>(environment.url, environment.serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const anonymous = createClient<Database>(environment.url, environment.publishableKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const administrator = await createIdentityWithPassword(service, "admin");
  const owner = await createIdentityWithPassword(service, "owner");
  const other = await createIdentityWithPassword(service, "other");
  const identities = [administrator, owner, other] as const;
  const eventId = crypto.randomUUID();
  const registrationId = crypto.randomUUID();
  const otherRegistrationId = crypto.randomUUID();

  try {
    const promotion = await service.from("user_roles").update({ assigned_by: administrator.id, role: "ADMIN" }).eq("user_id", administrator.id);
    assertCondition(promotion.error === null, "service role must promote the temporary administrator");
    const [adminClient, ownerClient, otherClient] = await Promise.all([authenticate(environment, administrator), authenticate(environment, owner), authenticate(environment, other)]);
    const event = await adminClient.from("events").insert({ description: "Evento temporal para verificar la seguridad del progreso de estudiantes.", id: eventId, is_published: false, location: "Quito", modality: "VIRTUAL", slug: `progress-${eventId}`, starts_at: new Date().toISOString(), summary: "Verificación remota de puntos, asistencia y certificados.", title: "Progress RLS verification" }).select("id").single();
    assertCondition(event.error === null && event.data?.id === eventId, "ADMIN must create the temporary event");
    const registration = await service.from("event_registrations").insert([{ event_id: eventId, id: registrationId, source: "WEB_PLATFORM", status: "CONFIRMED", user_id: owner.id }, { event_id: eventId, id: otherRegistrationId, source: "WEB_PLATFORM", status: "CONFIRMED", user_id: other.id }]);
    assertCondition(registration.error === null, `service role must create temporary registrations: code=${registration.error?.code}`);

    const ownRegistrationPoints = await ownerClient.from("points_history").select("points").eq("event_id", eventId);
    assertCondition(ownRegistrationPoints.error === null && ownRegistrationPoints.data?.length === 1 && ownRegistrationPoints.data[0]?.points === 10, "users must read their own registration points");
    const otherPoints = await otherClient.from("points_history").select("id").eq("user_id", owner.id);
    assertCondition(otherPoints.error === null && otherPoints.data?.length === 0, "users must not read another member's points");
    const anonymousPoints = await anonymous.from("points_history").select("id");
    assertCondition(anonymousPoints.error?.code === "42501", "anonymous clients must not read points history");
    const directAttendance = await ownerClient.from("attendance").insert({ attended: true, event_id: eventId, recorded_at: new Date().toISOString(), user_id: owner.id });
    assertCondition(directAttendance.error?.code === "42501", "users must not write attendance directly");
    const ownerAttendance = await ownerClient.rpc("set_event_attendance", { p_attended: true, p_event_id: eventId, p_user_id: owner.id });
    assertCondition(ownerAttendance.error?.code === "42501", "users must not invoke the administrative attendance RPC");

    const adminAttendance = await adminClient.rpc("set_event_attendance", { p_attended: true, p_event_id: eventId, p_user_id: owner.id });
    assertCondition(adminAttendance.error === null, `ADMIN must record attendance: code=${adminAttendance.error?.code}, message=${adminAttendance.error?.message}`);
    const repeatedAttendance = await adminClient.rpc("set_event_attendance", { p_attended: true, p_event_id: eventId, p_user_id: owner.id });
    assertCondition(repeatedAttendance.error === null, "repeating attendance must be idempotent");
    const attendance = await ownerClient.from("attendance").select("attended").eq("event_id", eventId).single();
    assertCondition(attendance.error === null && attendance.data?.attended, "users must read their own recorded attendance");
    const hiddenAttendance = await otherClient.from("attendance").select("id").eq("event_id", eventId).eq("user_id", owner.id);
    assertCondition(hiddenAttendance.error === null && hiddenAttendance.data?.length === 0, "users must not read another member's attendance");
    const ownerProgress = await ownerClient.from("profiles").select("total_points, total_certifications").eq("id", owner.id).single();
    assertCondition(ownerProgress.error === null && ownerProgress.data?.total_points === 30 && ownerProgress.data.total_certifications === 0, "attendance must update the points aggregate exactly once");
    const forcedAttendanceStatus = await adminClient.from("event_registrations").update({ status: "ATTENDED" }).eq("id", otherRegistrationId);
    assertCondition(forcedAttendanceStatus.error?.code === "P0001", "ATTENDED status must require an attendance record");

    const certificate = await adminClient.rpc("issue_certificate", { p_certificate_name: "Certificado de participación", p_event_id: eventId, p_issued_at: new Date().toISOString().slice(0, 10), p_user_id: owner.id });
    assertCondition(certificate.error === null && typeof certificate.data === "string", `ADMIN must issue a certificate after attendance: code=${certificate.error?.code}, message=${certificate.error?.message}`);
    const certificateId = certificate.data;
    const repeatedCertificate = await adminClient.rpc("issue_certificate", { p_certificate_name: "Certificado de participación", p_event_id: eventId, p_issued_at: new Date().toISOString().slice(0, 10), p_user_id: owner.id });
    assertCondition(repeatedCertificate.error === null && repeatedCertificate.data === certificateId, "repeating certificate issuance must be idempotent");
    const ownCertificates = await ownerClient.from("certifications").select("id").eq("id", certificateId);
    assertCondition(ownCertificates.error === null && ownCertificates.data?.length === 1, "users must read their own certifications");
    const hiddenCertificates = await otherClient.from("certifications").select("id").eq("id", certificateId);
    assertCondition(hiddenCertificates.error === null && hiddenCertificates.data?.length === 0, "users must not read another member's certifications");
    const directCertificate = await ownerClient.from("certifications").insert({ certificate_name: "Forbidden", created_by: owner.id, event_id: eventId, issued_at: new Date().toISOString().slice(0, 10), user_id: owner.id });
    assertCondition(directCertificate.error?.code === "42501", "users must not write certifications directly");
    const issuedProgress = await ownerClient.from("profiles").select("total_certifications").eq("id", owner.id).single();
    assertCondition(issuedProgress.error === null && issuedProgress.data?.total_certifications === 1, "issuing a certificate must update the aggregate");
    const revoke = await adminClient.rpc("revoke_certificate", { p_certificate_id: certificateId });
    assertCondition(revoke.error === null, "ADMIN must revoke an active certificate");
    const revokedProgress = await ownerClient.from("profiles").select("total_certifications").eq("id", owner.id).single();
    assertCondition(revokedProgress.error === null && revokedProgress.data?.total_certifications === 0, "revoking a certificate must update the aggregate");
    console.info("Progress RLS verification passed.", { checks: 21, temporaryUsers: identities.length });
  } finally {
    await service.from("points_history").delete().eq("event_id", eventId);
    await service.from("certifications").delete().eq("event_id", eventId);
    await service.from("attendance").delete().eq("event_id", eventId);
    await service.from("event_registrations").delete().eq("event_id", eventId);
    await service.from("audit_events").delete().contains("metadata", { event_id: eventId });
    await service.from("audit_events").delete().eq("entity_id", eventId);
    await service.from("events").delete().eq("id", eventId);
    await Promise.all(identities.map((identity) => deleteIdentity(service, identity)));
  }
}

await verifyProgressPolicies();
