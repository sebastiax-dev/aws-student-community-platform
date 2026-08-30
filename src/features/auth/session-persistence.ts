export const sessionPersistenceCookieName = "aws_sbg_remember_session";
export const persistentSessionMaxAge = 400 * 24 * 60 * 60;

export function shouldPersistSession(value: string | undefined): boolean {
  return value !== "false";
}

export function getSessionPersistenceMaxAge(shouldPersist: boolean): number | undefined {
  return shouldPersist ? persistentSessionMaxAge : undefined;
}
