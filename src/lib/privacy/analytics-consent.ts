export const analyticsConsentCookieName = "aws-community-analytics-consent";
export const analyticsConsentMaxAgeSeconds = 60 * 60 * 24 * 180;

export type AnalyticsConsent = "denied" | "granted";

export function parseAnalyticsConsent(value: string | undefined): AnalyticsConsent | null {
  return value === "denied" || value === "granted" ? value : null;
}

export function serializeAnalyticsConsent(consent: AnalyticsConsent, isSecure: boolean): string {
  const secureDirective = isSecure ? "; Secure" : "";
  return `${analyticsConsentCookieName}=${consent}; Path=/; Max-Age=${analyticsConsentMaxAgeSeconds}; SameSite=Lax${secureDirective}`;
}
