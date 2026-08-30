import { Search, ShieldCheck, UserRound } from "lucide-react";

import { setUserRoleAction } from "@/features/admin/actions";
import { listAdminUsers } from "@/features/admin/queries";

export const dynamic = "force-dynamic";

type AdminUsersPageProperties = Readonly<{
  searchParams: Promise<{ buscar?: string; error?: string; status?: string }>;
}>;

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProperties): Promise<React.ReactNode> {
  const parameters = await searchParams;
  const search = parameters.buscar?.trim() ?? "";
  const users = await listAdminUsers(search);
  return (
    <section className="admin-section">
      {parameters.status === "role_updated" ? <div aria-live="polite" className="auth-message">El rol del usuario fue actualizado.</div> : null}
      {parameters.error === "invalid_role" ? <div aria-live="polite" className="auth-message auth-message--error">Selecciona un rol válido.</div> : null}
      <div className="admin-section__heading"><div><h2>Gestión de usuarios</h2><p>Busca por nombre o correo y consulta su participación.</p></div><span className="admin-count">{users.length}</span></div>
      <form className="surface admin-search" method="get"><label><span className="sr-only">Buscar usuario</span><Search size={17} /><input defaultValue={search} name="buscar" placeholder="Nombre o correo electrónico" /></label><button className="button button--primary" type="submit">Buscar usuario</button></form>
      {users.length === 0 ? <div className="empty-state surface"><UserRound size={30} /><h3>No se encontraron usuarios</h3><p>Prueba con otro nombre o correo electrónico.</p></div> : <div className="admin-user-list">{users.map((user) => {
        const roleAction = setUserRoleAction.bind(null, user.user_id);
        return <article className="surface admin-user-card" key={user.user_id}><div className="admin-user-card__identity"><span><UserRound size={18} /></span><div><h3>{user.display_name}</h3><p>{user.email}</p><small>Miembro desde {new Intl.DateTimeFormat("es-EC", { dateStyle: "medium", timeZone: "America/Guayaquil" }).format(new Date(user.created_at))}</small></div></div><div className="admin-user-card__stats"><span>Eventos<strong>{user.registration_count}</strong></span><span>Asistencias<strong>{user.attendance_count}</strong></span><span>Certificaciones<strong>{user.total_certifications}</strong></span><span>Puntos<strong>{user.total_points}</strong></span></div><form action={roleAction} className="admin-user-card__role"><label><ShieldCheck size={14} /> Rol<select defaultValue={user.role} name="role"><option value="USER">Usuario</option><option value="ADMIN">Administrador</option></select></label><button className="button button--secondary" type="submit">Guardar rol</button></form></article>;
      })}</div>}
    </section>
  );
}
