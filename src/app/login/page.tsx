import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { signInAction } from "@/features/auth/actions";
import { getAuthMessage } from "@/features/auth/messages";
import { getAuthenticatedUserId } from "@/features/auth/session";

type LoginPageProperties = Readonly<{
  searchParams: Promise<{ error?: string; status?: string }>;
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
        <label>Correo electrónico<input autoComplete="email" name="email" required type="email" /></label>
        <label>Contraseña<input autoComplete="current-password" minLength={10} name="password" required type="password" /></label>
        <Link className="auth-form__help" href="/recuperar-contrasena">Olvidé mi contraseña</Link>
        <button className="button button--primary" type="submit">Ingresar</button>
      </form>
    </AuthCard>
  );
}
