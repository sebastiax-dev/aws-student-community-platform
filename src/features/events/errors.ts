import type { PostgrestError } from "@supabase/supabase-js";

export class EventQueryError extends Error {
  public readonly code: string;
  public readonly operation: string;
  public readonly serviceMessage: string;
  public readonly status: number;

  public constructor(operation: string, status: number, error: PostgrestError) {
    super(`Supabase event query failed: operation=${operation}, status=${status}, code=${error.code}, details=${error.details}, hint=${error.hint}, message=${error.message}`);
    this.name = "EventQueryError";
    this.code = error.code;
    this.operation = operation;
    this.serviceMessage = error.message;
    this.status = status;
  }
}

export class EventImageValidationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "EventImageValidationError";
  }
}

export class EventStorageError extends Error {
  public constructor(operation: string, path: string, status: number | undefined, statusCode: string | undefined, message: string) {
    super(`Supabase event storage failed: operation=${operation}, path=${path}, status=${status}, statusCode=${statusCode}, message=${message}`);
    this.name = "EventStorageError";
  }
}
