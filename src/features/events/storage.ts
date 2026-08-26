import type { SupabaseClient } from "@supabase/supabase-js";

import { EventImageValidationError, EventStorageError } from "@/features/events/errors";
import type { Database } from "@/types/database.generated";

type StorageErrorShape = Readonly<{
  message: string;
  status?: number;
  statusCode?: string;
}>;

type StorageResult = Readonly<{
  data: object | null;
  error: StorageErrorShape | null;
}>;

const allowedImageTypes: Readonly<Record<string, string>> = {
  "image/avif": "avif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const maximumImageBytes = 5 * 1024 * 1024;
const maximumAttempts = 2;

async function executeStorageRequest<TResult extends StorageResult>(operation: string, path: string, request: () => Promise<TResult>): Promise<TResult> {
  let attempt = 1;

  while (attempt <= maximumAttempts) {
    const result = await request();

    if (result.error === null) {
      return result;
    }

    const isTransient = result.error.status === 0 || (typeof result.error.status === "number" && result.error.status >= 500);
    if (!isTransient || attempt === maximumAttempts) {
      throw new EventStorageError(operation, path, result.error.status, result.error.statusCode, result.error.message);
    }

    console.warn("Supabase event storage request failed; retrying.", {
      attempt,
      operation,
      path,
      status: result.error.status,
      statusCode: result.error.statusCode,
    });
    attempt += 1;
  }

  throw new Error(`Supabase event storage retry loop ended unexpectedly: operation=${operation}, maximumAttempts=${maximumAttempts}, path=${path}`);
}

export function parseEventImage(formData: FormData): File | null {
  const image = formData.get("image");
  if (image === null || image instanceof File && image.size === 0) {
    return null;
  }
  if (!(image instanceof File)) {
    throw new EventImageValidationError("Event image input must be a file.");
  }
  if (!(image.type in allowedImageTypes)) {
    throw new EventImageValidationError(`Event image MIME type is not allowed: type=${image.type}`);
  }
  if (image.size > maximumImageBytes) {
    throw new EventImageValidationError(`Event image exceeds the 5 MiB limit: size=${image.size}`);
  }

  return image;
}

export async function uploadEventImage(supabase: SupabaseClient<Database>, eventId: string, image: File): Promise<string> {
  const extension = allowedImageTypes[image.type];
  if (extension === undefined) {
    throw new EventImageValidationError(`Event image extension could not be resolved: type=${image.type}`);
  }

  const path = `${eventId}/${crypto.randomUUID()}.${extension}`;
  const content = await image.arrayBuffer();
  await executeStorageRequest("uploadEventImage", path, () => supabase.storage.from("events").upload(path, content, {
    cacheControl: "31536000",
    contentType: image.type,
    upsert: false,
  }));

  return path;
}

export async function deleteEventImage(supabase: SupabaseClient<Database>, imagePath: string): Promise<void> {
  await executeStorageRequest("deleteEventImage", imagePath, () => supabase.storage.from("events").remove([imagePath]));
}
