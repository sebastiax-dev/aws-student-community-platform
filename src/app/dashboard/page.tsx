import { ArrowRight, Award, Medal } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DashboardNavigation } from "@/components/dashboard/dashboard-navigation";
import { DashboardProgress } from "@/components/dashboard/dashboard-progress";
import { DashboardSummary } from "@/components/dashboard/dashboard-summary";
import { DashboardFutureVisual } from "@/components/dashboard/dashboard-future-visual";
import { MyEventsList } from "@/components/dashboard/my-events-list";
import { SiteHeader } from "@/components/layout/site-header";
import { getAuthenticatedUserId } from "@/features/auth/session";
import { getDashboardData } from "@/features/dashboard/queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage(): Promise<React.ReactNode> {
  const userId = await getAuthenticatedUserId();
  if (userId === null) {
    redirect("/login?next=/dashboard");
  }
  const data = await getDashboardData(userId);

  return <div className="page-shell"><SiteHeader activePage="dashboard-preview" /><main className="content-wrap dashboard-shell"><DashboardNavigation activePage="overview" role={data.role} /><DashboardSummary data={data} /><section className="dashboard-content-grid"><section className="dashboard-section"><div className="section-heading"><div><p className="eyebrow">PARTICIPACIÓN</p><h2>Mis eventos</h2></div><Link className="section-link" href="/dashboard/eventos">Ver historial <ArrowRight size={15} /></Link></div><MyEventsList registrations={data.registrations.slice(0, 3)} /></section><aside className="surface dashboard-future-card"><DashboardFutureVisual /><Medal size={30} /><h2>Tu progreso crece con cada participación</h2><p>{data.stats.total_points} puntos y {data.stats.total_certifications} certificaciones registrados en tu historial verificable.</p><Link className="section-link" href="/dashboard/progreso"><Award size={15} /> Ver mi progreso</Link></aside></section><DashboardProgress data={data} limit={3} /></main></div>;
}
