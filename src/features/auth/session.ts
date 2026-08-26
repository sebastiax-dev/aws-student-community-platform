import { AuthenticationServiceError, IdentityQueryError } from "@/features/auth/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.generated";

export type AppRole = Database["public"]["Enums"]["app_role"];

export async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error !== null) {
    if (error.name === "AuthSessionMissingError") {
      return null;
    }

    throw new AuthenticationServiceError("getClaims", error);
  }

  if (data?.claims === null || data?.claims === undefined) {
    return null;
  }

  const subject = data.claims.sub;

  if (typeof subject !== "string" || subject.length === 0) {
    throw new Error("Supabase returned validated claims without a non-empty subject identifier.");
  }

  return subject;
}

export async function getAuthenticatedAppRole(userId: string): Promise<AppRole> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase.from("user_roles").select("role").eq("user_id", userId).single();

  if (result.error !== null) {
    throw new IdentityQueryError("user_roles", result.error.code, result.error.details, result.error.message);
  }

  return result.data.role;
}

export async function getAdminUserId(): Promise<string | null> {
  const userId = await getAuthenticatedUserId();
  if (userId === null) {
    return null;
  }

  const role = await getAuthenticatedAppRole(userId);
  return role === "ADMIN" ? userId : null;
}
