import { redirect } from "next/navigation";

import { DashboardNavigation } from "@/components/dashboard/dashboard-navigation";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { SiteHeader } from "@/components/layout/site-header";
import { getAuthenticatedUserId } from "@/features/auth/session";
import { getDashboardData } from "@/features/dashboard/queries";

export const dynamic = "force-dynamic";

type DashboardProfilePageProperties = Readonly<{
  searchParams: Promise<{ error?: string; status?: string }>;
}>;

const messages: Readonly<Record<string, string>> = {
  invalid_display_name: "El nombre debe tener entre 2 y 80 caracteres.",
  updated: "Tu perfil fue actualizado correctamente.",
};

export default async function DashboardProfilePage({ searchParams }: DashboardProfilePageProperties): Promise<React.ReactNode> {
  const userId = await getAuthenticatedUserId();
  if (userId === null) {
    redirect("/login?next=/dashboard/perfil");
  }
  const [data, parameters] = await Promise.all([getDashboardData(userId), searchParams]);
  const messageCode = parameters.error ?? parameters.status;
  const message = messageCode === undefined ? null : messages[messageCode] ?? null;

  return <div className="page-shell"><SiteHeader activePage="dashboard-preview" /><main className="content-wrap dashboard-shell"><DashboardNavigation activePage="profile" role={data.role} />{message === null ? null : <div aria-live="polite" className="auth-message">{message}</div>}<ProfileForm data={data} /><section className="surface dashboard-profile-note" id="configuracion"><h2>Configuración de cuenta</h2><p>El correo y la contraseña se administran mediante Supabase Auth. La actualización de contraseña estará disponible desde el flujo de recuperación seguro.</p></section></main></div>;
}
