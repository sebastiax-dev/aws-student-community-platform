import { Search, Sparkles } from "lucide-react";

import { PointsManager } from "@/components/admin/points-manager";
import { listAdminUsers } from "@/features/admin/queries";

export const dynamic = "force-dynamic";

type AdminPointsPageProperties = Readonly<{
  searchParams: Promise<{ buscar?: string; error?: string; status?: string }>;
}>;

export default async function AdminPointsPage({ searchParams }: AdminPointsPageProperties): Promise<React.ReactNode> {
  const parameters = await searchParams;
  const search = parameters.buscar?.trim() ?? "";
  const users = await listAdminUsers(search);
  return <section className="admin-section">
    {parameters.status === "points_adjusted" ? <div aria-live="polite" className="auth-message">El ajuste de puntos fue registrado correctamente.</div> : null}
    {parameters.error === "invalid_adjustment" ? <div aria-live="polite" className="auth-message auth-message--error">Ingresa entre -1000 y 1000 puntos, distinto de cero, y explica el motivo.</div> : null}
    <div className="admin-section__heading"><div><h2>Gestión de puntos</h2><p>Busca un usuario y aplica ajustes manuales justificados sin alterar el código.</p></div><span className="admin-count">{users.length}</span></div>
    <form className="surface admin-search" method="get"><label><span className="sr-only">Buscar usuario</span><Search size={17} /><input defaultValue={search} name="buscar" placeholder="Nombre o correo electrónico" /></label><button className="button button--primary" type="submit">Buscar usuario</button></form>
    {users.length === 0 ? <div className="empty-state surface"><Sparkles size={30} /><h3>No se encontraron usuarios</h3><p>Prueba con otro criterio de búsqueda.</p></div> : <PointsManager users={users} />}
  </section>;
}
