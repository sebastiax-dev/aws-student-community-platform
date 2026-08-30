import type { PostgrestError } from "@supabase/supabase-js";

import { AdminQueryError } from "@/features/admin/errors";

type PostgrestResult = Readonly<{
  error: PostgrestError | null;
  status: number;
}>;

const maximumAttempts = 2;

export async function executeAdminQuery<TResult extends PostgrestResult>(operation: string, request: () => PromiseLike<TResult>): Promise<TResult> {
  let attempt = 1;
  while (attempt <= maximumAttempts) {
    const result = await request();
    if (result.error === null) {
      return result;
    }
    const isTransient = result.status === 0 || result.status >= 500;
    if (!isTransient || attempt === maximumAttempts) {
      throw new AdminQueryError(operation, result.status, result.error);
    }
    console.warn("Supabase admin query failed; retrying.", { attempt, code: result.error.code, operation, status: result.status });
    attempt += 1;
  }
  throw new Error(`Supabase admin query retry loop ended unexpectedly: operation=${operation}, maximumAttempts=${maximumAttempts}`);
}

export function requireAdminQueryData<TData>(operation: string, data: TData | null): TData {
  if (data === null) {
    throw new Error(`Supabase admin query succeeded without required data: operation=${operation}`);
  }
  return data;
}
