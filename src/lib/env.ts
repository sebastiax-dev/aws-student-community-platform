import { z } from "zod";

const publicSupabaseEnvironmentSchema = z.object({
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
});

export type PublicSupabaseEnvironment = Readonly<{
  publishableKey: string;
  siteUrl: string;
  url: string;
}>;

export function getPublicSupabaseEnvironment(): PublicSupabaseEnvironment {
  const parsedEnvironment = publicSupabaseEnvironmentSchema.parse({
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  });

  return {
    publishableKey: parsedEnvironment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    siteUrl: parsedEnvironment.NEXT_PUBLIC_SITE_URL,
    url: parsedEnvironment.NEXT_PUBLIC_SUPABASE_URL,
  };
}
