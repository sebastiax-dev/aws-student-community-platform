import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getPublicSupabaseEnvironment } from "@/lib/env";

export function createSupabaseBrowserClient(): SupabaseClient {
  const environment = getPublicSupabaseEnvironment();

  return createBrowserClient(environment.url, environment.publishableKey);
}
