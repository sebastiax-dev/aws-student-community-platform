import { AuthenticationServiceError } from "@/features/auth/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
