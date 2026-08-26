import { getPublicSupabaseEnvironment } from "@/lib/env";

export function getEventImageUrl(imagePath: string | null): string | null {
  if (imagePath === null) {
    return null;
  }

  const encodedPath = imagePath.split("/").map((segment) => encodeURIComponent(segment)).join("/");
  return new URL(`/storage/v1/object/public/events/${encodedPath}`, getPublicSupabaseEnvironment().url).toString();
}
