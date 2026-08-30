"use client";

import Link from "next/link";
import { useState } from "react";

import { serializeAnalyticsConsent, type AnalyticsConsent } from "@/lib/privacy/analytics-consent";

type CookieConsentBannerProperties = Readonly<{
  initialConsent: AnalyticsConsent | null;
}>;

export function CookieConsentBanner({ initialConsent }: CookieConsentBannerProperties): React.ReactNode {
  const [consent, setConsent] = useState<AnalyticsConsent | null>(initialConsent);

  function saveConsent(nextConsent: AnalyticsConsent): void {
    document.cookie = serializeAnalyticsConsent(nextConsent, window.location.protocol === "https:");
    setConsent(nextConsent);
  }

  if (consent !== null) {
    return null;
  }

  return (
    <aside aria-labelledby="cookie-consent-title" className="cookie-consent surface">
      <div>
        <strong id="cookie-consent-title">Tu privacidad primero</strong>
        <p>Usamos cookies necesarias para la sesión. La analítica opcional está desactivada hasta que la aceptes.</p>
        <Link href="/cookies">Ver aviso de cookies</Link>
      </div>
      <div className="cookie-consent__actions">
        <button className="button button--secondary" onClick={() => saveConsent("denied")} type="button">Solo necesarias</button>
        <button className="button button--primary" onClick={() => saveConsent("granted")} type="button">Aceptar analítica</button>
      </div>
    </aside>
  );
}
