import { FileCheck2, ShieldAlert } from "lucide-react";

import type { LegalDocument } from "@/features/privacy/types";

type LegalDocumentViewProperties = Readonly<{
  document: LegalDocument;
}>;

export function LegalDocumentView({ document }: LegalDocumentViewProperties): React.ReactNode {
  const effectiveDate = document.effectiveAt === null
    ? "Sin fecha de vigencia"
    : new Intl.DateTimeFormat("es-EC", { dateStyle: "long", timeZone: "UTC" }).format(new Date(document.effectiveAt));

  return (
    <article className="legal-document surface">
      <header className="legal-document__heading">
        <span aria-hidden="true" className="legal-document__icon"><FileCheck2 size={28} /></span>
        <div><p className="eyebrow">VERSIÓN {document.version}</p><h1>{document.title}</h1><p>{document.summary}</p></div>
      </header>
      {document.reviewStatus === "PENDING_REVIEW" ? <div className="legal-review-warning"><ShieldAlert size={18} /><p><strong>Versión técnica preliminar.</strong> Requiere validación institucional y jurídica antes de producción.</p></div> : null}
      <div className="legal-document__content">{document.content.split(/\n{2,}/u).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
      <footer><span>Vigencia: {effectiveDate}</span><span>Estado: {document.reviewStatus === "APPROVED" ? "Aprobado" : "Revisión pendiente"}</span></footer>
    </article>
  );
}
