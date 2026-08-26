import { Save } from "lucide-react";

import { SubmitButton } from "@/components/forms/submit-button";
import { updateDashboardProfileAction } from "@/features/dashboard/actions";
import type { DashboardData } from "@/features/dashboard/types";

type ProfileFormProperties = Readonly<{
  data: DashboardData;
}>;

export function ProfileForm({ data }: ProfileFormProperties): React.ReactNode {
  return <form action={updateDashboardProfileAction} className="admin-form surface dashboard-profile-form"><div className="admin-form__heading"><div><p className="eyebrow">PERFIL</p><h1>Mi perfil</h1><p>Solo tú puedes editar este nombre desde tu sesión.</p></div></div><div className="admin-form__grid"><label className="admin-form__wide">Nombre visible<input defaultValue={data.profile.display_name} maxLength={80} minLength={2} name="displayName" required type="text" /></label><div className="dashboard-profile-form__meta"><span>Rol: <strong>{data.role}</strong></span><span>Miembro desde {new Intl.DateTimeFormat("es-EC", { dateStyle: "medium", timeZone: "America/Guayaquil" }).format(new Date(data.profile.created_at))}</span></div></div><div className="admin-form__footer"><SubmitButton className="button button--primary" pendingLabel="Guardando…"><Save size={16} /> Guardar perfil</SubmitButton></div></form>;
}
