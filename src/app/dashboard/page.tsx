import { LogOut, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SiteHeader } from "@/components/layout/site-header";
import { signOutAction } from "@/features/auth/actions";
import { IdentityQueryError } from "@/features/auth/errors";
import { getAuthenticatedUserId } from "@/features/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage(): Promise<React.ReactNode> {
  const authenticatedUserId = await getAuthenticatedUserId();
  if (authenticatedUserId === null) {
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient();
  const [profileResult, roleResult] = await Promise.all([
    supabase.from("profiles").select("display_name, created_at").eq("id", authenticatedUserId).single(),
    supabase.from("user_roles").select("role").eq("user_id", authenticatedUserId).single(),
  ]);

  if (profileResult.error !== null) {
    throw new IdentityQueryError("profiles", profileResult.error.code, profileResult.error.details, profileResult.error.message);
  }
  if (roleResult.error !== null) {
    throw new IdentityQueryError("user_roles", roleResult.error.code, roleResult.error.details, roleResult.error.message);
  }

  return (
    <div className="page-shell">
      <SiteHeader activePage="dashboard-preview" />
      <main className="account-shell content-wrap">
        <section className="account-heading"><p className="eyebrow">ÁREA PRIVADA</p><h1>Hola, {profileResult.data.display_name}</h1><p>Tu identidad está protegida por sesión SSR y políticas RLS.</p></section>
        <section className="account-grid">
          <article className="account-card surface"><span className="account-card__icon"><UserRound /></span><div><p>Perfil</p><strong>{profileResult.data.display_name}</strong><span>Miembro desde {new Intl.DateTimeFormat("es-EC", { dateStyle: "medium", timeZone: "America/Guayaquil" }).format(new Date(profileResult.data.created_at))}</span></div></article>
          <article className="account-card surface"><span className="account-card__icon"><ShieldCheck /></span><div><p>Rol de acceso</p><strong>{roleResult.data.role}</strong><span>El rol no puede modificarse desde el cliente.</span></div></article>
        </section>
        <section className="surface account-placeholder"><h2>Tu progreso llegará en la Fase 5</h2><p>Eventos inscritos, asistencia, certificaciones y puntos se conectarán después de implementar sus modelos y reglas.</p><a className="button button--secondary" href="/preview/dashboard">Ver prototipo visual</a></section>
        {roleResult.data.role === "ADMIN" ? <section className="surface account-placeholder"><h2>Administración habilitada</h2><p>Tu rol permite crear, editar y publicar eventos mediante controles protegidos por RLS.</p><Link className="button button--primary" href="/dashboard/admin/eventos">Administrar eventos</Link></section> : null}
        <form action={signOutAction}><button className="button button--secondary" type="submit"><LogOut size={17} /> Cerrar sesión</button></form>
      </main>
    </div>
  );
}
