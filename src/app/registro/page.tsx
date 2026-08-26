import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { signUpAction } from "@/features/auth/actions";
import { getAuthMessage } from "@/features/auth/messages";
import { getAuthenticatedUserId } from "@/features/auth/session";

type SignUpPageProperties = Readonly<{
  searchParams: Promise<{ error?: string }>;
}>;

export default async function SignUpPage({ searchParams }: SignUpPageProperties): Promise<React.ReactNode> {
  const authenticatedUserId = await getAuthenticatedUserId();
  if (authenticatedUserId !== null) {
    redirect("/dashboard");
  }

  const parameters = await searchParams;

  return (
    <AuthCard description="Crea tu perfil para dar seguimiento a tu participación." footer={<><span>¿Ya tienes cuenta?</span> <Link href="/login">Iniciar sesión</Link></>} message={getAuthMessage(parameters.error)} title="Únete a la comunidad">
      <form action={signUpAction} className="auth-form">
        <label>Nombre para mostrar<input autoComplete="name" maxLength={80} minLength={2} name="displayName" required type="text" /></label>
        <label>Correo electrónico<input autoComplete="email" name="email" required type="email" /></label>
        <label>Contraseña<input autoComplete="new-password" maxLength={72} minLength={10} name="password" required type="password" /></label>
        <label>Confirmar contraseña<input autoComplete="new-password" maxLength={72} minLength={10} name="confirmPassword" required type="password" /></label>
        <p className="auth-form__note">Usa entre 10 y 72 caracteres. Nunca compartas tu contraseña.</p>
        <button className="button button--primary" type="submit">Crear cuenta</button>
      </form>
    </AuthCard>
  );
}
