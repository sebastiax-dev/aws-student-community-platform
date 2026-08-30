import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.generated";

type StorageErrorShape = Readonly<{
  message: string;
  statusCode?: string;
}>;

type StorageResult = Readonly<{
  error: StorageErrorShape | null;
}>;

type SiteAssetDirectory = "branding" | "social-icons";

const allowedImageTypes: Readonly<Record<string, string>> = {
  "image/avif": "avif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const maximumImageBytes = 2 * 1024 * 1024;
const maximumAttempts = 2;

export class AdminMediaError extends Error {
  public constructor(operation: string, path: string, error: StorageErrorShape) {
    super(`Supabase site media request failed: operation=${operation}, path=${path}, code=${error.statusCode ?? "unknown"}, message=${error.message}`);
    this.name = "AdminMediaError";
  }
}

export class AdminMediaValidationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "AdminMediaValidationError";
  }
}

async function executeStorageRequest<TResult extends StorageResult>(operation: string, path: string, request: () => Promise<TResult>): Promise<TResult> {
  let attempt = 1;
  while (attempt <= maximumAttempts) {
    const result = await request();
    if (result.error === null) {
      return result;
    }
    if (attempt === maximumAttempts) {
      throw new AdminMediaError(operation, path, result.error);
    }
    console.warn("Supabase site media request failed; retrying.", { attempt, operation, path, statusCode: result.error.statusCode });
    attempt += 1;
  }
  throw new Error(`Site media retry loop ended unexpectedly: operation=${operation}, maximumAttempts=${maximumAttempts}, path=${path}`);
}

export function parseOptionalSiteImage(formData: FormData, fieldName: string): File | null {
  const file = formData.get(fieldName);
  if (file === null || file instanceof File && file.size === 0) {
    return null;
  }
  if (!(file instanceof File)) {
    throw new AdminMediaValidationError(`Site media input must be a file: field=${fieldName}`);
  }
  if (!(file.type in allowedImageTypes)) {
    throw new AdminMediaValidationError(`Site media MIME type is not allowed: field=${fieldName}, type=${file.type}`);
  }
  if (file.size > maximumImageBytes) {
    throw new AdminMediaValidationError(`Site media exceeds the 2 MiB limit: field=${fieldName}, size=${file.size}`);
  }
  return file;
}

function getAssetPath(directory: SiteAssetDirectory, entityId: string, extension: string): string {
  const assetId = crypto.randomUUID();
  return directory === "branding" ? `${directory}/${assetId}.${extension}` : `${directory}/${entityId}/${assetId}.${extension}`;
}

export async function uploadSiteImage(supabase: SupabaseClient<Database>, directory: SiteAssetDirectory, entityId: string, file: File): Promise<string> {
  const extension = allowedImageTypes[file.type];
  if (extension === undefined) {
    throw new Error(`Site media extension could not be resolved: type=${file.type}`);
  }
  const path = getAssetPath(directory, entityId, extension);
  const content = await file.arrayBuffer();
  await executeStorageRequest("uploadSiteImage", path, () => supabase.storage.from("site-assets").upload(path, content, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  }));
  return path;
}

export async function deleteSiteImage(supabase: SupabaseClient<Database>, path: string): Promise<void> {
  await executeStorageRequest("deleteSiteImage", path, () => supabase.storage.from("site-assets").remove([path]));
}

export function getPublicSiteImageUrl(supabase: SupabaseClient<Database>, path: string | null): string | null {
  if (path === null || path.length === 0) {
    return null;
  }
  const result = supabase.storage.from("site-assets").getPublicUrl(path);
  if (result.data.publicUrl.length === 0) {
    throw new Error(`Supabase returned an empty public URL for site media: path=${path}`);
  }
  return result.data.publicUrl;
}
