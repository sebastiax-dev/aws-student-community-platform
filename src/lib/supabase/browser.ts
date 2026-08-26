import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getPublicSupabaseEnvironment } from "@/lib/env";
import type { Database } from "@/types/database.generated";

export function createSupabaseBrowserClient(): SupabaseClient<Database> {
  const environment = getPublicSupabaseEnvironment();

  return createBrowserClient<Database>(environment.url, environment.publishableKey);
}
