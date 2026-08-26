import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { requestPasswordResetAction } from "@/features/auth/actions";
import { getAuthMessage } from "@/features/auth/messages";

type PasswordResetPageProperties = Readonly<{
  searchParams: Promise<{ error?: string }>;
}>;

export default async function PasswordResetPage({ searchParams }: PasswordResetPageProperties): Promise<React.ReactNode> {
  const parameters = await searchParams;

  return (
    <AuthCard description="Te enviaremos un enlace seguro si el correo corresponde a una cuenta." footer={<Link href="/login">Volver a iniciar sesión</Link>} message={getAuthMessage(parameters.error)} title="Recuperar contraseña">
      <form action={requestPasswordResetAction} className="auth-form">
        <label>Correo electrónico<input autoComplete="email" name="email" required type="email" /></label>
        <button className="button button--primary" type="submit">Enviar instrucciones</button>
      </form>
    </AuthCard>
  );
}
