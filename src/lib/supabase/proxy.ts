import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getPublicSupabaseEnvironment } from "@/lib/env";
import type { Database } from "@/types/database.generated";

export async function updateSupabaseSession(request: NextRequest): Promise<NextResponse> {
  const environment = getPublicSupabaseEnvironment();
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(environment.url, environment.publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, responseHeaders) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, options, value }) => response.cookies.set(name, value, options));
        Object.entries(responseHeaders).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });

  const { error } = await supabase.auth.getClaims();

  if (error !== null && error.name !== "AuthSessionMissingError") {
    throw new Error(`Supabase session validation failed: name=${error.name}, status=${error.status}, code=${error.code}, message=${error.message}`);
  }

  return response;
}
