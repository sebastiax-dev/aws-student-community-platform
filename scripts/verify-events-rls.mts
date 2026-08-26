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
    throw new Error("Event RLS verification requires NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and SUPABASE_TEST_SERVICE_ROLE_KEY.");
  }

  return { publishableKey, serviceRoleKey, url };
}

function assertCondition(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Event RLS verification failed: ${message}`);
  }
}

async function createTestIdentity(admin: SupabaseClient<Database>, label: string): Promise<TestIdentity> {
  const suffix = crypto.randomUUID();
  const email = `codex-event-rls-${label}-${suffix}@example.invalid`;
  const password = `${crypto.randomUUID()}Aa1!`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    password,
    user_metadata: { display_name: `Event RLS ${label}` },
  });

  if (error !== null) {
    throw new Error(`Unable to create temporary event RLS identity: label=${label}, status=${error.status}, code=${error.code}, message=${error.message}`);
  }

  return { email, id: data.user.id, password };
}

async function createAuthenticatedClient(environment: RequiredEnvironment, identity: TestIdentity): Promise<SupabaseClient<Database>> {
  const client = createClient<Database>(environment.url, environment.publishableKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error } = await client.auth.signInWithPassword({ email: identity.email, password: identity.password });
  if (error !== null) {
    throw new Error(`Unable to authenticate temporary event RLS identity: id=${identity.id}, status=${error.status}, code=${error.code}, message=${error.message}`);
  }
  return client;
}

async function deleteTestIdentity(admin: SupabaseClient<Database>, identity: TestIdentity): Promise<void> {
  const { error } = await admin.auth.admin.deleteUser(identity.id);
  if (error !== null) {
    throw new Error(`Unable to delete temporary event RLS identity: id=${identity.id}, status=${error.status}, code=${error.code}, message=${error.message}`);
  }
}

async function verifyEventPolicies(): Promise<void> {
  const environment = requireEnvironment();
  const service = createClient<Database>(environment.url, environment.serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const anonymous = createClient<Database>(environment.url, environment.publishableKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const administrator = await createTestIdentity(service, "admin");
  const firstUser = await createTestIdentity(service, "first-user");
  const secondUser = await createTestIdentity(service, "second-user");
  const identities = [administrator, firstUser, secondUser] as const;
  const eventId = crypto.randomUUID();
  const storagePath = `${eventId}/${crypto.randomUUID()}.png`;
  const slug = `rls-verification-${eventId}`;

  try {
    const promotion = await service.from("user_roles").update({ assigned_by: administrator.id, role: "ADMIN" }).eq("user_id", administrator.id);
    assertCondition(promotion.error === null, `service role could not promote test administrator: code=${promotion.error?.code}, message=${promotion.error?.message}`);

    const [adminClient, firstClient, secondClient] = await Promise.all([
      createAuthenticatedClient(environment, administrator),
      createAuthenticatedClient(environment, firstUser),
      createAuthenticatedClient(environment, secondUser),
    ]);

    const eventInsert = await adminClient.from("events").insert({
      capacity: 1,
      description: "Evento efímero creado para verificar aislamiento, capacidad y permisos RLS.",
      id: eventId,
      is_published: false,
      location: "Quito",
      modality: "VIRTUAL",
      registration_url: "https://example.invalid/event-registration",
      slug,
      starts_at: new Date(Date.now() + 86_400_000).toISOString(),
      status: "ACTIVE",
      summary: "Verificación automática de políticas de eventos.",
      title: "Event RLS verification",
    }).select("id").single();
    assertCondition(eventInsert.error === null && eventInsert.data?.id === eventId, `ADMIN could not create a draft event: code=${eventInsert.error?.code}, message=${eventInsert.error?.message}`);

    const ordinaryInsert = await firstClient.from("events").insert({
      description: "Este evento no debe poder crearse con un rol de usuario normal.",
      id: crypto.randomUUID(),
      location: "Quito",
      modality: "VIRTUAL",
      slug: `forbidden-${crypto.randomUUID()}`,
      starts_at: new Date(Date.now() + 86_400_000).toISOString(),
      summary: "Intento de inserción que RLS debe rechazar.",
      title: "Forbidden event",
    });
    assertCondition(ordinaryInsert.error?.code === "42501", `ordinary user event insert must be rejected with 42501: code=${ordinaryInsert.error?.code}`);

    const hiddenDraft = await anonymous.from("events").select("id").eq("id", eventId);
    assertCondition(hiddenDraft.error === null && hiddenDraft.data?.length === 0, "anonymous clients must not read draft events");

    const speakerInsert = await adminClient.from("event_speakers").insert({ event_id: eventId, name: "RLS Speaker", sort_order: 0 }).select("id").single();
    assertCondition(speakerInsert.error === null, `ADMIN could not create an event speaker: code=${speakerInsert.error?.code}, message=${speakerInsert.error?.message}`);
    const hiddenSpeaker = await anonymous.from("event_speakers").select("id").eq("event_id", eventId);
    assertCondition(hiddenSpeaker.error === null && hiddenSpeaker.data?.length === 0, "anonymous clients must not read child records of draft events");

    const privateInsert = await adminClient.from("event_private_details").insert({ event_id: eventId, internal_notes: "Never public", meeting_url: "https://example.invalid/private-meeting" });
    assertCondition(privateInsert.error === null, `ADMIN could not create private event details: code=${privateInsert.error?.code}, message=${privateInsert.error?.message}`);
    const privateRead = await firstClient.from("event_private_details").select("event_id").eq("event_id", eventId);
    assertCondition(privateRead.error === null && privateRead.data?.length === 0, "ordinary users must not read private event details");

    const publish = await adminClient.from("events").update({ is_published: true }).eq("id", eventId).select("id").single();
    assertCondition(publish.error === null, `ADMIN could not publish an event: code=${publish.error?.code}, message=${publish.error?.message}`);
    const publishedEvent = await anonymous.from("events").select("id").eq("id", eventId).single();
    assertCondition(publishedEvent.error === null && publishedEvent.data?.id === eventId, "anonymous clients must read a published event");
    const publicSpeaker = await anonymous.from("event_speakers").select("id").eq("event_id", eventId).single();
    assertCondition(publicSpeaker.error === null, "anonymous clients must read speakers of a published event");

    const adminUpload = await adminClient.storage.from("events").upload(storagePath, new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), { contentType: "image/png", upsert: false });
    assertCondition(adminUpload.error === null, `ADMIN event asset upload failed: message=${adminUpload.error?.message}`);
    const forbiddenUpload = await firstClient.storage.from("events").upload(`${eventId}/${crypto.randomUUID()}.png`, new Uint8Array([137, 80, 78, 71]), { contentType: "image/png", upsert: false });
    assertCondition(forbiddenUpload.error !== null, "ordinary users must not upload event assets");

    const [firstRegistration, secondRegistration] = await Promise.all([
      firstClient.rpc("initiate_event_registration", { p_event_id: eventId }),
      secondClient.rpc("initiate_event_registration", { p_event_id: eventId }),
    ]);
    const successfulRegistrations = [firstRegistration, secondRegistration].filter((result) => result.error === null);
    const fullRegistrations = [firstRegistration, secondRegistration].filter((result) => result.error?.code === "P0001" && result.error.message.includes("EVENT_FULL"));
    assertCondition(successfulRegistrations.length === 1 && fullRegistrations.length === 1, "capacity 1 must allow exactly one of two concurrent registrations");

    const winningClient = firstRegistration.error === null ? firstClient : secondClient;
    const losingClient = firstRegistration.error === null ? secondClient : firstClient;
    const repeatedRegistration = await winningClient.rpc("initiate_event_registration", { p_event_id: eventId });
    assertCondition(repeatedRegistration.error === null && repeatedRegistration.data === "https://example.invalid/event-registration", "repeating a successful registration must be idempotent");

    const registrationCount = await service.from("event_registrations").select("id", { count: "exact" }).eq("event_id", eventId);
    assertCondition(registrationCount.error === null && registrationCount.count === 1, `idempotent registration must leave exactly one row: count=${registrationCount.count}`);
    const winningRead = await winningClient.from("event_registrations").select("id, status").eq("event_id", eventId).single();
    assertCondition(winningRead.error === null && winningRead.data?.status === "INITIATED", "a user must read their own registration");
    const losingRead = await losingClient.from("event_registrations").select("id").eq("event_id", eventId);
    assertCondition(losingRead.error === null && losingRead.data?.length === 0, "a user must not read another user's registration");

    const registrationId = winningRead.data?.id;
    assertCondition(registrationId !== undefined, "the successful registration must have an identifier");
    const adminStatusUpdate = await adminClient.from("event_registrations").update({ status: "CONFIRMED" }).eq("id", registrationId ?? "").select("status").single();
    assertCondition(adminStatusUpdate.error === null && adminStatusUpdate.data?.status === "CONFIRMED", "ADMIN must update registration status");
    const unpublishEvent = await adminClient.from("events").update({ is_published: false }).eq("id", eventId).select("id").single();
    assertCondition(unpublishEvent.error === null, "ADMIN must be able to unpublish an event after registration");
    const ownHistoricalEvent = await winningClient.from("events").select("id").eq("id", eventId).single();
    assertCondition(ownHistoricalEvent.error === null && ownHistoricalEvent.data?.id === eventId, "a user must retain access to an event with their own registration after it is unpublished");
    const otherHistoricalEvent = await losingClient.from("events").select("id").eq("id", eventId);
    assertCondition(otherHistoricalEvent.error === null && otherHistoricalEvent.data?.length === 0, "a user must not read an unpublished event without their own registration");
    const ordinaryEventUpdate = await firstClient.from("events").update({ title: "Forbidden change" }).eq("id", eventId).select("id");
    assertCondition(ordinaryEventUpdate.error === null && ordinaryEventUpdate.data?.length === 0, "ordinary users must not update events");
    const adminAudit = await adminClient.from("audit_events").select("id").eq("entity_id", eventId);
    assertCondition(adminAudit.error === null && (adminAudit.data?.length ?? 0) >= 2, "ADMIN must read event audit records");

    console.info("Event RLS verification passed.", { checks: 21, temporaryUsers: identities.length });
  } finally {
    const storageRemoval = await service.storage.from("events").remove([storagePath]);
    if (storageRemoval.error !== null) {
      throw new Error(`Unable to remove temporary event asset: path=${storagePath}, message=${storageRemoval.error.message}`);
    }
    const pointsCleanup = await service.from("points_history").delete().eq("event_id", eventId);
    if (pointsCleanup.error !== null) {
      throw new Error(`Unable to remove temporary points history: eventId=${eventId}, code=${pointsCleanup.error.code}, message=${pointsCleanup.error.message}`);
    }
    const registrationCleanup = await service.from("event_registrations").delete().eq("event_id", eventId);
    if (registrationCleanup.error !== null) {
      throw new Error(`Unable to remove temporary event registrations: eventId=${eventId}, code=${registrationCleanup.error.code}, message=${registrationCleanup.error.message}`);
    }
    const eventCleanup = await service.from("events").delete().eq("id", eventId);
    if (eventCleanup.error !== null) {
      throw new Error(`Unable to remove temporary event: eventId=${eventId}, code=${eventCleanup.error.code}, message=${eventCleanup.error.message}`);
    }
    const auditCleanup = await service.from("audit_events").delete().eq("entity_id", eventId);
    if (auditCleanup.error !== null) {
      throw new Error(`Unable to remove temporary event audit records: eventId=${eventId}, code=${auditCleanup.error.code}, message=${auditCleanup.error.message}`);
    }
    const registrationAuditCleanup = await service.from("audit_events").delete().contains("metadata", { event_id: eventId });
    if (registrationAuditCleanup.error !== null) {
      throw new Error(`Unable to remove temporary registration audit records: eventId=${eventId}, code=${registrationAuditCleanup.error.code}, message=${registrationAuditCleanup.error.message}`);
    }
    await Promise.all(identities.map((identity) => deleteTestIdentity(service, identity)));
  }
}

await verifyEventPolicies();
