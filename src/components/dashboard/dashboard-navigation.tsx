import { Award, CalendarDays, LayoutDashboard, LogOut, Settings, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";

import { SubmitButton } from "@/components/forms/submit-button";
import { signOutAction } from "@/features/auth/actions";
import type { AppRole } from "@/features/auth/session";

type DashboardNavigationProperties = Readonly<{
  activePage: "events" | "overview" | "privacy" | "profile" | "progress";
  role: AppRole;
}>;

const navigationItems: readonly Readonly<{
  Icon: typeof LayoutDashboard;
  href: string;
  id: DashboardNavigationProperties["activePage"];
  label: string;
}>[] = [
  { Icon: LayoutDashboard, href: "/dashboard", id: "overview", label: "Resumen" },
  { Icon: CalendarDays, href: "/dashboard/eventos", id: "events", label: "Mis eventos" },
  { Icon: Award, href: "/dashboard/progreso", id: "progress", label: "Mi progreso" },
  { Icon: UserRound, href: "/dashboard/perfil", id: "profile", label: "Mi perfil" },
];

export function DashboardNavigation({ activePage, role }: DashboardNavigationProperties): React.ReactNode {
  return (
    <nav aria-label="Navegación personal" className="dashboard-navigation surface">
      <div className="dashboard-navigation__links">{navigationItems.map(({ Icon, href, id, label }) => <Link data-active={id === activePage} href={href} key={id}><Icon size={16} /> {label}</Link>)}</div>
      <div className="dashboard-navigation__actions">{role === "ADMIN" ? <Link href="/dashboard/admin/eventos"><ShieldCheck size={16} /> Administración</Link> : null}<Link href="/dashboard/perfil#configuracion"><Settings size={16} /> Configuración</Link><form action={signOutAction}><SubmitButton className="dashboard-navigation__signout" pendingLabel="Saliendo…"><LogOut size={16} /> Cerrar sesión</SubmitButton></form></div>
    </nav>
  );
}
