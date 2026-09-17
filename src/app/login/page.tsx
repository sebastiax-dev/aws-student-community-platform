import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { PasswordField } from "@/components/auth/password-field";
import { signInAction } from "@/features/auth/actions";
import { getAuthMessage } from "@/features/auth/messages";
import { getAuthenticatedUserId } from "@/features/auth/session";

type LoginPageProperties = Readonly<{
  searchParams: Promise<{ error?: string; next?: string; status?: string }>;
}>;

export default async function LoginPage({ searchParams }: LoginPageProperties): Promise<React.ReactNode> {
  const authenticatedUserId = await getAuthenticatedUserId();
  if (authenticatedUserId !== null) {
    redirect("/dashboard");
  }

  const parameters = await searchParams;
  const messageCode = parameters.error === undefined ? parameters.status : parameters.error;

  return (
    <AuthCard description="Accede a tu progreso, eventos y certificaciones." footer={<><span>¿Aún no tienes cuenta?</span> <Link href="/registro">Crear cuenta</Link></>} message={getAuthMessage(messageCode)} title="Iniciar sesión">
      <form action={signInAction} className="auth-form">
        <input name="next" type="hidden" value={parameters.next ?? "/dashboard"} />
        <label>Correo electrónico<input autoComplete="email" name="email" required type="email" /></label>
        <label>Contraseña<PasswordField autoComplete="current-password" minLength={10} name="password" /></label>
        <label className="auth-form__checkbox"><input defaultChecked name="rememberSession" type="checkbox" /> Mantener mi sesión iniciada en este dispositivo</label>
        <Link className="auth-form__help" href="/recuperar-contrasena">Olvidé mi contraseña</Link>
        <button className="button button--primary" type="submit">Ingresar</button>
      </form>
      <GoogleSignInButton nextPath={parameters.next ?? "/dashboard"} />
    </AuthCard>
  );
}
