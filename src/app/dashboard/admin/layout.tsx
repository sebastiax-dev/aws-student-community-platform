import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminNavigation } from "@/components/admin/admin-navigation";
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
        <header className="admin-heading"><div><p className="eyebrow">ADMINISTRACIÓN</p><h1>Centro de control</h1><p>Gestiona eventos, personas, contenidos, contactos y reconocimientos sin modificar código.</p></div><Link className="button button--primary" href="/dashboard/admin/eventos/nuevo"><PlusCircle size={16} /> Nuevo evento</Link></header>
        <AdminNavigation />
        {children}
      </main>
    </div>
  );
}
