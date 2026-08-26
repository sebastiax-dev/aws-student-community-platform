import type { AuthError } from "@supabase/supabase-js";

export class AuthenticationServiceError extends Error {
  public readonly authCode: string | undefined;
  public readonly operation: string;
  public readonly status: number | undefined;

  public constructor(operation: string, authError: AuthError) {
    super(`Supabase authentication failed: operation=${operation}, status=${authError.status}, code=${authError.code}, message=${authError.message}`);
    this.name = "AuthenticationServiceError";
    this.authCode = authError.code;
    this.operation = operation;
    this.status = authError.status;
  }
}

export class IdentityQueryError extends Error {
  public constructor(table: "profiles" | "user_roles", code: string, details: string, message: string) {
    super(`Supabase identity query failed: table=${table}, code=${code}, details=${details}, message=${message}`);
    this.name = "IdentityQueryError";
  }
}

export class AuthorizationError extends Error {
  public constructor(operation: string, requiredRole: "ADMIN") {
    super(`Application authorization failed: operation=${operation}, requiredRole=${requiredRole}`);
    this.name = "AuthorizationError";
  }
}
