export type SecurityHeader = Readonly<{
  name: string;
  value: string;
}>;

function toWebSocketOrigin(supabaseOrigin: string): string {
  const origin = new URL(supabaseOrigin);
  origin.protocol = origin.protocol === "https:" ? "wss:" : "ws:";
  return origin.origin;
}

export function buildContentSecurityPolicy(nonce: string, supabaseOrigin: string, isDevelopment: boolean): string {
  const webSocketOrigin = toWebSocketOrigin(supabaseOrigin);
  const developmentScriptDirective = isDevelopment ? " 'unsafe-eval'" : "";
  const productionUpgradeDirective = isDevelopment ? "" : "; upgrade-insecure-requests";

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${developmentScriptDirective}`,
    `style-src 'self' 'nonce-${nonce}'`,
    "style-src-attr 'unsafe-inline'",
    `img-src 'self' blob: data: ${supabaseOrigin}`,
    "font-src 'self'",
    `connect-src 'self' ${supabaseOrigin} ${webSocketOrigin}`,
    "worker-src 'self' blob:",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-src 'none'",
    "frame-ancestors 'none'",
  ].join("; ") + productionUpgradeDirective;
}

export function getSecurityHeaders(contentSecurityPolicy: string, isProduction: boolean): readonly SecurityHeader[] {
  const headers: SecurityHeader[] = [
    { name: "Content-Security-Policy", value: contentSecurityPolicy },
    { name: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { name: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(), payment=(), usb=()" },
    { name: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { name: "X-Content-Type-Options", value: "nosniff" },
    { name: "X-Frame-Options", value: "DENY" },
  ];

  if (isProduction) {
    headers.push({ name: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" });
  }

  return headers;
}

export function isSensitiveApplicationPath(pathname: string): boolean {
  return pathname.startsWith("/dashboard")
    || pathname.startsWith("/actualizar-contrasena")
    || pathname.startsWith("/auth")
    || pathname.startsWith("/login")
    || pathname.startsWith("/recuperar-contrasena")
    || pathname.startsWith("/registro");
}
