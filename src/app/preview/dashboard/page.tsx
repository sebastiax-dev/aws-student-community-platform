import { DashboardPreview } from "@/components/dashboard/dashboard-preview";
import { SiteHeader } from "@/components/layout/site-header";

export default function DashboardPreviewPage(): React.ReactNode {
  return (
    <div className="page-shell">
      <SiteHeader activePage="dashboard-preview" />
      <DashboardPreview />
    </div>
  );
}
