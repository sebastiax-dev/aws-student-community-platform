"use client";

import { useState } from "react";

import { getSafeAuthenticationRedirectPath, UnsafeAuthenticationRedirectError } from "@/features/auth/redirect";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type GoogleSignInButtonProperties = Readonly<{
  nextPath: string;
}>;

export function GoogleSignInButton({ nextPath }: GoogleSignInButtonProperties): React.ReactNode {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const signInWithGoogle = async (): Promise<void> => {
    setErrorMessage(null);

    let safeNextPath: string;
    try {
      safeNextPath = getSafeAuthenticationRedirectPath(nextPath, "/dashboard");
    } catch (error) {
      if (error instanceof UnsafeAuthenticationRedirectError) {
        setErrorMessage("El destino de inicio de sesión no es válido.");
        return;
      }
      throw error;
    }

    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", safeNextPath);
    const supabase = createSupabaseBrowserClient();
    const result = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl.toString() },
    });

    if (result.error !== null || result.data.url === null) {
      setErrorMessage("Google no está disponible para iniciar sesión. Inténtalo nuevamente o usa tu correo y contraseña.");
      return;
    }

    window.location.assign(result.data.url);
  };

  return <div className="auth-google">
    <div aria-hidden="true" className="auth-google__divider"><span>o</span></div>
    <button className="auth-google__button" onClick={signInWithGoogle} type="button"><span aria-hidden="true" className="auth-google__mark">G</span>Continuar con Google</button>
    {errorMessage === null ? null : <p aria-live="polite" className="auth-google__error">{errorMessage}</p>}
  </div>;
}
