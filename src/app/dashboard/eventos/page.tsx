import { redirect } from "next/navigation";

import { DashboardNavigation } from "@/components/dashboard/dashboard-navigation";
import { MyEventsList } from "@/components/dashboard/my-events-list";
import { SiteHeader } from "@/components/layout/site-header";
import { getAuthenticatedUserId } from "@/features/auth/session";
import { getDashboardData } from "@/features/dashboard/queries";

export const dynamic = "force-dynamic";

export default async function DashboardEventsPage(): Promise<React.ReactNode> {
  const userId = await getAuthenticatedUserId();
  if (userId === null) {
    redirect("/login?next=/dashboard/eventos");
  }
  const data = await getDashboardData(userId);

  return <div className="page-shell"><SiteHeader activePage="dashboard-preview" /><main className="content-wrap dashboard-shell"><DashboardNavigation activePage="events" role={data.role} /><section className="dashboard-page-heading"><p className="eyebrow">PARTICIPACIÓN</p><h1>Mis eventos</h1><p>Este historial se crea cuando inicias una inscripción con tu cuenta.</p></section><MyEventsList registrations={data.registrations} /></main></div>;
}
