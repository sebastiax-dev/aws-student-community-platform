import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { updatePasswordAction } from "@/features/auth/actions";
import { getAuthMessage } from "@/features/auth/messages";
import { getAuthenticatedUserId } from "@/features/auth/session";

type UpdatePasswordPageProperties = Readonly<{
  searchParams: Promise<{ error?: string }>;
}>;

export default async function UpdatePasswordPage({ searchParams }: UpdatePasswordPageProperties): Promise<React.ReactNode> {
  const authenticatedUserId = await getAuthenticatedUserId();
  if (authenticatedUserId === null) {
    redirect("/login?error=invalid_callback");
  }

  const parameters = await searchParams;

  return (
    <AuthCard description="Define una contraseña nueva para proteger tu cuenta." footer={null} message={getAuthMessage(parameters.error)} title="Actualizar contraseña">
      <form action={updatePasswordAction} className="auth-form">
        <label>Nueva contraseña<input autoComplete="new-password" maxLength={72} minLength={10} name="password" required type="password" /></label>
        <label>Confirmar contraseña<input autoComplete="new-password" maxLength={72} minLength={10} name="confirmPassword" required type="password" /></label>
        <button className="button button--primary" type="submit">Guardar contraseña</button>
      </form>
    </AuthCard>
  );
}
