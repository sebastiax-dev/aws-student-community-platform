import type { PostgrestError } from "@supabase/supabase-js";

export class AdminQueryError extends Error {
  public readonly code: string;
  public readonly operation: string;
  public readonly serviceMessage: string;
  public readonly status: number;

  public constructor(operation: string, status: number, error: PostgrestError) {
    super(`Supabase admin query failed: operation=${operation}, status=${status}, code=${error.code}, details=${error.details}, hint=${error.hint}, message=${error.message}`);
    this.name = "AdminQueryError";
    this.code = error.code;
    this.operation = operation;
    this.serviceMessage = error.message;
    this.status = status;
  }
}
