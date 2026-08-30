import type { PostgrestError } from "@supabase/supabase-js";

import { PrivacyQueryError } from "@/features/privacy/errors";

type PostgrestResult = Readonly<{
  error: PostgrestError | null;
  status: number;
}>;

const maximumAttempts = 2;

export async function executePrivacyQuery<TResult extends PostgrestResult>(operation: string, request: () => PromiseLike<TResult>): Promise<TResult> {
  let attempt = 1;

  while (attempt <= maximumAttempts) {
    const result = await request();
    if (result.error === null) {
      return result;
    }

    const isTransient = result.status === 0 || result.status >= 500;
    if (!isTransient || attempt === maximumAttempts) {
      throw new PrivacyQueryError(operation, result.status, result.error);
    }

    console.warn("Supabase privacy query failed; retrying.", {
      attempt,
      code: result.error.code,
      operation,
      status: result.status,
    });
    attempt += 1;
  }

  throw new Error(`Supabase privacy query retry loop ended unexpectedly: operation=${operation}, maximumAttempts=${maximumAttempts}`);
}

export function requirePrivacyQueryData<TData>(operation: string, data: TData | null): TData {
  if (data === null) {
    throw new Error(`Supabase privacy query succeeded without the required data payload: operation=${operation}`);
  }
  return data;
}
