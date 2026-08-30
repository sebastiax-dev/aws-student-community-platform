import { notFound } from "next/navigation";

import { SiteHeader } from "@/components/layout/site-header";
import { LegalDocumentView } from "@/components/privacy/legal-document-view";
import { getCurrentLegalDocument } from "@/features/privacy/queries";

export const dynamic = "force-dynamic";

export default async function PrivacyPage(): Promise<React.ReactNode> {
  const document = await getCurrentLegalDocument("PRIVACY_NOTICE");
  if (document === null) {
    notFound();
  }
  return <div className="page-shell"><SiteHeader activePage={null} /><main className="content-wrap legal-page"><LegalDocumentView document={document} /></main></div>;
}
