export class UnsafeAuthenticationRedirectError extends Error {
  public constructor(candidate: string) {
    super(`Unsafe authentication redirect path rejected: next=${candidate}`);
    this.name = "UnsafeAuthenticationRedirectError";
  }
}

export function getSafeAuthenticationRedirectUrl(candidate: string | null, origin: string, fallbackPath: string): URL {
  const destination = new URL(candidate ?? fallbackPath, origin);
  if (candidate !== null && (!candidate.startsWith("/") || destination.origin !== origin)) {
    throw new UnsafeAuthenticationRedirectError(candidate);
  }
  return destination;
}

export function getSafeAuthenticationRedirectPath(candidate: string | null, fallbackPath: string): string {
  const origin = "https://local.invalid";
  const destination = getSafeAuthenticationRedirectUrl(candidate, origin, fallbackPath);
  return `${destination.pathname}${destination.search}${destination.hash}`;
}
