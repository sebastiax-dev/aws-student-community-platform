import { CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DashboardNavigation } from "@/components/dashboard/dashboard-navigation";
import { SubmitButton } from "@/components/forms/submit-button";
import { SiteHeader } from "@/components/layout/site-header";
import { getAuthenticatedUserId } from "@/features/auth/session";
import { getDashboardData } from "@/features/dashboard/queries";
import { acceptCurrentLegalDocumentsAction } from "@/features/privacy/actions";
import { getCurrentRequiredLegalDocuments, listOwnLegalAcceptances } from "@/features/privacy/queries";

export const dynamic = "force-dynamic";

type DashboardPrivacyPageProperties = Readonly<{
  searchParams: Promise<{ status?: string }>;
}>;

export default async function DashboardPrivacyPage({ searchParams }: DashboardPrivacyPageProperties): Promise<React.ReactNode> {
  const userId = await getAuthenticatedUserId();
  if (userId === null) {
    redirect("/login?next=/dashboard/privacidad");
  }

  const [dashboard, documents, acceptances, parameters] = await Promise.all([
    getDashboardData(userId),
    getCurrentRequiredLegalDocuments(),
    listOwnLegalAcceptances(userId),
    searchParams,
  ]);
  const acceptedIds = new Set(acceptances.map((acceptance) => acceptance.documentId));
  const hasCurrentAcceptance = documents !== null && acceptedIds.has(documents.privacy.id) && acceptedIds.has(documents.terms.id);

  return (
    <div className="page-shell">
      <SiteHeader activePage="dashboard-preview" />
      <main className="content-wrap dashboard-shell">
        <DashboardNavigation activePage="privacy" role={dashboard.role} />
        {parameters.status === "accepted" ? <div aria-live="polite" className="auth-message">Tus aceptaciones legales quedaron registradas.</div> : null}
        <section className="dashboard-page-heading"><p className="eyebrow">PRIVACIDAD</p><h1>Preferencias y documentos</h1><p>Consulta las versiones vigentes y el registro mínimo asociado a tu cuenta.</p></section>
        <section className="dashboard-progress-grid">
          <article className="surface progress-panel"><div className="progress-panel__heading"><div><p className="eyebrow"><ShieldCheck size={14} /> ESTADO</p><h2>Documentos vigentes</h2></div>{hasCurrentAcceptance ? <CheckCircle2 color="#4fd29a" size={30} /> : null}</div>{documents === null ? <p className="progress-panel__empty">Los documentos obligatorios no están disponibles. El registro debe permanecer cerrado.</p> : <ul className="legal-acceptance-list"><li><Link href="/privacidad">{documents.privacy.title}</Link><span>Versión {documents.privacy.version}</span></li><li><Link href="/terminos">{documents.terms.title}</Link><span>Versión {documents.terms.version}</span></li></ul>}{hasCurrentAcceptance ? <p className="progress-panel__empty">Ya aceptaste las versiones vigentes.</p> : documents === null ? null : <form action={acceptCurrentLegalDocumentsAction}><SubmitButton className="button button--primary" pendingLabel="Registrando…">Aceptar versiones vigentes</SubmitButton></form>}</article>
          <article className="surface progress-panel"><div className="progress-panel__heading"><div><p className="eyebrow">TRAZABILIDAD</p><h2>Historial de aceptación</h2></div><strong>{acceptances.length}</strong></div>{acceptances.length === 0 ? <p className="progress-panel__empty">Esta cuenta todavía no tiene aceptaciones registradas.</p> : <ul className="legal-acceptance-list">{acceptances.map((acceptance) => <li key={`${acceptance.documentId}-${acceptance.acceptedAt}`}><span>{new Intl.DateTimeFormat("es-EC", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Guayaquil" }).format(new Date(acceptance.acceptedAt))}</span><small>{acceptance.source === "SIGN_UP" ? "Registro" : "Reaceptación"}</small></li>)}</ul>}</article>
        </section>
      </main>
    </div>
  );
}
