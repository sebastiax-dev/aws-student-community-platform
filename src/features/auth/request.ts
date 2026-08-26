import { isAuthRetryableFetchError, type AuthError } from "@supabase/supabase-js";

type AuthOperationResult = Readonly<{
  error: AuthError | null;
}>;

const maximumAttempts = 2;

export async function executeAuthRequest<TResult extends AuthOperationResult>(operation: string, request: () => Promise<TResult>): Promise<TResult> {
  let attempt = 1;

  while (attempt <= maximumAttempts) {
    const result = await request();
    const isTransientFailure = result.error !== null && (
      isAuthRetryableFetchError(result.error)
      || (typeof result.error.status === "number" && result.error.status >= 500)
    );

    if (!isTransientFailure || attempt === maximumAttempts) {
      return result;
    }

    console.warn("Supabase authentication request failed; retrying.", {
      attempt,
      code: result.error?.code,
      operation,
      status: result.error?.status,
    });
    attempt += 1;
  }

  throw new Error(`Supabase authentication retry loop ended unexpectedly: operation=${operation}, maximumAttempts=${maximumAttempts}`);
}
