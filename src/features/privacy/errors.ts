import type { PostgrestError } from "@supabase/supabase-js";

export class PrivacyQueryError extends Error {
  public readonly code: string;
  public readonly operation: string;
  public readonly serviceMessage: string;
  public readonly status: number;

  public constructor(operation: string, status: number, error: PostgrestError) {
    super(`Supabase privacy query failed: operation=${operation}, status=${status}, code=${error.code}, details=${error.details}, message=${error.message}`);
    this.name = "PrivacyQueryError";
    this.code = error.code;
    this.operation = operation;
    this.serviceMessage = error.message;
    this.status = status;
  }
}
