import { FileCheck2, FileClock, ShieldAlert } from "lucide-react";

import { SubmitButton } from "@/components/forms/submit-button";
import { approveAndPublishLegalDocumentAction, createLegalDocumentAction } from "@/features/privacy/actions";
import { listAdminLegalDocuments } from "@/features/privacy/queries";
import { legalDocumentTypeLabels, legalReviewStatusLabels } from "@/features/privacy/types";

export const dynamic = "force-dynamic";

type AdminLegalPageProperties = Readonly<{
  searchParams: Promise<{ error?: string; status?: string }>;
}>;

const messages: Readonly<Record<string, string>> = {
  document_published: "La versión aprobada fue publicada y la anterior quedó en el historial.",
  draft_created: "El borrador legal fue creado. Requiere una referencia de aprobación antes de publicarse.",
  invalid_approval: "La referencia de aprobación debe tener entre 3 y 240 caracteres.",
  invalid_document: "Revisa el tipo, versión, fecha y contenido del documento.",
};

export default async function AdminLegalPage({ searchParams }: AdminLegalPageProperties): Promise<React.ReactNode> {
  const [documents, parameters] = await Promise.all([listAdminLegalDocuments(), searchParams]);
  const messageCode = parameters.error ?? parameters.status;
  const message = messageCode === undefined ? null : messages[messageCode] ?? null;

  return (
    <section className="admin-section">
      {message === null ? null : <div aria-live="polite" className="auth-message">{message}</div>}
      <div className="admin-section__heading"><div><h2>Privacidad y documentos legales</h2><p>{documents.length} versiones conservadas. Las versiones publicadas son inmutables desde la interfaz.</p></div></div>
      <div className="legal-admin-grid">
        <section className="surface admin-form">
          <div className="admin-form__heading"><div><p className="eyebrow"><FileClock size={14} /> NUEVO BORRADOR</p><h2>Crear una versión</h2></div></div>
          <form action={createLegalDocumentAction} className="admin-form__grid">
            <label>Tipo<select name="documentType" required><option value="PRIVACY_NOTICE">Privacidad</option><option value="TERMS_OF_USE">Términos de uso</option><option value="COOKIE_NOTICE">Cookies</option></select></label>
            <label>Versión<input maxLength={40} minLength={3} name="version" placeholder="2026-09-01" required /></label>
            <label className="admin-form__wide">Título<input maxLength={160} minLength={5} name="title" required /></label>
            <label className="admin-form__wide">Resumen<textarea maxLength={500} minLength={10} name="summary" required rows={3} /></label>
            <label className="admin-form__wide">Contenido<textarea maxLength={20000} minLength={100} name="content" required rows={14} /></label>
            <label>Fecha de vigencia<input name="effectiveAt" required type="date" /></label>
            <div className="admin-form__footer admin-form__wide"><SubmitButton className="button button--primary" pendingLabel="Creando…">Crear borrador</SubmitButton></div>
          </form>
        </section>

        <section className="legal-admin-list">
          {documents.map((document) => {
            const publishAction = approveAndPublishLegalDocumentAction.bind(null, document.id);
            return <article className="surface legal-admin-card" key={document.id}><div className="legal-admin-card__heading"><span aria-hidden="true">{document.status === "DRAFT" ? <FileClock size={20} /> : <FileCheck2 size={20} />}</span><div><p className="eyebrow">{legalDocumentTypeLabels[document.documentType]} · {document.version}</p><h3>{document.title}</h3></div></div><p>{document.summary}</p><div className="legal-admin-card__meta"><span>{document.status}</span><span>{legalReviewStatusLabels[document.reviewStatus]}</span>{document.isCurrent ? <strong>Vigente</strong> : null}</div>{document.status !== "DRAFT" ? null : <form action={publishAction} className="legal-publish-form"><label><ShieldAlert size={14} /> Referencia de aprobación<input maxLength={240} minLength={3} name="approvalReference" placeholder="Acta, ticket o responsable y fecha" required /></label><SubmitButton className="button button--primary" pendingLabel="Publicando…">Aprobar y publicar</SubmitButton></form>}</article>;
          })}
        </section>
      </div>
    </section>
  );
}
