import type { PostgrestError } from "@supabase/supabase-js";

import { EventQueryError } from "@/features/events/errors";

type PostgrestResult = Readonly<{
  error: PostgrestError | null;
  status: number;
}>;

const maximumAttempts = 2;

export async function executeEventQuery<TResult extends PostgrestResult>(operation: string, request: () => PromiseLike<TResult>): Promise<TResult> {
  let attempt = 1;

  while (attempt <= maximumAttempts) {
    const result = await request();

    if (result.error === null) {
      return result;
    }

    const isTransient = result.status === 0 || result.status >= 500;
    if (!isTransient || attempt === maximumAttempts) {
      throw new EventQueryError(operation, result.status, result.error);
    }

    console.warn("Supabase event query failed; retrying.", {
      attempt,
      code: result.error.code,
      operation,
      status: result.status,
    });
    attempt += 1;
  }

  throw new Error(`Supabase event query retry loop ended unexpectedly: operation=${operation}, maximumAttempts=${maximumAttempts}`);
}

export function requireEventQueryData<TData>(operation: string, data: TData | null): TData {
  if (data === null) {
    throw new Error(`Supabase event query succeeded without the required data payload: operation=${operation}`);
  }

  return data;
}
