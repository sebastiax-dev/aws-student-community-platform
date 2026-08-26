import { NextResponse } from "next/server";

import { AuthenticationServiceError } from "@/features/auth/errors";
import { executeAuthRequest } from "@/features/auth/request";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getSafeNextUrl(candidate: string | null, origin: string): URL {
  if (candidate === null) {
    return new URL("/dashboard", origin);
  }

  const destination = new URL(candidate, origin);

  if (!candidate.startsWith("/") || destination.origin !== origin) {
    throw new Error(`Unsafe authentication redirect path rejected: next=${candidate}`);
  }

  return destination;
}

export async function GET(request: Request): Promise<NextResponse> {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code === null || code.length === 0) {
    return NextResponse.redirect(new URL("/login?error=invalid_callback", requestUrl.origin));
  }

  const supabase = await createSupabaseServerClient();
  const result = await executeAuthRequest("exchangeCodeForSession", () => supabase.auth.exchangeCodeForSession(code));

  if (result.error !== null) {
    if (result.error.status === 400 || result.error.status === 403) {
      return NextResponse.redirect(new URL("/login?error=invalid_callback", requestUrl.origin));
    }
    throw new AuthenticationServiceError("exchangeCodeForSession", result.error);
  }

  return NextResponse.redirect(getSafeNextUrl(requestUrl.searchParams.get("next"), requestUrl.origin));
}
