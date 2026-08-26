import { NextResponse } from "next/server";

import { AuthenticationServiceError } from "@/features/auth/errors";
import { getSafeAuthenticationRedirectUrl } from "@/features/auth/redirect";
import { executeAuthRequest } from "@/features/auth/request";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

  return NextResponse.redirect(getSafeAuthenticationRedirectUrl(requestUrl.searchParams.get("next"), requestUrl.origin, "/dashboard"));
}
