import { redirect } from "next/navigation";

import { DashboardNavigation } from "@/components/dashboard/dashboard-navigation";
import { DashboardProgress } from "@/components/dashboard/dashboard-progress";
import { SiteHeader } from "@/components/layout/site-header";
import { getAuthenticatedUserId } from "@/features/auth/session";
import { getDashboardData } from "@/features/dashboard/queries";

export const dynamic = "force-dynamic";

export default async function DashboardProgressPage(): Promise<React.ReactNode> {
  const userId = await getAuthenticatedUserId();
  if (userId === null) {
    redirect("/login?next=/dashboard/progreso");
  }
  const data = await getDashboardData(userId);

  return <div className="page-shell"><SiteHeader activePage="dashboard-preview" /><main className="content-wrap dashboard-shell"><DashboardNavigation activePage="progress" role={data.role} /><section className="dashboard-page-heading"><p className="eyebrow">CRECIMIENTO</p><h1>Mi progreso</h1><p>Consulta el historial verificable de puntos y certificaciones emitidas por la comunidad.</p></section><DashboardProgress data={data} limit={50} /></main></div>;
}
