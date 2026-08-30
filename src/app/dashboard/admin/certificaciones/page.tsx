import { Award, Search } from "lucide-react";

import { CertificationManager } from "@/components/admin/certification-manager";
import { listAdminUsers } from "@/features/admin/queries";

export const dynamic = "force-dynamic";

type AdminCertificationsPageProperties = Readonly<{
  searchParams: Promise<{ buscar?: string; error?: string; status?: string }>;
}>;

export default async function AdminCertificationsPage({ searchParams }: AdminCertificationsPageProperties): Promise<React.ReactNode> {
  const parameters = await searchParams;
  const search = parameters.buscar?.trim() ?? "";
  const users = await listAdminUsers(search);
  return (
    <section className="admin-section">
      {parameters.status === "certifications_updated" ? <div aria-live="polite" className="auth-message">Las certificaciones del usuario fueron actualizadas.</div> : null}
      {parameters.error === "invalid_total" ? <div aria-live="polite" className="auth-message auth-message--error">El total debe estar entre 0 y 100.</div> : null}
      <div className="admin-section__heading"><div><h2>Gestión de certificaciones</h2><p>Busca un usuario y administra sus reconocimientos desde una ventana dedicada.</p></div><span className="admin-count">{users.length}</span></div>
      <form className="surface admin-search" method="get"><label><span className="sr-only">Buscar usuario</span><Search size={17} /><input defaultValue={search} name="buscar" placeholder="Nombre o correo electrónico" /></label><button className="button button--primary" type="submit">Buscar usuario</button></form>
      {users.length === 0 ? <div className="empty-state surface"><Award size={30} /><h3>No se encontraron usuarios</h3><p>Prueba con otro criterio de búsqueda.</p></div> : <CertificationManager users={users} />}
    </section>
  );
}
