import { CalendarDays, LayoutDashboard, PlusCircle } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SiteHeader } from "@/components/layout/site-header";
import { getAuthenticatedAppRole, getAuthenticatedUserId } from "@/features/auth/session";

type AdminLayoutProperties = Readonly<{
  children: React.ReactNode;
}>;

export default async function AdminLayout({ children }: AdminLayoutProperties): Promise<React.ReactNode> {
  const userId = await getAuthenticatedUserId();
  if (userId === null) {
    redirect("/login?next=/dashboard/admin/eventos");
  }

  const role = await getAuthenticatedAppRole(userId);
  if (role !== "ADMIN") {
    redirect("/dashboard?error=admin_required");
  }

  return (
    <div className="page-shell">
      <SiteHeader activePage="dashboard-preview" />
      <main className="content-wrap admin-shell">
        <header className="admin-heading"><div><p className="eyebrow">ADMINISTRACIÓN</p><h1>Panel de eventos</h1><p>Gestiona contenido publicable sin modificar código.</p></div><Link className="button button--primary" href="/dashboard/admin/eventos/nuevo"><PlusCircle size={16} /> Nuevo evento</Link></header>
        <nav aria-label="Navegación administrativa" className="admin-nav"><Link href="/dashboard/admin/eventos"><CalendarDays size={16} /> Eventos</Link><Link href="/dashboard"><LayoutDashboard size={16} /> Dashboard personal</Link></nav>
        {children}
      </main>
    </div>
  );
}
