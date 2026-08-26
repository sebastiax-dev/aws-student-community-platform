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
    throw new Error("RLS verification requires NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and SUPABASE_TEST_SERVICE_ROLE_KEY.");
  }

  return { publishableKey, serviceRoleKey, url };
}

function assertCondition(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`RLS verification failed: ${message}`);
  }
}

async function createTestIdentity(admin: SupabaseClient<Database>, label: string): Promise<TestIdentity> {
  const suffix = crypto.randomUUID();
  const email = `codex-rls-${label}-${suffix}@example.invalid`;
  const password = `${crypto.randomUUID()}Aa1!`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    password,
    user_metadata: { display_name: `RLS ${label}` },
  });

  if (error !== null) {
    throw new Error(`Unable to create temporary RLS identity: label=${label}, status=${error.status}, code=${error.code}, message=${error.message}`);
  }

  return { email, id: data.user.id, password };
}

async function createAuthenticatedClient(environment: RequiredEnvironment, identity: TestIdentity): Promise<SupabaseClient<Database>> {
  const client = createClient<Database>(environment.url, environment.publishableKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error } = await client.auth.signInWithPassword({ email: identity.email, password: identity.password });

  if (error !== null) {
    throw new Error(`Unable to authenticate temporary RLS identity: id=${identity.id}, status=${error.status}, code=${error.code}, message=${error.message}`);
  }

  return client;
}

async function deleteTestIdentity(admin: SupabaseClient<Database>, identity: TestIdentity): Promise<void> {
  const { error } = await admin.auth.admin.deleteUser(identity.id);
  if (error !== null) {
    throw new Error(`Unable to delete temporary RLS identity: id=${identity.id}, status=${error.status}, code=${error.code}, message=${error.message}`);
  }
}

async function createTestIdentities(admin: SupabaseClient<Database>): Promise<readonly [TestIdentity, TestIdentity]> {
  const owner = await createTestIdentity(admin, "owner");

  try {
    const other = await createTestIdentity(admin, "other");
    return [owner, other];
  } catch (error) {
    await deleteTestIdentity(admin, owner);
    throw error;
  }
}

async function verifyIdentityPolicies(): Promise<void> {
  const environment = requireEnvironment();
  const admin = createClient<Database>(environment.url, environment.serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const anonymous = createClient<Database>(environment.url, environment.publishableKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const [owner, other] = await createTestIdentities(admin);

  try {
    const ownerClient = await createAuthenticatedClient(environment, owner);

    const ownProfile = await ownerClient.from("profiles").select("id, display_name").eq("id", owner.id).single();
    assertCondition(ownProfile.error === null && ownProfile.data?.id === owner.id, "an authenticated user must read their own profile");

    const ownUpdate = await ownerClient.from("profiles").update({ display_name: "Updated owner" }).eq("id", owner.id).select("id, display_name").single();
    assertCondition(ownUpdate.error === null && ownUpdate.data?.display_name === "Updated owner", "an authenticated user must update their own permitted profile fields");

    const otherProfile = await ownerClient.from("profiles").select("id").eq("id", other.id);
    assertCondition(otherProfile.error === null && otherProfile.data?.length === 0, "a user must not read another profile");

    const crossUpdate = await ownerClient.from("profiles").update({ display_name: "Forbidden update" }).eq("id", other.id).select("id");
    assertCondition(crossUpdate.error === null && crossUpdate.data?.length === 0, "a user must not update another profile");

    const roleUpdate = await ownerClient.from("user_roles").update({ role: "ADMIN" }).eq("user_id", owner.id);
    assertCondition(roleUpdate.error?.code === "42501", "a user must not update application roles");

    const anonymousRead = await anonymous.from("profiles").select("id");
    assertCondition(anonymousRead.error?.code === "42501", "an anonymous client must not read profiles");

    const promotion = await admin.from("user_roles").update({ assigned_by: owner.id, role: "ADMIN" }).eq("user_id", owner.id);
    assertCondition(promotion.error === null, "a privileged server client must be able to assign an admin role");

    const adminRead = await ownerClient.from("profiles").select("id").in("id", [owner.id, other.id]);
    assertCondition(adminRead.error === null && adminRead.data?.length === 2, "an ADMIN must read profiles required for administration");

    console.info("Identity RLS verification passed.", { checks: 8, temporaryUsers: 2 });
  } finally {
    await Promise.all([deleteTestIdentity(admin, owner), deleteTestIdentity(admin, other)]);
  }
}

await verifyIdentityPolicies();
